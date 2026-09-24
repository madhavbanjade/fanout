import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  mentions?: boolean;

  @IsOptional()
  @IsBoolean()
  comments?: boolean;

  @IsOptional()
  @IsBoolean()
  newFollowers?: boolean;

  @IsOptional()
  @IsBoolean()
  orderShipped?: boolean;

  @IsOptional()
  @IsBoolean()
  orderDelivered?: boolean;

  @IsOptional()
  @IsBoolean()
  orderDelayed?: boolean;

  @IsOptional()
  @IsBoolean()
  systemSecurity?: boolean;

  @IsOptional()
  @IsBoolean()
  systemUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;
}
