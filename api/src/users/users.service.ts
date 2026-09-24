import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async getPreferences(userId: string) {
    const existing = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    if (existing) return existing;

    // Lazily create the row with defaults the first time a user opens Settings.
    return this.prisma.notificationPreference.create({ data: { userId } });
  }

  async updatePreferences(userId: string, patch: UpdatePreferencesDto) {
    // Security alerts are non-optional — force true regardless of what the
    // client sends, so it can't be turned off even via a direct API call.
    const safePatch = { ...patch, systemSecurity: true };

    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...safePatch },
      update: safePatch,
    });
  }
}
