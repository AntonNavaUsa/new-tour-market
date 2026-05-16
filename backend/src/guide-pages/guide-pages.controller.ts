import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GuidePagesService } from './guide-pages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// ── Public endpoints ─────────────────────────────────────────────────────────
@ApiTags('guide-pages')
@Controller('guide-pages')
export class GuidePagesPublicController {
  constructor(private guidePagesService: GuidePagesService) {}

  @Get()
  @ApiOperation({ summary: 'List published guide pages' })
  findPublished() {
    return this.guidePagesService.findPublished();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get guide page by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.guidePagesService.findBySlug(slug);
  }
}

// ── Admin endpoints ───────────────────────────────────────────────────────────
@ApiTags('guide-pages')
@Controller('admin/guide-pages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class GuidePagesAdminController {
  constructor(private guidePagesService: GuidePagesService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] List all guide pages' })
  findAll() {
    return this.guidePagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get guide page by id' })
  findOne(@Param('id') id: string) {
    return this.guidePagesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Create guide page' })
  create(
    @Body()
    data: {
      title: string;
      slug: string;
      content: string;
      excerpt?: string;
      headPhotoUrl?: string;
      isPublished?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.guidePagesService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Admin] Update guide page' })
  update(
    @Param('id') id: string,
    @Body()
    data: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      headPhotoUrl?: string;
      isPublished?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.guidePagesService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Admin] Delete guide page' })
  remove(@Param('id') id: string) {
    return this.guidePagesService.remove(id);
  }
}
