import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueueService } from './notifications-queue.service';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const CHANNEL_LABELS: Record<string, string> = {
  websocket: 'In-app',
};

function extractMessage(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.title === 'string' && record.title.trim()) return record.title;
    if (typeof record.message === 'string' && record.message.trim()) return record.message;
  }
  return '';
}

function extractCategory(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.category === 'string') return record.category;
  }
  return undefined;
}

type Preferences = {
  mentions: boolean;
  comments: boolean;
  newFollowers: boolean;
  orderShipped: boolean;
  orderDelivered: boolean;
  orderDelayed: boolean;
  systemSecurity: boolean;
  systemUpdates: boolean;
};

// Security alerts are required and always pass — see UsersService.updatePreferences,
// which won't let systemSecurity be turned off in the first place either.
function isAllowedByPreferences(preferences: Preferences, type: string, category?: string): boolean {
  switch (type) {
    case 'mention':
      return preferences.mentions;
    case 'order':
      if (category === 'shipped') return preferences.orderShipped;
      if (category === 'delivered') return preferences.orderDelivered;
      if (category === 'delayed') return preferences.orderDelayed;
      return true;
    case 'system':
      if (category === 'updates') return preferences.systemUpdates;
      return true;
    default:
      // Types with no matching preference (e.g. "task", the demo test button)
      // aren't gated — there's nothing for the user to have opted out of.
      return true;
  }
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueueService: NotificationQueueService,
    private readonly users: UsersService,
  ) {}

  // senderId defaults to the recipient — a notification a user creates for
  // themselves (the dashboard's "send test notification") is self-sent. When
  // an admin dispatches to someone else, senderId is explicitly the admin.
  // Returns null when the recipient has this notification category turned
  // off in Settings — the notification is never created or enqueued.
  async createNotification(userId: string, data: CreateNotificationDto, senderId: string | null = userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const preferences = await this.users.getPreferences(userId);
    const category = extractCategory(data.payload);
    if (!isAllowedByPreferences(preferences, data.type, category)) {
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        senderId,
        ...data,
        status: 'PENDING',
      },
    });

    await this.notificationQueueService.enqueue(notification.id);

    return notification;
  }

  async createDeadLetterTestNotification() {
    const userId = 'test-fail-user';

    // The worker deliberately fails delivery for this ID to exercise BullMQ retries.
    await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: 'test-fail-user@notify.local',
        name: 'Dead Letter Test User',
        passwordHash: '!test-account-no-login!',
      },
      update: {},
    });

    // No human dispatched this — it's a raw API test fixture.
    return this.createNotification(
      userId,
      { type: 'mention', payload: { message: 'testing dead letter' } },
      null,
    );
  }

  getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  getInbox(userId: string, type: string | undefined, limit: number) {
    return this.prisma.notification.findMany({
      where: { userId, ...(type && type !== 'all' ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getAllUserIds() {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    return users.map((user) => user.id);
  }

  async getNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async getStats(userId: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);

    const [
      sentToday,
      sentYesterday,
      deliveredToday,
      deliveredYesterday,
      failedToday,
      failedYesterday,
      avgLatencyToday,
      avgLatencyYesterday,
    ] = await Promise.all([
      this.prisma.notification.count({ where: { senderId: userId, createdAt: { gte: todayStart } } }),
      this.prisma.notification.count({
        where: { senderId: userId, createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      this.prisma.notification.count({
        where: { senderId: userId, status: 'DELIVERED', createdAt: { gte: todayStart } },
      }),
      this.prisma.notification.count({
        where: { senderId: userId, status: 'DELIVERED', createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      this.prisma.notification.count({
        where: { senderId: userId, status: { in: ['FAILED', 'DEAD_LETTER'] }, createdAt: { gte: todayStart } },
      }),
      this.prisma.notification.count({
        where: {
          senderId: userId,
          status: { in: ['FAILED', 'DEAD_LETTER'] },
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
      }),
      this.computeAvgLatencyMs(userId, todayStart, now),
      this.computeAvgLatencyMs(userId, yesterdayStart, todayStart),
    ]);

    return {
      sentToday: { value: sentToday, deltaPct: pctChange(sentToday, sentYesterday) },
      delivered: { value: deliveredToday, deltaPct: pctChange(deliveredToday, deliveredYesterday) },
      failed: { value: failedToday, deltaPct: pctChange(failedToday, failedYesterday) },
      avgLatencyMs: {
        value: avgLatencyToday,
        deltaMs: avgLatencyToday - avgLatencyYesterday,
      },
    };
  }

  async getVolume(userId: string, days: number) {
    const todayStart = startOfDay(new Date());
    const rangeStart = new Date(todayStart.getTime() - (days - 1) * DAY_MS);

    const notifications = await this.prisma.notification.findMany({
      where: { senderId: userId, createdAt: { gte: rangeStart } },
      select: { createdAt: true, status: true },
    });

    const buckets = new Map<string, { date: string; sent: number; delivered: number }>();
    for (let i = 0; i < days; i += 1) {
      const day = new Date(rangeStart.getTime() + i * DAY_MS);
      const key = dateKey(day);
      buckets.set(key, { date: key, sent: 0, delivered: 0 });
    }

    for (const notification of notifications) {
      const bucket = buckets.get(dateKey(startOfDay(notification.createdAt)));
      if (!bucket) continue;
      bucket.sent += 1;
      if (notification.status === 'DELIVERED') bucket.delivered += 1;
    }

    return Array.from(buckets.values());
  }

  // A personal activity feed: things this user sent, and things delivered to
  // them, in one combined list. The dashboard stat cards stay sent-only —
  // this is a separate, broader view.
  async getRecent(userId: string, page: number, pageSize: number) {
    const where = { OR: [{ senderId: userId }, { userId }] };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          sender: { select: { name: true, email: true } },
          user: { select: { name: true, email: true } },
          deliveryAttempts: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    const items = notifications.map((notification) => {
      const channel = notification.deliveryAttempts[0]?.channel ?? 'websocket';
      const direction = notification.senderId === userId ? 'sent' : 'received';
      return {
        id: notification.id,
        direction,
        sender: notification.sender?.name ?? notification.sender?.email ?? 'Unknown',
        recipient: notification.user.name,
        message: extractMessage(notification.payload),
        type: notification.type,
        channel: CHANNEL_LABELS[channel] ?? channel,
        status: notification.status,
        createdAt: notification.createdAt,
      };
    });

    return { items, total, page, pageSize };
  }

  private async computeAvgLatencyMs(userId: string, from: Date, to: Date) {
    const attempts = await this.prisma.deliveryAttempt.findMany({
      where: {
        succeeded: true,
        createdAt: { gte: from, lt: to },
        notification: { senderId: userId },
      },
      select: { createdAt: true, notification: { select: { createdAt: true } } },
    });

    if (attempts.length === 0) return 0;

    const totalMs = attempts.reduce(
      (sum, attempt) => sum + (attempt.createdAt.getTime() - attempt.notification.createdAt.getTime()),
      0,
    );
    return Math.round(totalMs / attempts.length);
  }
}
