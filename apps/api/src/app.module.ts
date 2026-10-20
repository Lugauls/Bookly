import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [resolve(process.cwd(), '../../.env'), '.env'],
      isGlobal: true,
    }),
    PrismaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
