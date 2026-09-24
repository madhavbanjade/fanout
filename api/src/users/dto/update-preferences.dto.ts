import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  mentions?: boolean;

  @IsOptional()
  @IsBoolean()
  taskAssigned?: boolean;

  @IsOptional()
  @IsBoolean()
  taskUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  leaveUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  meetingUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  announcements?: boolean;

  @IsOptional()
  @IsBoolean()
  systemSecurity?: boolean;

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;
}
