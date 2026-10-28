import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProfessionalsController } from './professionals.controller.js';
import { ProfessionalsService } from './professionals.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService],
})
export class ProfessionalsModule {}
