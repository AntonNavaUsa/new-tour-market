import { Module } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';
import { FaqTemplatesController } from './faq-templates.controller';
import { BookingStepsTemplatesController } from './booking-steps-templates.controller';
import { BookingStepsTemplatesService } from './booking-steps-templates.service';

@Module({
  controllers: [FaqsController, FaqTemplatesController, BookingStepsTemplatesController],
  providers: [FaqsService, BookingStepsTemplatesService],
})
export class FaqsModule {}
