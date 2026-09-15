import { Module } from '@nestjs/common';
import { TourvisorController } from './tourvisor.controller';
import { TourvisorClient } from './tourvisor.client';
import { TourvisorService } from './tourvisor.service';
import { SletatClient } from './sletat.client';
import { SletatProvider } from './sletat.provider';

@Module({
  controllers: [TourvisorController],
  providers: [TourvisorClient, SletatClient, SletatProvider, TourvisorService],
  exports: [TourvisorService],
})
export class TourvisorModule {}
