import { Module } from '@nestjs/common';
import { AuthCookieService } from './cookies/auth-cookie.service';
import { PasswordService } from './services/password.service';

@Module({
  providers: [AuthCookieService, PasswordService],
  exports: [AuthCookieService, PasswordService],
})
export class CommonModule {}
