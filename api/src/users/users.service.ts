import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../common/services/password.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangePinDto } from './dto/change-pin.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

const profileSelect = {
  id: true,
  email: true,
  name: true,
  bio: true,
  timezone: true,
  role: true,
  createdAt: true,
  pinHash: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
  ) {}

  listAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: profileSelect,
    });
    const sentCount = await this.prisma.notification.count({ where: { senderId: userId } });
    const { pinHash, ...rest } = user;
    return { ...rest, pinSet: pinHash !== null, sentCount };
  }

  async updateProfile(userId: string, patch: UpdateProfileDto) {
    const { pinHash, ...user } = await this.prisma.user.update({
      where: { id: userId },
      data: patch,
      select: profileSelect,
    });
    const sentCount = await this.prisma.notification.count({ where: { senderId: userId } });
    return { ...user, pinSet: pinHash !== null, sentCount };
  }

  private async requireUser(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  async changePassword(userId: string, { currentPassword, newPassword }: ChangePasswordDto) {
    const user = await this.requireUser(userId);
    if (!(await this.passwords.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await this.passwords.hash(newPassword) },
    });
    return { success: true };
  }

  async changePin(userId: string, { currentPassword, newPin }: ChangePinDto) {
    const user = await this.requireUser(userId);
    if (!(await this.passwords.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinHash: await this.passwords.hash(newPin) },
    });
    return { success: true };
  }

  async deleteAccount(userId: string, { currentPassword }: DeleteAccountDto) {
    const user = await this.requireUser(userId);
    if (!(await this.passwords.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.prisma.$transaction(async (tx) => {
      const ownNotifications = await tx.notification.findMany({
        where: { userId },
        select: { id: true },
      });
      const ids = ownNotifications.map((n) => n.id);
      if (ids.length) {
        await tx.deliveryAttempt.deleteMany({ where: { notificationId: { in: ids } } });
        await tx.notification.deleteMany({ where: { id: { in: ids } } });
      }
      // Notifications this user sent to *other* users are kept, just orphaned,
      // so deleting your own account doesn't erase someone else's inbox history.
      await tx.notification.updateMany({ where: { senderId: userId }, data: { senderId: null } });
      await tx.notificationPreference.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return { success: true };
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
