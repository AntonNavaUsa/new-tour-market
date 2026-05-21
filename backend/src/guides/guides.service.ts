import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class GuidesService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private notificationsService: NotificationsService,
  ) {}

  async getAll() {
    return this.prisma.guide.findMany({
      orderBy: [{ userId: 'asc' }, { position: 'asc' }],
    });
  }

  async getMyGuides(userId: string) {
    return this.prisma.guide.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
    });
  }

  async create(userId: string, data: { name: string; description?: string; position?: number }) {
    if (!data.name?.trim()) {
      throw new BadRequestException('Имя обязательно');
    }
    return this.prisma.guide.create({
      data: {
        userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        position: data.position ?? 0,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    data: { name?: string; description?: string; certifications?: string; position?: number },
  ) {
    const guide = await this.prisma.guide.findUnique({ where: { id } });
    if (!guide) throw new NotFoundException('Гид не найден');
    if (guide.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа');
    }
    return this.prisma.guide.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.certifications !== undefined && { certifications: data.certifications?.trim() || null }),
        ...(data.position !== undefined && { position: data.position }),
      },
    });
  }

  async uploadPhoto(id: string, userId: string, userRole: UserRole, file: Express.Multer.File) {
    const guide = await this.prisma.guide.findUnique({ where: { id } });
    if (!guide) throw new NotFoundException('Гид не найден');
    if (guide.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа');
    }

    const photoUrl = await this.filesService.uploadImage(file, 'photos', {
      maxWidth: 400,
      maxHeight: 400,
      quality: 85,
      format: 'webp',
    });

    return this.prisma.guide.update({
      where: { id },
      data: { photoUrl },
    });
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const guide = await this.prisma.guide.findUnique({ where: { id } });
    if (!guide) throw new NotFoundException('Гид не найден');
    if (guide.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа');
    }
    await this.prisma.guide.delete({ where: { id } });
  }

  // ── Calendar & blocks ────────────────────────────────────────────────────

  async getCalendar(guideId: string, year: number, month: number) {
    await this.prisma.guide.findUniqueOrThrow({ where: { id: guideId } });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [blocks, orders] = await Promise.all([
      this.prisma.guideBlock.findMany({
        where: {
          guideId,
          dateFrom: { lte: endDate },
          dateTo: { gte: startDate },
        },
        orderBy: { dateFrom: 'asc' },
      }),
      this.prisma.order.findMany({
        where: {
          status: { in: ['CONFIRMED', 'PAID'] },
          date: { gte: startDate, lte: endDate },
          card: {
            cardGuides: { some: { guideId } },
          },
        },
        select: { date: true, id: true },
      }),
    ]);

    return { blocks, orders };
  }

  async createBlock(
    guideId: string,
    userId: string,
    userRole: UserRole,
    dto: { dateFrom: string; dateTo: string; reason?: string },
  ) {
    const guide = await this.prisma.guide.findUnique({ where: { id: guideId } });
    if (!guide) throw new NotFoundException('Гид не найден');
    if (guide.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа');
    }
    if (new Date(dto.dateFrom) > new Date(dto.dateTo)) {
      throw new BadRequestException('dateFrom must be <= dateTo');
    }
    return this.prisma.guideBlock.create({
      data: {
        guideId,
        dateFrom: new Date(dto.dateFrom),
        dateTo: new Date(dto.dateTo),
        reason: dto.reason,
      },
    }).then(async (block) => {
      // Notify users with affected orders
      await this.notifyAffectedOrders({
        context: 'guide',
        name: guide.name,
        dateFrom: block.dateFrom,
        dateTo: block.dateTo,
        reason: block.reason ?? undefined,
        whereClause: { card: { cardGuides: { some: { guideId } } } },
      }).catch(() => {/* non-critical */});
      return block;
    });
  }

  async deleteBlock(
    guideId: string,
    blockId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const guide = await this.prisma.guide.findUnique({ where: { id: guideId } });
    if (!guide) throw new NotFoundException('Гид не найден');
    if (guide.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Нет доступа');
    }
    const block = await this.prisma.guideBlock.findFirst({
      where: { id: blockId, guideId },
    });
    if (!block) throw new NotFoundException('Блокировка не найдена');
    await this.prisma.guideBlock.delete({ where: { id: blockId } });
    return { success: true };
  }

  // ── Card-Guide bindings ──────────────────────────────────────────────────

  async getGuidesByCard(cardId: string) {
    return this.prisma.cardGuide.findMany({
      where: { cardId },
      include: { guide: true },
    });
  }

  async setCardGuides(cardId: string, guideIds: string[]) {
    await this.prisma.cardGuide.deleteMany({ where: { cardId } });
    if (guideIds.length > 0) {
      await this.prisma.cardGuide.createMany({
        data: guideIds.map((guideId) => ({ cardId, guideId })),
        skipDuplicates: true,
      });
    }
    return this.prisma.cardGuide.findMany({
      where: { cardId },
      include: { guide: true },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async notifyAffectedOrders(opts: {
    context: 'guide' | 'accommodation';
    name: string;
    dateFrom: Date;
    dateTo: Date;
    reason?: string;
    whereClause: object;
  }) {
    const { context, name, dateFrom, dateTo, reason, whereClause } = opts;
    const affected = await this.prisma.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PAID', 'PREORDER'] },
        date: { gte: dateFrom, lte: dateTo },
        ...whereClause,
      },
      include: {
        user: { select: { email: true, name: true } },
        card: { select: { title: true } },
      },
    });

    const label = context === 'guide' ? 'гида' : 'объекта размещения';
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
          <p>В расписании ${label} <strong>${name}</strong> появилась блокировка на даты <strong>${dateLabel}</strong>${reason ? `: ${reason}` : ''}.</p>
          <p>Это затрагивает ваше бронирование <strong>${order.card.title}</strong> на <strong>${new Date(order.date).toLocaleDateString('ru-RU')}</strong>.</p>
          <p>Пожалуйста, свяжитесь с нами для уточнения деталей.</p>
        `,
      }).catch(() => {/* non-critical */});
    }
  }
}
