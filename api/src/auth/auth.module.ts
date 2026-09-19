import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '../common/common.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    CommonModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is required');
        return { secret, signOptions: { expiresIn: '1h' } };
      },
    }),
  ],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
