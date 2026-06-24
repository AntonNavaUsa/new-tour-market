import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GpxFilesService } from './gpx-files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('gpx-files')
@Controller('gpx-files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class GpxFilesController {
  constructor(private gpxFilesService: GpxFilesService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all GPX files' })
  findAll() {
    return this.gpxFilesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Admin: upload GPX file' })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() body: { name: string; slug: string; description?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.gpxFilesService.create(body, file);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update GPX file metadata' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; description?: string },
  ) {
    return this.gpxFilesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: delete GPX file' })
  remove(@Param('id') id: string) {
    return this.gpxFilesService.remove(id);
  }
}
