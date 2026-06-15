import { Module } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';

@Module({
  controllers: [FaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
