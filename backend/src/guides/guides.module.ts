import { Module } from '@nestjs/common';
import { GuidesService } from './guides.service';
import { GuidesController } from './guides.controller';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [FilesModule, PrismaModule, NotificationsModule],
  controllers: [GuidesController],
  providers: [GuidesService],
})
export class GuidesModule {}
