import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const JWT_ISSUER = 'bookly-api';
const JWT_AUDIENCE = 'bookly-web';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          audience: JWT_AUDIENCE,
          expiresIn: config.getOrThrow<string>(
            'JWT_EXPIRES_IN',
          ) as NonNullable<JwtModuleOptions['signOptions']>['expiresIn'],
          issuer: JWT_ISSUER,
        },
        verifyOptions: {
          audience: JWT_AUDIENCE,
          issuer: JWT_ISSUER,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
