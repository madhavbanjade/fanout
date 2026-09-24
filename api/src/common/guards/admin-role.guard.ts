import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthRequest } from '../types/auth-request.type';

// There is exactly one admin account (the first user ever registered — see
// the migration backfill). This guard runs after JwtAuthGuard and rejects
// anyone whose JWT role claim isn't 'ADMIN'.
@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
