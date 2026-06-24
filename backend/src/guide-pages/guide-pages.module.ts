import { Module } from '@nestjs/common';
import { GuidePagesService } from './guide-pages.service';
import { GuidePagesPublicController, GuidePagesAdminController } from './guide-pages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [GuidePagesPublicController, GuidePagesAdminController],
  providers: [GuidePagesService],
})
export class GuidePagesModule {}
