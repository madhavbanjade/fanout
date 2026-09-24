import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { AuthService } from './auth.service';
import { AuthCookieService } from '../common/cookies/auth-cookie.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types/auth-request.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookieService,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, user, adminPin } = await this.auth.login(dto);
    this.cookies.set(response, accessToken);
    // adminPin is only present the very first time this user logs in.
    return adminPin ? { user, adminPin } : { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response) {
    this.cookies.clear(response);
    this.cookies.clearAdminAccess(response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthRequest) {
    return this.auth.me(request.user.sub);
  }

  @Post('admin/verify-pin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyAdminPin(
    @Req() request: AuthRequest,
    @Body() dto: VerifyPinDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.verifyAdminPin(request.user.sub, dto.pin);
    this.cookies.setAdminAccess(response);
    return { granted: true };
  }

  @Post('admin/verify-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyAdminPassword(
    @Req() request: AuthRequest,
    @Body() dto: VerifyPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.verifyAdminPassword(request.user.sub, dto.password);
    this.cookies.setAdminAccess(response);
    return { granted: true };
  }

  @Post('admin/lock')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  lockAdmin(@Res({ passthrough: true }) response: Response) {
    this.cookies.clearAdminAccess(response);
  }

  @Get('admin/status')
  @UseGuards(JwtAuthGuard)
  adminStatus(@Req() request: AuthRequest) {
    return { unlocked: this.cookies.hasAdminAccess(request) };
  }
}
