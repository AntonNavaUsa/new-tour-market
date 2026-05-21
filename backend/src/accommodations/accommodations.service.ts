import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateAccommodationDto,
  UpdateAccommodationDto,
  AccommodationFilterDto,
  CreateAccommodationBlockDto,
} from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AccommodationsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateAccommodationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { partnerId: true },
    });

    return this.prisma.accommodation.create({
      data: {
        name: dto.name,
        description: dto.description,
        address: dto.address,
        type: dto.type ?? 'OTHER',
        createdByUserId: userId,
        partnerId: user?.partnerId ?? null,
      },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findAll(filters: AccommodationFilterDto) {
    const { search, type, skip = 0, take = 50 } = filters;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) {
      where.type = type;
    }

    const [data, total] = await Promise.all([
      this.prisma.accommodation.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          photos: { orderBy: { sortOrder: 'asc' }, take: 1 },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.accommodation.count({ where }),
    ]);

    return { data, meta: { total, skip, take, hasMore: skip + take < total } };
  }

  async findOne(id: string) {
    const accommodation = await this.prisma.accommodation.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { isVisible: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });
    if (!accommodation) throw new NotFoundException('Объект размещения не найден');
    return accommodation;
  }

  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateAccommodationDto,
  ) {
    await this.checkAccess(id, userId, userRole);
    return this.prisma.accommodation.update({
      where: { id },
      data: dto,
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const acc = await this.checkAccess(id, userId, userRole);
    // Delete photos from storage
    for (const photo of acc.photos) {
      try {
        await this.filesService.deleteImage(photo.url);
        if (photo.thumbUrl) await this.filesService.deleteImage(photo.thumbUrl);
      } catch {}
    }
    await this.prisma.accommodation.delete({ where: { id } });
    return { success: true };
  }

  // ── Photos ────────────────────────────────────────────────────────────────

  async uploadPhotos(
    id: string,
    userId: string,
    userRole: UserRole,
    files: Express.Multer.File[],
  ) {
    await this.checkAccess(id, userId, userRole);

    const existing = await this.prisma.accommodationPhoto.count({
      where: { accommodationId: id },
    });
    if (existing + files.length > 10) {
      throw new BadRequestException('Максимум 10 фотографий');
    }

    const maxOrderResult = await this.prisma.accommodationPhoto.aggregate({
      where: { accommodationId: id },
      _max: { sortOrder: true },
    });
    let sortOrder = (maxOrderResult._max.sortOrder ?? -1) + 1;

    const created = [];
    for (const file of files) {
      const { url, thumbUrl } = await this.filesService.uploadImageWithThumb(
        file,
        'accommodations',
        { maxWidth: 1920, maxHeight: 1080, quality: 85, thumbWidth: 400, thumbHeight: 300, thumbQuality: 80 },
      );
      const photo = await this.prisma.accommodationPhoto.create({
        data: { accommodationId: id, url, thumbUrl, sortOrder: sortOrder++ },
      });
      created.push(photo);
    }
    return created;
  }

  async reorderPhotos(
    id: string,
    userId: string,
    userRole: UserRole,
    photos: Array<{ id: string; sortOrder: number }>,
  ) {
    await this.checkAccess(id, userId, userRole);
    const updates = photos.map((p) =>
      this.prisma.accommodationPhoto.update({
        where: { id: p.id },
        data: { sortOrder: p.sortOrder },
      }),
    );
    await this.prisma.$transaction(updates);
    return this.prisma.accommodationPhoto.findMany({
      where: { accommodationId: id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async deletePhoto(
    photoId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const photo = await this.prisma.accommodationPhoto.findUnique({
      where: { id: photoId },
      include: { accommodation: true },
    });
    if (!photo) throw new NotFoundException('Фото не найдено');
    await this.checkAccess(photo.accommodationId, userId, userRole);
    try {
      await this.filesService.deleteImage(photo.url);
      if (photo.thumbUrl) await this.filesService.deleteImage(photo.thumbUrl);
    } catch {}
    await this.prisma.accommodationPhoto.delete({ where: { id: photoId } });
    return { success: true };
  }

  async replacePhoto(
    photoId: string,
    userId: string,
    userRole: UserRole,
    file: Express.Multer.File,
  ) {
    const photo = await this.prisma.accommodationPhoto.findUnique({
      where: { id: photoId },
    });
    if (!photo) throw new NotFoundException('Фото не найдено');
    await this.checkAccess(photo.accommodationId, userId, userRole);

    try {
      await this.filesService.deleteImage(photo.url);
      if (photo.thumbUrl) await this.filesService.deleteImage(photo.thumbUrl);
    } catch {}

    const { url, thumbUrl } = await this.filesService.uploadImageWithThumb(
      file,
      'accommodations',
      { maxWidth: 1920, maxHeight: 1080, quality: 85, thumbWidth: 400, thumbHeight: 300, thumbQuality: 80 },
    );
    return this.prisma.accommodationPhoto.update({
      where: { id: photoId },
      data: { url, thumbUrl },
    });
  }

  // ── Occupancy calendar & blocks ───────────────────────────────────────────

  async getCalendar(id: string, year: number, month: number) {
    await this.prisma.accommodation.findUniqueOrThrow({ where: { id } });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // last day of month

    const [blocks, orders] = await Promise.all([
      this.prisma.accommodationBlock.findMany({
        where: {
          accommodationId: id,
          dateFrom: { lte: endDate },
          dateTo: { gte: startDate },
        },
        orderBy: { dateFrom: 'asc' },
      }),
      // Orders on cards that use this accommodation
      this.prisma.order.findMany({
        where: {
          status: { in: ['CONFIRMED', 'PAID'] },
          date: { gte: startDate, lte: endDate },
          card: {
            cardAccommodations: {
              some: { accommodationId: id },
            },
          },
        },
        select: { date: true, id: true },
      }),
    ]);

    return { blocks, orders };
  }

  async createBlock(
    id: string,
    userId: string,
    userRole: UserRole,
    dto: CreateAccommodationBlockDto,
  ) {
    await this.checkAccess(id, userId, userRole);
    if (new Date(dto.dateFrom) > new Date(dto.dateTo)) {
      throw new BadRequestException('dateFrom must be <= dateTo');
    }
    return this.prisma.accommodationBlock.create({
      data: {
        accommodationId: id,
        dateFrom: new Date(dto.dateFrom),
        dateTo: new Date(dto.dateTo),
        reason: dto.reason,
      },
    }).then(async (block) => {
      const acc = await this.prisma.accommodation.findUnique({ where: { id }, select: { name: true } });
      if (acc) {
        await this.notifyAffectedOrders({
          name: acc.name,
          dateFrom: block.dateFrom,
          dateTo: block.dateTo,
          reason: block.reason ?? undefined,
          accommodationId: id,
        }).catch(() => {/* non-critical */});
      }
      return block;
    });
  }

  async deleteBlock(
    id: string,
    blockId: string,
    userId: string,
    userRole: UserRole,
  ) {
    await this.checkAccess(id, userId, userRole);
    const block = await this.prisma.accommodationBlock.findFirst({
      where: { id: blockId, accommodationId: id },
    });
    if (!block) throw new NotFoundException('Блокировка не найдена');
    await this.prisma.accommodationBlock.delete({ where: { id: blockId } });
    return { success: true };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async checkAccess(id: string, userId: string, userRole: UserRole) {
    const acc = await this.prisma.accommodation.findUnique({
      where: { id },
      include: { photos: true },
    });
    if (!acc) throw new NotFoundException('Объект размещения не найден');
    if (userRole !== UserRole.ADMIN && acc.createdByUserId !== userId) {
      throw new ForbiddenException('Нет доступа');
    }
    return acc;
  }

  private async notifyAffectedOrders(opts: {
    name: string;
    dateFrom: Date;
    dateTo: Date;
    reason?: string;
    accommodationId: string;
  }) {
    const { name, dateFrom, dateTo, reason, accommodationId } = opts;
    const affected = await this.prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PAID', 'PREORDER'] },
        date: { gte: dateFrom, lte: dateTo },
        card: { cardAccommodations: { some: { accommodationId } } },
      },
      include: {
        user: { select: { email: true, name: true } },
        card: { select: { title: true } },
      },
    });

    const dateLabel = dateFrom.toLocaleDateString('ru-RU') +
      (dateTo.getTime() !== dateFrom.getTime()
        ? ` — ${dateTo.toLocaleDateString('ru-RU')}`
        : '');

    for (const order of affected) {
      const email = order.customerEmail || order.user?.email;
      if (!email) continue;
      await this.notificationsService.sendEmail({
        to: email,
        subject: `Изменение в вашем бронировании: ${order.card.title}`,
        html: `
          <p>Здравствуйте, ${order.customerName || order.user?.name || 'уважаемый клиент'}!</p>
          <p>В расписании объекта размещения <strong>${name}</strong> появилась блокировка на даты <strong>${dateLabel}</strong>${reason ? `: ${reason}` : ''}.</p>
          <p>Это затрагивает ваше бронирование <strong>${order.card.title}</strong> на <strong>${new Date(order.date).toLocaleDateString('ru-RU')}</strong>.</p>
          <p>Пожалуйста, свяжитесь с нами для уточнения деталей.</p>
        `,
      }).catch(() => {/* non-critical */});
    }
  }
}
