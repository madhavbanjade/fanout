import { Prisma } from '@prisma/client';
import { IsObject, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  type!: string;

  @IsObject()
  payload!: Prisma.InputJsonObject;
}
