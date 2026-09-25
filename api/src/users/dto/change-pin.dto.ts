import { IsString, Matches } from 'class-validator';

export class ChangePinDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4 to 6 digits' })
  newPin!: string;
}
