import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthCookieService } from '../cookies/auth-cookie.service';
import type { AuthRequest, JwtPayload } from '../types/auth-request.type';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly cookies: AuthCookieService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token =
      this.cookies.get(request) ?? request.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedException('Login is required');

    try {
      request.user = await this.jwt.verifyAsync<JwtPayload>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
