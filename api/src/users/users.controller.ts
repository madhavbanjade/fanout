import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthCookieService } from '../common/cookies/auth-cookie.service';
import type { AuthRequest } from '../common/types/auth-request.type';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangePinDto } from './dto/change-pin.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly cookies: AuthCookieService,
  ) {}

  // Feeds the "send notification" recipient picker — any registered user can
  // message any other registered user, so the full roster is returned here.
  @Get()
  @UseGuards(JwtAuthGuard)
  list() {
    return this.users.listAll();
  }

  @Get('me/preferences')
  @UseGuards(JwtAuthGuard)
  getMyPreferences(@Req() request: AuthRequest) {
    return this.users.getPreferences(request.user.sub);
  }

  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  updateMyPreferences(@Req() request: AuthRequest, @Body() dto: UpdatePreferencesDto) {
    return this.users.updatePreferences(request.user.sub, dto);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Req() request: AuthRequest) {
    return this.users.getProfile(request.user.sub);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@Req() request: AuthRequest, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(request.user.sub, dto);
  }

  @Post('me/password')
  @UseGuards(JwtAuthGuard)
  changeMyPassword(@Req() request: AuthRequest, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(request.user.sub, dto);
  }

  @Post('me/pin')
  @UseGuards(JwtAuthGuard)
  changeMyPin(@Req() request: AuthRequest, @Body() dto: ChangePinDto) {
    return this.users.changePin(request.user.sub, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAccount(
    @Req() request: AuthRequest,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.users.deleteAccount(request.user.sub, dto);
    this.cookies.clear(response);
  }
}
