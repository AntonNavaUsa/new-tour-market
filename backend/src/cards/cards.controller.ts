import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto, CardFilterDto, ReorderPhotosDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('cards')
@Controller('cards')
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cards with filters' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'cardTypeId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async findAll(@Query() filters: CardFilterDto) {
    return this.cardsService.findAll(filters);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user cards' })
  async getMyCards(@CurrentUser('id') userId: string, @Query() filters: CardFilterDto) {
    return this.cardsService.getUserCards(userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get card by ID' })
  @ApiResponse({ status: 200, description: 'Card retrieved' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async findOne(@Param('id') id: string) {
    return this.cardsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new card' })
  @ApiResponse({ status: 201, description: 'Card created' })
  async create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardsService.create(userId, userRole, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update card' })
  @ApiResponse({ status: 200, description: 'Card updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardsService.update(id, userId, userRole, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete card' })
  @ApiResponse({ status: 200, description: 'Card deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.cardsService.delete(id, userId, userRole);
  }

  @Patch(':id/photos/slideshow/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder slideshow photos' })
  async reorderPhotos(
    @Param('id') cardId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: ReorderPhotosDto,
  ) {
    return this.cardsService.reorderSlideshowPhotos(cardId, userId, userRole, dto.photos);
  }

  @Delete('photos/:photoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete slideshow photo' })
  async deleteSlideshowPhoto(
    @Param('photoId') photoId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.cardsService.deleteSlideshowPhoto(photoId, userId, userRole);
  }

  @Post(':id/photos/main')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload main photo for card' })
  @ApiResponse({ status: 200, description: 'Photo uploaded successfully' })
  async uploadMainPhoto(
    @Param('id') cardId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.cardsService.uploadMainPhoto(cardId, userId, userRole, file);
  }

  @Post(':id/photos/slideshow')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload slideshow photos (max 10)' })
  @ApiResponse({ status: 200, description: 'Photos uploaded successfully' })
  async uploadSlideshowPhotos(
    @Param('id') cardId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    return this.cardsService.uploadSlideshowPhotos(cardId, userId, userRole, files);
  }

  @Post(':id/photos/expressions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload expression photos (max 10)' })
  @ApiResponse({ status: 200, description: 'Photos uploaded successfully' })
  async uploadExpressionPhotos(
    @Param('id') cardId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    return this.cardsService.uploadExpressionPhotos(cardId, userId, userRole, files);
  }
}
