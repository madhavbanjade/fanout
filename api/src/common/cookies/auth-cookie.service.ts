import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

const cookieName = 'accessToken';
const adminCookieName = 'adminAccess';
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

  // The admin panel unlock is short-lived and separate from the login session,
  // so re-entering the PIN is required again after it expires even if the user
  // stays logged in.
  setAdminAccess(response: Response) {
    response.cookie(adminCookieName, '1', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });
  }

  clearAdminAccess(response: Response) {
    response.clearCookie(adminCookieName);
  }

  hasAdminAccess(request: { headers: { cookie?: string } }) {
    return this.readCookie(request, adminCookieName) !== undefined;
  }

  private readCookie(request: { headers: { cookie?: string } }, name: string) {
    return request.headers.cookie
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  }
}
