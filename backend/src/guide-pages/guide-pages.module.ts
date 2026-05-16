import { Module } from '@nestjs/common';
import { GuidePagesService } from './guide-pages.service';
import { GuidePagesPublicController, GuidePagesAdminController } from './guide-pages.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GuidePagesPublicController, GuidePagesAdminController],
  providers: [GuidePagesService],
})
export class GuidePagesModule {}
