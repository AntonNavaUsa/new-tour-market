import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExtrasService, CreateExtraDto, UpdateExtraDto } from './extras.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('extras')
@Controller('extras')
export class ExtrasController {
  constructor(private extrasService: ExtrasService) {}

  // ── Public ──────────────────────────────────────────────────────────
  @Get('card/:cardId')
  @ApiOperation({ summary: 'Get active extras for a card (public)' })
  getForCard(@Param('cardId') cardId: string) {
    return this.extrasService.getForCard(cardId, true);
  }

  // ── Admin ────────────────────────────────────────────────────────────
  @Get('card/:cardId/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: all extras for card (incl. inactive)' })
  getForCardAdmin(@Param('cardId') cardId: string) {
    return this.extrasService.getForCard(cardId, false);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.extrasService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create extra' })
  create(@Body() dto: CreateExtraDto) {
    return this.extrasService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update extra' })
  update(@Param('id') id: string, @Body() dto: UpdateExtraDto) {
    return this.extrasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: delete extra' })
  remove(@Param('id') id: string) {
    return this.extrasService.remove(id);
  }

  @Post('card/:cardId/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: reorder extras' })
  reorder(
    @Param('cardId') cardId: string,
    @Body('ids') ids: string[],
  ) {
    return this.extrasService.reorder(cardId, ids);
  }
}
