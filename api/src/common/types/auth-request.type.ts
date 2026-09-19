import type { Request } from 'express';

export type JwtPayload = { sub: string; email: string };
export type AuthRequest = Request & { user: JwtPayload };
