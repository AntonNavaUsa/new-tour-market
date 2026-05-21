import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { AccommodationsService } from './accommodations.service';
import {
  CreateAccommodationDto,
  UpdateAccommodationDto,
  AccommodationFilterDto,
  ReorderPhotosDto,
  CreateAccommodationBlockDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('accommodations')
@Controller('accommodations')
export class AccommodationsController {
  constructor(private accommodationsService: AccommodationsService) {}

  // ── Public ──────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all accommodations' })
  async findAll(@Query() filters: AccommodationFilterDto) {
    return this.accommodationsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get accommodation by id' })
  async findOne(@Param('id') id: string) {
    return this.accommodationsService.findOne(id);
  }

  // ── Admin/Partner ────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create accommodation' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAccommodationDto,
  ) {
    return this.accommodationsService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update accommodation' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: UpdateAccommodationDto,
  ) {
    return this.accommodationsService.update(id, userId, userRole, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete accommodation' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.accommodationsService.delete(id, userId, userRole);
  }

  // ── Photos ───────────────────────────────────────────────────────────────

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload accommodation photos (max 10)' })
  async uploadPhotos(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('Файлы обязательны');
    return this.accommodationsService.uploadPhotos(id, userId, userRole, files);
  }

  @Patch(':id/photos/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder accommodation photos' })
  async reorderPhotos(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: ReorderPhotosDto,
  ) {
    return this.accommodationsService.reorderPhotos(id, userId, userRole, dto.photos);
  }

  @Delete('photos/:photoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete accommodation photo' })
  async deletePhoto(
    @Param('photoId') photoId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.accommodationsService.deletePhoto(photoId, userId, userRole);
  }

  @Put('photos/:photoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Replace accommodation photo' })
  async replacePhoto(
    @Param('photoId') photoId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Файл обязателен');
    return this.accommodationsService.replacePhoto(photoId, userId, userRole, file);
  }

  // ── Calendar ─────────────────────────────────────────────────────────────

  @Get(':id/calendar')
  @ApiOperation({ summary: 'Get accommodation occupancy calendar' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  async getCalendar(
    @Param('id') id: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.accommodationsService.getCalendar(id, parseInt(year), parseInt(month));
  }

  @Post(':id/blocks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block accommodation dates' })
  async createBlock(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CreateAccommodationBlockDto,
  ) {
    return this.accommodationsService.createBlock(id, userId, userRole, dto);
  }

  @Delete(':id/blocks/:blockId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.HOTEL_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove accommodation date block' })
  async deleteBlock(
    @Param('id') id: string,
    @Param('blockId') blockId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.accommodationsService.deleteBlock(id, blockId, userId, userRole);
  }
}
