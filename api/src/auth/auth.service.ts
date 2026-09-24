import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PasswordService } from '../common/services/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

const publicUser = {
  id: true,
  email: true,
  name: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
  ) {}

  async signup({ email, name, password }: SignupDto) {
    const normalizedEmail = email.trim().toLowerCase();
    if (
      await this.prisma.user.findUnique({ where: { email: normalizedEmail } })
    ) {
      throw new ConflictException('Email is already registered');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          passwordHash: await this.passwords.hash(password),
        },
        select: publicUser,
      });
      return { user };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !(await this.passwords.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Each user gets their own admin PIN, generated once on their first login
    // and returned in the clear exactly this one time — it can't be recovered
    // afterwards since only its hash is kept, so the client must show it now.
    let issuedAdminPin: string | undefined;
    if (!user.adminPinHash) {
      issuedAdminPin = randomInt(0, 10000).toString().padStart(4, '0');
      await this.prisma.user.update({
        where: { id: user.id },
        data: { adminPinHash: await this.passwords.hash(issuedAdminPin) },
      });
    }

    const { accessToken, user: publicUserData } = await this.response(user);
    return { accessToken, user: publicUserData, adminPin: issuedAdminPin };
  }

  async me(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUser,
    });
    if (!user) throw new UnauthorizedException('User no longer exists');
    return user;
  }

  async verifyAdminPin(userId: string, pin: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User no longer exists');
    if (!user.adminPinHash || !(await this.passwords.compare(pin, user.adminPinHash))) {
      throw new UnauthorizedException('Incorrect PIN');
    }
  }

  async verifyAdminPassword(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User no longer exists');
    if (!(await this.passwords.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Incorrect password');
    }
  }

  private async response(user: { id: string; email: string; name: string }) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
