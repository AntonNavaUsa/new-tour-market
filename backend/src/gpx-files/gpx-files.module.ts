import { Module } from '@nestjs/common';
import { GpxFilesService } from './gpx-files.service';
import { GpxFilesController } from './gpx-files.controller';
import { GpxClientController } from './gpx-client.controller';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  controllers: [GpxFilesController, GpxClientController],
  providers: [GpxFilesService],
})
export class GpxFilesModule {}
