import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { NotificationsGateway } from '../common/guards/notifications.gateway';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types/auth-request.type';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notifications: NotificationsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() request: AuthRequest,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notifications.createNotification(request.user.sub, dto);
  }

  @Get(':notificationId')
  @UseGuards(JwtAuthGuard)
  getOne(
    @Req() request: AuthRequest,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notifications.getNotification(request.user.sub, notificationId);
  }

  
  @Post('test-notify/:userId')
  testNotify(@Param('userId') userId: string) {
    this.notificationsGateway.sendToUser(userId, {
      id: 'test-1',
      type: 'mention',
      message: 'This is a live test notification',
      createdAt: new Date(),
    });
    return { sent: true };
  }
}
