import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(private faqsService: FaqsService) {}

  // ── Public ──────────────────────────────────────────────────────────
  @Get('card/:cardId')
  @ApiOperation({ summary: 'Get visible FAQs for a card' })
  getForCard(@Param('cardId') cardId: string) {
    return this.faqsService.getForCard(cardId);
  }

  // ── Admin ────────────────────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all FAQs' })
  findAll(@Query('cardId') cardId?: string) {
    return this.faqsService.findAll(cardId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.faqsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create FAQ' })
  create(
    @Body() data: {
      cardId: string;
      question: string;
      answer: string;
      sortOrder?: number;
      isVisible?: boolean;
    },
  ) {
    return this.faqsService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update FAQ' })
  update(
    @Param('id') id: string,
    @Body() data: {
      question?: string;
      answer?: string;
      sortOrder?: number;
      isVisible?: boolean;
    },
  ) {
    return this.faqsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete FAQ' })
  remove(@Param('id') id: string) {
    return this.faqsService.remove(id);
  }

  @Post('card/:cardId/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: reorder FAQs for a card' })
  reorder(@Param('cardId') cardId: string, @Body() body: { ids: string[] }) {
    return this.faqsService.reorder(cardId, body.ids);
  }
}
