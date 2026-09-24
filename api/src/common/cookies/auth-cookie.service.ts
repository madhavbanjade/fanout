import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

const cookieName = 'accessToken';
const isProduction = process.env.NODE_ENV === 'production';

@Injectable()
export class AuthCookieService {
  set(response: Response, token: string) {
    response.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000,
    });
  }

  clear(response: Response) {
    response.clearCookie(cookieName);
  }

  get(request: { headers: { cookie?: string } }) {
    return this.readCookie(request, cookieName);
  }

  private readCookie(request: { headers: { cookie?: string } }, name: string) {
    return request.headers.cookie
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  }
}
