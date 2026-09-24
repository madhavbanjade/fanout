import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthCookieService } from '../cookies/auth-cookie.service';

// Runs after JwtAuthGuard. Confirms the caller already unlocked their own
// admin panel this session (POST /auth/admin/verify-pin or verify-password) —
// being logged in alone is not enough to hit admin-only endpoints.
@Injectable()
export class AdminUnlockGuard implements CanActivate {
  constructor(private readonly cookies: AuthCookieService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (!this.cookies.hasAdminAccess(request)) {
      throw new ForbiddenException('Admin panel is locked. Verify your PIN or password first.');
    }
    return true;
  }
}
