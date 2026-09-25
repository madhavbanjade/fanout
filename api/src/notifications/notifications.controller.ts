import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsGateway } from '../common/guards/notifications.gateway';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../common/guards/admin-role.guard';
import type { AuthRequest } from '../common/types/auth-request.type';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { NotificationsService } from './notifications.service';

// Company-wide types: only the admin (the one designated "top man" account)
// can send these, whether to a single person or the whole company.
const ADMIN_ONLY_TYPES = new Set(['announcement', 'system', 'warning', 'termination']);

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notifications: NotificationsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() request: AuthRequest,
    @Body() dto: CreateNotificationDto,
  ) {
    const notification = await this.notifications.createNotification(
      request.user.sub,
      dto,
    );

    if (!notification) return { suppressed: true };

    // This may run on any API instance. The Redis Socket.IO adapter fans the
    // room emission out to sockets connected to every other instance.
    this.notificationsGateway.sendToUser(request.user.sub, notification);

    return notification;
  }

  // Order matters: these literal GET routes must be registered before the
  // ':notificationId' route below, or Express would match e.g. "stats" as an id.
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Req() request: AuthRequest) {
    return this.notifications.getStats(request.user.sub);
  }

  @Get('volume')
  @UseGuards(JwtAuthGuard)
  getVolume(
    @Req() request: AuthRequest,
    @Query('days', new ParseIntPipe({ optional: true })) days = 7,
  ) {
    return this.notifications.getVolume(request.user.sub, days);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  getRecent(
    @Req() request: AuthRequest,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize = 10,
    @Query('direction') direction?: string,
  ) {
    const normalizedDirection = direction === 'sent' || direction === 'received' ? direction : undefined;
    return this.notifications.getRecent(request.user.sub, page, pageSize, normalizedDirection);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@Req() request: AuthRequest) {
    return this.notifications.getUnreadCount(request.user.sub);
  }

  @Get('inbox')
  @UseGuards(JwtAuthGuard)
  getInbox(
    @Req() request: AuthRequest,
    @Query('type') type?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.notifications.getInbox(request.user.sub, type, limit);
  }

  @Post('mark-all-read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@Req() request: AuthRequest) {
    return this.notifications.markAllRead(request.user.sub);
  }

  @Patch(':notificationId/read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@Req() request: AuthRequest, @Param('notificationId') notificationId: string) {
    return this.notifications.markRead(request.user.sub, notificationId);
  }

  // Any registered user can send a notification to any other registered
  // user — but the company-wide types (announcement/system/warning/
  // termination) are reserved for the admin account, even when targeted at
  // a single person (e.g. a warning or termination letter to one employee).
  @Post('send')
  @UseGuards(JwtAuthGuard)
  async send(@Req() request: AuthRequest, @Body() dto: SendNotificationDto) {
    if (ADMIN_ONLY_TYPES.has(dto.type) && request.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only the admin can send this notification type');
    }

    const notification = await this.notifications.createNotification(
      dto.targetUserId,
      { type: dto.type, payload: dto.payload },
      request.user.sub,
    );

    if (!notification) return { suppressed: true };

    this.notificationsGateway.sendToUser(dto.targetUserId, notification);

    return notification;
  }

  // Broadcasting to every registered user is admin-only.
  @Post('broadcast')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  broadcast(@Req() request: AuthRequest, @Body() dto: BroadcastNotificationDto) {
    return this.broadcastAll(request.user.sub, dto);
  }

  private async broadcastAll(senderId: string, dto: CreateNotificationDto) {
    const userIds = await this.notifications.getAllUserIds();

    const notifications = await Promise.all(
      userIds.map((userId) => this.notifications.createNotification(userId, dto, senderId)),
    );

    let sentTo = 0;
    for (const notification of notifications) {
      if (!notification) continue;
      this.notificationsGateway.sendToUser(notification.userId, notification);
      sentTo += 1;
    }

    return { sentTo, suppressed: notifications.length - sentTo };
  }

  @Post('test-dead-letter')
  testDeadLetter() {
    return this.notifications.createDeadLetterTestNotification();
  }

  @Get(':notificationId')
  @UseGuards(JwtAuthGuard)
  getOne(
    @Req() request: AuthRequest,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notifications.getNotification(request.user.sub, notificationId);
  }
}
