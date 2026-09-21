import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationQueueService } from './notifications-queue.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueueService: NotificationQueueService,
  ) {}

  async createNotification(userId: string, data: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        ...data,
        status: 'PENDING',
      },
    });

    await this.notificationQueueService.enqueue(notification.id);

    return notification;
  }
}
