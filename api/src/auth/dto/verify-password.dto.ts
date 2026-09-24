import { IsString, MinLength } from 'class-validator';

export class VerifyPasswordDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
