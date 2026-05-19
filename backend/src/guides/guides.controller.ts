import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { GuidesService } from './guides.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('guides')
@Controller('guides')
export class GuidesController {
  constructor(private guidesService: GuidesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all guides (public)' })
  async getAll() {
    return this.guidesService.getAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user guides' })
  async getMyGuides(@CurrentUser('id') userId: string) {
    return this.guidesService.getMyGuides(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a guide' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() data: { name: string; description?: string; position?: number },
  ) {
    return this.guidesService.create(userId, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a guide' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() data: { name?: string; description?: string; certifications?: string; position?: number },
  ) {
    return this.guidesService.update(id, userId, userRole, data);
  }

  @Post(':id/photo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload guide photo' })
  async uploadPhoto(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл обязателен');
    }
    return this.guidesService.uploadPhoto(id, userId, userRole, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a guide' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    await this.guidesService.delete(id, userId, userRole);
    return { success: true };
  }
}
