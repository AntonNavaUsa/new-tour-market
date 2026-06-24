import { Controller, Get, Header, Param } from '@nestjs/common';
import { GpxFilesService } from './gpx-files.service';

@Controller('gpx')
export class GpxClientController {
  constructor(private gpxFilesService: GpxFilesService) {}

  @Get(':slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getClientPage(@Param('slug') slug: string) {
    const gpxFile = await this.gpxFilesService.findBySlug(slug);
    return this.gpxFilesService.buildClientPage(gpxFile);
  }
}
