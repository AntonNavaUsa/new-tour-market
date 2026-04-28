import { Controller, Get, Post, Patch, Delete, UseGuards, Body, Param, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

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
      orderBy: [{ country: 'asc' }, { city: 'asc' }],
    });
  }

  @Get('meta/card-types')
  async getCardTypes() {
    return this.prisma.cardType.findMany({
      orderBy: { name: 'asc' },
    });
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
  async createLocation(@Body() data: { country: string; city: string; region?: string; urlSlug: string; language?: string }) {
    // Check if urlSlug already exists
    const existing = await this.prisma.location.findUnique({
      where: { urlSlug: data.urlSlug },
    });
    if (existing) {
      throw new BadRequestException('URL slug уже существует');
    }

    return this.prisma.location.create({
      data: {
        country: data.country,
        city: data.city,
        region: data.region,
        urlSlug: data.urlSlug,
        language: data.language || 'ru',
      },
    });
  }

  @Patch('admin/locations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateLocation(
    @Param('id') id: string,
    @Body() data: { country?: string; city?: string; region?: string; urlSlug?: string; language?: string }
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

    return this.prisma.location.update({
      where: { id },
      data: Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
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
  async createCardType(@Body() data: { name: string; slug: string; icon?: string }) {
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
      },
    });
  }

  @Patch('admin/card-types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateCardType(
    @Param('id') id: string,
    @Body() data: { name?: string; slug?: string; icon?: string | null }
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
}
