import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthRequest } from '../common/types/auth-request.type';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

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
}
