import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // ── Public ──────────────────────────────────────────────────────────
  @Get('card/:cardId')
  @ApiOperation({ summary: 'Get visible reviews for a card' })
  getForCard(@Param('cardId') cardId: string) {
    return this.reviewsService.getForCard(cardId);
  }

  // ── Admin ────────────────────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all reviews' })
  findAll(@Query('cardId') cardId?: string) {
    return this.reviewsService.findAll(cardId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create review' })
  create(
    @Body() data: {
      cardId?: string | null;
      authorName: string;
      authorPhoto?: string;
      title?: string;
      text: string;
      rating?: number;
      isVisible?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.reviewsService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update review' })
  update(
    @Param('id') id: string,
    @Body() data: {
      cardId?: string | null;
      authorName?: string;
      authorPhoto?: string | null;
      title?: string | null;
      text?: string;
      rating?: number;
      isVisible?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.reviewsService.update(id, data);
  }

  @Post(':id/photo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: upload author photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.reviewsService.uploadPhoto(id, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete review' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
