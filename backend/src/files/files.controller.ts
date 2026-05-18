import { Controller, Get, Query, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get('proxy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy an image from MinIO storage (for in-browser editing)' })
  @ApiQuery({ name: 'url', required: true, description: 'MinIO image URL to proxy' })
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    if (!url) throw new BadRequestException('url parameter is required');
    const { buffer, contentType } = await this.filesService.getImageBuffer(url);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }
}
