import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
  role: true,
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

    return this.response(user);
  }

  async me(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUser,
    });
    if (!user) throw new UnauthorizedException('User no longer exists');
    return user;
  }

  private async response(user: { id: string; email: string; name: string; role: string }) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
