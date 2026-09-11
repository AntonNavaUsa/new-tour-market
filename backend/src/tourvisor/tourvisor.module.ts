import { Module } from '@nestjs/common';
import { TourvisorController } from './tourvisor.controller';
import { TourvisorClient } from './tourvisor.client';
import { TourvisorService } from './tourvisor.service';

@Module({
  controllers: [TourvisorController],
  providers: [TourvisorClient, TourvisorService],
  exports: [TourvisorService],
})
export class TourvisorModule {}
