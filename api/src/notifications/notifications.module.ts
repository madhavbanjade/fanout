import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from '../common/guards/notifications.gateway';
import { CommonModule } from '../common/common.module';
import { NotificationQueueService } from './notifications-queue.service';

@Module({
  imports: [
    CommonModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is required');
        return { secret, signOptions: { expiresIn: '1h' } };
      },
    }),
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationQueueService,
  ],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
