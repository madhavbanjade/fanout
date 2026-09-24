import {
  Body,
  Controller,
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
import { AdminUnlockGuard } from '../common/guards/admin-unlock.guard';
import type { AuthRequest } from '../common/types/auth-request.type';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { AdminSendNotificationDto } from './dto/admin-send-notification.dto';
import { AdminBroadcastNotificationDto } from './dto/admin-broadcast-notification.dto';
import { NotificationsService } from './notifications.service';

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
  ) {
    return this.notifications.getRecent(request.user.sub, page, pageSize);
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

  @Post('admin/send')
  @UseGuards(JwtAuthGuard, AdminUnlockGuard)
  async adminSend(@Req() request: AuthRequest, @Body() dto: AdminSendNotificationDto) {
    // System alerts are broadcast-only — they're meant for everyone, so a
    // real send of this type is redirected to a full broadcast. "Send test
    // to myself" (targetUserId === the caller) is exempt, so testing a
    // system alert doesn't spam every real user.
    if (dto.type === 'system' && dto.targetUserId !== request.user.sub) {
      return this.broadcast(request.user.sub, { type: dto.type, payload: dto.payload });
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

  @Post('admin/broadcast')
  @UseGuards(JwtAuthGuard, AdminUnlockGuard)
  adminBroadcast(@Req() request: AuthRequest, @Body() dto: AdminBroadcastNotificationDto) {
    return this.broadcast(request.user.sub, dto);
  }

  private async broadcast(senderId: string, dto: CreateNotificationDto) {
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
