import { Prisma } from '@prisma/client';
import { IsObject, IsString } from 'class-validator';

export class BroadcastNotificationDto {
  @IsString()
  type!: string;

  @IsObject()
  payload!: Prisma.InputJsonObject;
}
