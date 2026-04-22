import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketDto, CreatePriceDto, PriceFilterDto } from './dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async createTicket(cardId: string, userId: string, userRole: UserRole, dto: CreateTicketDto) {
    // Verify card exists and user has permission
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (userRole !== UserRole.ADMIN && card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this card');
    }

    // Get max position
    const maxPosition = await this.prisma.ticket.findFirst({
      where: { cardId },
      orderBy: { position: 'desc' },
    });

    const ticket = await this.prisma.ticket.create({
      data: {
        cardId,
        title: dto.title,
        description: dto.description,
        isMain: dto.isMain ?? false,
        position: dto.position ?? (maxPosition?.position || 0) + 1,
        typeConfig: dto.typeConfig || {},
        pricingType: dto.pricingType,
        tariffTypeId: dto.tariffTypeId,
      },
      include: {
        prices: {
          orderBy: { dateFrom: 'asc' },
        },
        tariffType: true,
      },
    });

    return ticket;
  }

  async updateTicket(ticketId: string, userId: string, userRole: UserRole, dto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { card: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.ADMIN && ticket.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this ticket');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...dto,
      },
      include: {
        prices: {
          orderBy: { dateFrom: 'asc' },
        },
        tariffType: true,
      },
    });

    return updatedTicket;
  }

  async deleteTicket(ticketId: string, userId: string, userRole: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { card: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.ADMIN && ticket.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this ticket');
    }

    // Check if ticket has active orders
    const activeOrders = await this.prisma.orderTicket.count({
      where: {
        ticketId,
        order: {
          status: {
            in: ['PREORDER', 'CONFIRMED', 'PAID'],
          },
        },
      },
    });

    if (activeOrders > 0) {
      throw new BadRequestException(
        'Cannot delete ticket with active orders. Archive the card instead.',
      );
    }

    await this.prisma.ticket.delete({
      where: { id: ticketId },
    });

    return { message: 'Ticket deleted successfully' };
  }

  async getCardTickets(cardId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { cardId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: {
        tariffType: true,
        prices: {
          where: {
            dateTo: {
              gte: new Date(),
            },
          },
          orderBy: { dateFrom: 'asc' },
          take: 5, // Last 5 price entries
        },
      },
    });

    return tickets;
  }

  async createPrice(ticketId: string, userId: string, userRole: UserRole, dto: CreatePriceDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { card: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== UserRole.ADMIN && ticket.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this ticket');
    }

    const dateFrom = new Date(dto.dateFrom as unknown as string);
    const dateTo = new Date(dto.dateTo as unknown as string);

    // Validate dates
    if (dateFrom >= dateTo) {
      throw new BadRequestException('dateFrom must be before dateTo');
    }

    // Check for overlapping price periods (exclude archived)
    const overlappingPrices = await this.prisma.price.findFirst({
      where: {
        ticketId,
        isArchived: false,
        OR: [
          {
            AND: [
              { dateFrom: { lte: dateFrom } },
              { dateTo: { gte: dateFrom } },
            ],
          },
          {
            AND: [
              { dateFrom: { lte: dateTo } },
              { dateTo: { gte: dateTo } },
            ],
          },
          {
            AND: [
              { dateFrom: { gte: dateFrom } },
              { dateTo: { lte: dateTo } },
            ],
          },
        ],
      },
    });

    if (overlappingPrices) {
      throw new BadRequestException(
        'Price period overlaps with existing price. Delete or update the existing price first.',
      );
    }

    const price = await this.prisma.price.create({
      data: {
        ticketId,
        dateFrom,
        dateTo,
        adultPrice: dto.adultPrice,
        childPrice: dto.childPrice,
        minPrice: dto.minPrice,
        availableSlots: dto.availableSlots,
        groupTiers: dto.groupTiers ? (dto.groupTiers as any) : undefined,
      },
    });

    return price;
  }

  async updatePrice(priceId: string, userId: string, userRole: UserRole, dto: CreatePriceDto) {
    const price = await this.prisma.price.findUnique({
      where: { id: priceId },
      include: {
        ticket: {
          include: { card: true },
        },
      },
    });

    if (!price) {
      throw new NotFoundException('Price not found');
    }

    if (userRole !== UserRole.ADMIN && price.ticket.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this price');
    }

    const dateFrom = new Date(dto.dateFrom as unknown as string);
    const dateTo = new Date(dto.dateTo as unknown as string);

    // Validate dates
    if (dateFrom >= dateTo) {
      throw new BadRequestException('dateFrom must be before dateTo');
    }

    const updatedPrice = await this.prisma.price.update({
      where: { id: priceId },
      data: {
        dateFrom,
        dateTo,
        adultPrice: dto.adultPrice,
        childPrice: dto.childPrice,
        minPrice: dto.minPrice,
        availableSlots: dto.availableSlots,
        groupTiers: dto.groupTiers !== undefined ? (dto.groupTiers as any) : undefined,
      },
    });

    return updatedPrice;
  }

  async deletePrice(priceId: string, userId: string, userRole: UserRole) {
    const price = await this.prisma.price.findUnique({
      where: { id: priceId },
      include: {
        ticket: {
          include: { card: true },
        },
      },
    });

    if (!price) {
      throw new NotFoundException('Price not found');
    }

    if (userRole !== UserRole.ADMIN && price.ticket.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this price');
    }

    // Check if price has orders
    const ordersWithPrice = await this.prisma.orderTicket.count({
      where: { priceId },
    });

    if (ordersWithPrice > 0) {
      // Archive instead of delete to preserve order history
      const archived = await this.prisma.price.update({
        where: { id: priceId },
        data: { isArchived: true },
      });
      return { message: 'Price archived', archived: true, price: archived };
    }

    await this.prisma.price.delete({
      where: { id: priceId },
    });

    return { message: 'Price deleted successfully', archived: false };
  }

  async unarchivePrice(priceId: string, userId: string, userRole: UserRole) {
    const price = await this.prisma.price.findUnique({
      where: { id: priceId },
      include: {
        ticket: {
          include: { card: true },
        },
      },
    });

    if (!price) {
      throw new NotFoundException('Price not found');
    }

    if (userRole !== UserRole.ADMIN && price.ticket.card.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this price');
    }

    const restored = await this.prisma.price.update({
      where: { id: priceId },
      data: { isArchived: false },
    });

    return restored;
  }

  async getPrices(ticketId: string, filters: PriceFilterDto) {
    const { includeExpired = false } = filters;

    const where: any = { ticketId };

    if (!includeExpired) {
      where.dateTo = {
        gte: new Date(),
      };
    }

    const prices = await this.prisma.price.findMany({
      where,
      orderBy: { dateFrom: 'asc' },
    });

    return prices;
  }

  async getPriceForDate(ticketId: string, date: Date) {
    const price = await this.prisma.price.findFirst({
      where: {
        ticketId,
        isArchived: false,
        dateFrom: { lte: date },
        dateTo: { gte: date },
      },
    });

    return price;
  }

  async checkAvailability(ticketId: string, date: Date) {
    const price = await this.getPriceForDate(ticketId, date);

    if (!price) {
      return {
        available: false,
        reason: 'No price configured for this date',
      };
    }

    if (!price.availableSlots) {
      return {
        available: true,
        unlimited: true,
        price,
      };
    }

    // Count how many slots are already booked for this date
    const bookedSlots = await this.prisma.orderTicket.count({
      where: {
        priceId: price.id,
        order: {
          date: date,
          status: {
            in: ['PREORDER', 'CONFIRMED', 'PAID'],
          },
        },
      },
    });

    const availableSlots = price.availableSlots - bookedSlots;

    return {
      available: availableSlots > 0,
      availableSlots,
      totalSlots: price.availableSlots,
      bookedSlots,
      price,
    };
  }

  async getTicketWithPrices(ticketId: string, includeExpired = false) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        prices: {
          where: includeExpired
            ? { isArchived: false }
            : {
                isArchived: false,
                dateTo: {
                  gte: new Date(),
                },
              },
          orderBy: { dateFrom: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }
}
