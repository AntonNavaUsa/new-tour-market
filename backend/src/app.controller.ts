import { Controller, Get, Post, Patch, Delete, UseGuards, Body, Param, BadRequestException, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from './prisma/prisma.service';
import { FilesService } from './files/files.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  @Get()
  getRoot() {
    return {
      name: 'Travelio API',
      version: '1.0.0',
      status: 'running',
      documentation: '/api/docs',
      endpoints: {
        auth: '/api/auth',
        cards: '/api/cards',
        tickets: '/api/tickets',
        schedules: '/api/schedules',
        orders: '/api/orders',
        payments: '/api/payments',
      },
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('meta/locations')
  async getLocations() {
    return this.prisma.location.findMany({
      orderBy: [{ country: 'asc' }, { parentId: 'asc' }, { city: 'asc' }],
    });
  }

  @Get('meta/card-types')
  async getCardTypes() {
    return this.prisma.cardType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Get('meta/offers/for-card-type/:cardTypeId')
  async getOfferForCardType(@Param('cardTypeId') cardTypeId: string) {
    const offer = await this.prisma.offer.findFirst({
      where: {
        isActive: true,
        offerCardTypes: {
          some: {
            cardTypeId,
          },
        },
      },
      include: {
        offerCardTypes: {
          include: {
            cardType: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    if (!offer) {
      throw new NotFoundException('Offer not found for selected card type');
    }

    return offer;
  }

  @Get('meta/offers/:id')
  async getOfferById(@Param('id') id: string) {
    const offer = await this.prisma.offer.findFirst({
      where: { id, isActive: true },
      include: {
        offerCardTypes: {
          include: {
            cardType: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminUsers() {
    return this.prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        partnerId: true,
      },
    });
  }

  // Locations Management
  @Post('admin/locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createLocation(@Body() data: { country?: string; city: string; region?: string; urlSlug: string; language?: string; parentId?: string | null }) {
    // Check if urlSlug already exists
    const existing = await this.prisma.location.findUnique({
      where: { urlSlug: data.urlSlug },
    });
    if (existing) {
      throw new BadRequestException('URL slug уже существует');
    }

    const parent = data.parentId
      ? await this.prisma.location.findUnique({ where: { id: data.parentId } })
      : null;
    if (data.parentId && !parent) {
      throw new BadRequestException('Родительская локация не найдена');
    }

    return this.prisma.location.create({
      data: {
        country: parent?.country ?? data.country ?? '',
        city: data.city,
        region: parent?.region ?? data.region,
        urlSlug: data.urlSlug,
        language: parent?.language ?? data.language ?? 'ru',
        parentId: data.parentId ?? null,
      },
    });
  }

  @Patch('admin/locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateLocation(
    @Param('id') id: string,
    @Body() data: { country?: string; city?: string; region?: string; urlSlug?: string; language?: string; parentId?: string | null }
  ) {
    // Check if new urlSlug conflicts with existing location
    if (data.urlSlug) {
      const existing = await this.prisma.location.findUnique({
        where: { urlSlug: data.urlSlug },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('URL slug уже существует');
      }
    }

    if (data.parentId === id) {
      throw new BadRequestException('Локация не может быть родителем самой себя');
    }
    const parent = data.parentId
      ? await this.prisma.location.findUnique({ where: { id: data.parentId } })
      : null;
    if (data.parentId && !parent) {
      throw new BadRequestException('Родительская локация не найдена');
    }

    const updateData = Object.fromEntries(Object.entries(data).filter(([key, value]) => key !== 'parentId' && value !== undefined));
    return this.prisma.location.update({
      where: { id },
      data: {
        ...updateData,
        ...(data.parentId !== undefined && {
          parentId: data.parentId,
          ...(parent && { country: parent.country, region: parent.region, language: parent.language }),
        }),
      },
    });
  }

  @Delete('admin/locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteLocation(@Param('id') id: string) {
    // Check if location has cards
    const cardCount = await this.prisma.card.count({
      where: { locationId: id },
    });
    if (cardCount > 0) {
      throw new BadRequestException('Невозможно удалить локацию, к которой привязаны карточки');
    }

    return this.prisma.location.delete({
      where: { id },
    });
  }

  // Card Types Management
  @Post('admin/card-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createCardType(@Body() data: { name: string; slug: string; icon?: string; sortOrder?: number }) {
    // Check if name or slug already exist
    const existing = await this.prisma.cardType.findFirst({
      where: {
        OR: [{ name: data.name }, { slug: data.slug }],
      },
    });
    if (existing) {
      throw new BadRequestException('Тип с таким названием или slug уже существует');
    }

    return this.prisma.cardType.create({
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  @Patch('admin/card-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateCardType(
    @Param('id') id: string,
    @Body() data: { name?: string; slug?: string; icon?: string | null; sortOrder?: number }
  ) {
    // Check if name or slug conflict with other types
    if (data.name || data.slug) {
      const existing = await this.prisma.cardType.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                data.name ? { name: data.name } : undefined,
                data.slug ? { slug: data.slug } : undefined,
              ].filter((x) => x !== undefined),
            },
          ],
        },
      });
      if (existing) {
        throw new BadRequestException('Тип с таким названием или slug уже существует');
      }
    }

    return this.prisma.cardType.update({
      where: { id },
      data: Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
    });
  }

  @Delete('admin/card-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteCardType(@Param('id') id: string) {
    // Check if card type has cards
    const cardCount = await this.prisma.card.count({
      where: { cardTypeId: id },
    });
    if (cardCount > 0) {
      throw new BadRequestException('Невозможно удалить тип, к которому привязаны карточки');
    }

    return this.prisma.cardType.delete({
      where: { id },
    });
  }

  // Offers Management
  @Get('admin/offers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminOffers() {
    return this.prisma.offer.findMany({
      include: {
        offerCardTypes: {
          include: {
            cardType: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  @Post('admin/offers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createOffer(@Body() data: { text: string; revisionDate: string; cardTypeIds: string[]; isActive?: boolean }) {
    if (!data.text?.trim()) {
      throw new BadRequestException('Текст оферты обязателен');
    }
    if (!data.revisionDate?.trim()) {
      throw new BadRequestException('Дата редакции обязательна');
    }
    if (!Array.isArray(data.cardTypeIds) || data.cardTypeIds.length === 0) {
      throw new BadRequestException('Выберите хотя бы один тип карточки');
    }

    const cardTypesCount = await this.prisma.cardType.count({
      where: {
        id: {
          in: data.cardTypeIds,
        },
      },
    });

    if (cardTypesCount !== data.cardTypeIds.length) {
      throw new BadRequestException('Некоторые типы карточек не найдены');
    }

    return this.prisma.offer.create({
      data: {
        text: data.text,
        revisionDate: data.revisionDate,
        isActive: data.isActive ?? true,
        offerCardTypes: {
          create: data.cardTypeIds.map((cardTypeId) => ({ cardTypeId })),
        },
      },
      include: {
        offerCardTypes: {
          include: {
            cardType: true,
          },
        },
      },
    });
  }

  @Patch('admin/offers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateOffer(
    @Param('id') id: string,
    @Body() data: { text?: string; revisionDate?: string; cardTypeIds?: string[]; isActive?: boolean }
  ) {
    const existing = await this.prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Offer not found');
    }

    if (data.cardTypeIds && data.cardTypeIds.length === 0) {
      throw new BadRequestException('Выберите хотя бы один тип карточки');
    }

    if (data.cardTypeIds) {
      const cardTypesCount = await this.prisma.cardType.count({
        where: {
          id: {
            in: data.cardTypeIds,
          },
        },
      });

      if (cardTypesCount !== data.cardTypeIds.length) {
        throw new BadRequestException('Некоторые типы карточек не найдены');
      }
    }

    return this.prisma.offer.update({
      where: { id },
      data: {
        ...(data.text !== undefined ? { text: data.text } : {}),
        ...(data.revisionDate !== undefined ? { revisionDate: data.revisionDate } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.cardTypeIds
          ? {
              offerCardTypes: {
                deleteMany: {},
                create: data.cardTypeIds.map((cardTypeId) => ({ cardTypeId })),
              },
            }
          : {}),
      },
      include: {
        offerCardTypes: {
          include: {
            cardType: true,
          },
        },
      },
    });
  }

  @Delete('admin/offers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteOffer(@Param('id') id: string) {
    const existing = await this.prisma.offer.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Offer not found');
    }

    return this.prisma.offer.delete({
      where: { id },
    });
  }

  // Tariff Types Management
  @Get('meta/tariff-types')
  async getTariffTypes() {
    return this.prisma.tariffType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Post('admin/tariff-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createTariffType(
    @Body() data: { name: string; description?: string; ageFrom?: number; ageTo?: number; sortOrder?: number }
  ) {
    const existing = await this.prisma.tariffType.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new BadRequestException('Тариф с таким названием уже существует');
    }

    return this.prisma.tariffType.create({
      data: {
        name: data.name,
        description: data.description,
        ageFrom: data.ageFrom,
        ageTo: data.ageTo,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  @Patch('admin/tariff-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateTariffType(
    @Param('id') id: string,
    @Body() data: { name?: string; description?: string; ageFrom?: number; ageTo?: number; sortOrder?: number }
  ) {
    if (data.name) {
      const existing = await this.prisma.tariffType.findUnique({
        where: { name: data.name },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Тариф с таким названием уже существует');
      }
    }

    return this.prisma.tariffType.update({
      where: { id },
      data: Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
    });
  }

  @Delete('admin/tariff-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteTariffType(@Param('id') id: string) {
    const ticketCount = await this.prisma.ticket.count({
      where: { tariffTypeId: id },
    });
    if (ticketCount > 0) {
      throw new BadRequestException('Невозможно удалить тариф, который используется в карточках');
    }

    return this.prisma.tariffType.delete({
      where: { id },
    });
  }

  // Site Settings
  @Get('meta/site-settings')
  async getSiteSettings() {
    const settings = await this.prisma.siteSettings.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  @Get('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminSettings() {
    const settings = await this.prisma.siteSettings.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  @Patch('admin/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateAdminSettings(@Body() body: Record<string, string>) {
    const allowedKeys = ['siteName', 'siteDescription', 'adminEmail'];
    for (const [key, value] of Object.entries(body)) {
      if (!allowedKeys.includes(key)) continue;
      await this.prisma.siteSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    const settings = await this.prisma.siteSettings.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  @Post('admin/settings/hero-cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadHeroCover(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }

    const url = await this.filesService.uploadImage(file, 'photos', {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp',
    });

    await this.prisma.siteSettings.upsert({
      where: { key: 'heroCoverUrl' },
      update: { value: url },
      create: { key: 'heroCoverUrl', value: url },
    });

    return { url };
  }
}
