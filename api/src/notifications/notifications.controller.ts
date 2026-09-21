import { Controller, Param, Post } from '@nestjs/common';
import { NotificationsGateway } from '../common/guards/notifications.gateway';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  
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
