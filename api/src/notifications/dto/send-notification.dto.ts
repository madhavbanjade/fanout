import { Prisma } from '@prisma/client';
import { IsObject, IsString, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @IsUUID()
  targetUserId!: string;

  @IsString()
  type!: string;

  @IsObject()
  payload!: Prisma.InputJsonObject;
}
