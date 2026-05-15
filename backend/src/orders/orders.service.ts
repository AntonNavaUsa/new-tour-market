import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { SchedulesService } from '../schedules/schedules.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto, OrderFilterDto, CreateMessageDto } from './dto';
import { OrderStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private ticketsService: TicketsService,
    private schedulesService: SchedulesService,
    private notificationsService: NotificationsService,
  ) {}

  async createPreOrder(userId: string, dto: CreateOrderDto) {
    // Verify card exists and is published
    const card = await this.prisma.card.findUnique({
      where: { id: dto.cardId },
      include: {
        tickets: true,
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.status !== 'PUBLISHED') {
      throw new BadRequestException('Card is not available for booking');
    }

    // Verify schedule - check if the selected date and time are available
    if (dto.time) {
      const isTimeAvailable = await this.schedulesService.isTimeAvailable(
        dto.cardId,
        new Date(dto.date),
        dto.time,
      );

      if (!isTimeAvailable) {
        throw new BadRequestException('Selected time is not available');
      }
    }

    // Verify tickets and calculate total amount
    let totalAmount = 0;
    const ticketDetails = [];

    for (const ticketOrder of dto.tickets) {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketOrder.ticketId },
      });

      if (!ticket || ticket.cardId !== dto.cardId) {
        throw new BadRequestException(`Invalid ticket: ${ticketOrder.ticketId}`);
      }

      // Get price for the date
      const price = await this.ticketsService.getPriceForDate(
        ticketOrder.ticketId,
        new Date(dto.date),
      );

      if (!price) {
        throw new BadRequestException(`No price available for ticket ${ticket.title} on this date`);
      }

      // Check availability
      const availability = await this.ticketsService.checkAvailability(
        ticketOrder.ticketId,
        new Date(dto.date),
      );

      if (!availability.available) {
        throw new BadRequestException(
          `Ticket ${ticket.title} is not available: ${availability.reason || 'Sold out'}`,
        );
      }

      if (
        availability.availableSlots !== undefined &&
        ticketOrder.quantity > availability.availableSlots
      ) {
        throw new BadRequestException(
          `Only ${availability.availableSlots} slots available for ${ticket.title}`,
        );
      }

      // Calculate price considering group tiers
      let ticketPrice: number;
      const groupTiers = price.groupTiers as Array<{
        minPeople: number;
        maxPeople: number | null;
        price: number;
        priceType: 'fixed' | 'per_person';
      }> | null;

      if (groupTiers && groupTiers.length > 0) {
        const people = ticketOrder.quantity;
        const tier = groupTiers.find(
          (t) => people >= t.minPeople && (t.maxPeople == null || people <= t.maxPeople),
        );
        if (!tier) {
          throw new BadRequestException(
            `No pricing tier found for ${people} people on ticket "${ticket.title}"`,
          );
        }
        ticketPrice = tier.priceType === 'fixed' ? tier.price : tier.price * people;
      } else {
        ticketPrice = Number(price.adultPrice) * ticketOrder.quantity;
      }
      totalAmount += ticketPrice;

      ticketDetails.push({
        ticketId: ticket.id,
        priceId: price.id,
        quantity: ticketOrder.quantity,
        priceSnapshot: {
          ticketTitle: ticket.title,
          adultPrice: price.adultPrice,
          childPrice: price.childPrice,
          groupTiers: price.groupTiers,
          calculatedTotal: ticketPrice,
        },
      });
    }

    // Calculate expiration time (20 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 20);

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        cardId: dto.cardId,
        date: new Date(dto.date),
        time: dto.time,
        quantity: dto.tickets.reduce((sum, t) => sum + t.quantity, 0),
        amount: totalAmount,
        prepaymentPercent: 20,
        prepaymentAmount: Math.ceil((totalAmount * 0.2) / 100) * 100,
        status: OrderStatus.PREORDER,
        expiresAt,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        notes: dto.notes,
        orderTickets: {
          create: ticketDetails,
        },
      },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            headPhotoUrl: true,
          },
        },
        orderTickets: {
          include: {
            ticket: true,
            price: true,
          },
        },
      },
    });

    // Notify admin about new pre-order
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@travelio.local';
      await this.notificationsService.sendAdminOrderNotification(adminEmail, {
        orderId: order.id,
        cardTitle: order.card.title,
        userName: dto.customerName || 'Не указано',
        userEmail: dto.customerEmail || 'Не указано',
        userPhone: dto.customerPhone,
        date: new Date(dto.date).toLocaleDateString('ru-RU'),
        time: dto.time || 'Будет уточнено',
        quantity: order.quantity,
        totalAmount: Number(order.amount),
        isPaid: false,
      });
    } catch (error) {
      this.logger.error(`Failed to send admin notification for order ${order.id}:`, error);
    }

    return order;
  }

  async confirmBooking(orderId: string, userId: string, userRole: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        card: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check ownership
    if (userRole !== UserRole.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this order');
    }

    // Check if order is still valid
    if (order.status !== OrderStatus.PREORDER) {
      throw new BadRequestException('Order cannot be confirmed in its current state');
    }

    if (order.expired || (order.expiresAt && new Date() > order.expiresAt)) {
      throw new BadRequestException('Order has expired');
    }

    // Update order status
    const confirmed = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
      },
      include: {
        card: true,
        user: true,
        orderTickets: {
          include: {
            ticket: true,
          },
        },
      },
    });

    // Send email confirmation to user
    try {
      await this.notificationsService.sendOrderConfirmation(confirmed.user.email, {
        orderId: confirmed.id,
        cardTitle: confirmed.card.title,
        date: confirmed.date.toLocaleDateString('ru-RU'),
        time: confirmed.time || 'Будет уточнено',
        quantity: confirmed.quantity,
        totalAmount: Number(confirmed.amount),
      });

      // Send notification to admin
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@travelio.local';
      await this.notificationsService.sendAdminOrderNotification(adminEmail, {
        orderId: confirmed.id,
        cardTitle: confirmed.card.title,
        userName: confirmed.user.name,
        userEmail: confirmed.user.email,
        date: confirmed.date.toLocaleDateString('ru-RU'),
        time: confirmed.time || 'Будет уточнено',
        quantity: confirmed.quantity,
        totalAmount: Number(confirmed.amount),
      });
    } catch (error) {
      this.logger.error(`Failed to send email notifications for order ${orderId}:`, error);
      // Don't throw error, order is still confirmed
    }

    return confirmed;
  }

  async cancelOrder(orderId: string, userId: string, userRole: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check ownership or admin role
    if (userRole !== UserRole.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }

    // Cannot cancel paid orders without refund process
    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Cannot cancel paid order. Please contact support for refund.');
    }

    const cancelled = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });

    return cancelled;
  }

  async getUserOrders(userId: string, filters: OrderFilterDto) {
    const { status, skip = 0, take = 20 } = filters;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          card: {
            select: {
              id: true,
              title: true,
              headPhotoUrl: true,
              meetingPoint: true,
              postPaymentInfo: true,
              partner: {
                select: {
                  id: true,
                  title: true,
                  contacts: true,
                  logoUrl: true,
                },
              },
              location: {
                select: {
                  id: true,
                  city: true,
                  region: true,
                  country: true,
                },
              },
            },
          },
          orderTickets: {
            include: {
              ticket: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async getAllOrders(userRole: UserRole, partnerId: string | null, filters: OrderFilterDto) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.PARTNER) {
      throw new ForbiddenException('Access denied');
    }

    const { status, cardId, skip = 0, take = 20 } = filters;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (cardId) {
      where.cardId = cardId;
    }

    // Partners can only see orders for their cards
    if (userRole === UserRole.PARTNER && partnerId) {
      where.card = {
        partnerId,
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          card: {
            select: {
              id: true,
              title: true,
              headPhotoUrl: true,
            },
          },
          orderTickets: {
            include: {
              ticket: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          payments: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async getOrderById(orderId: string, userId: string, userRole: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        card: {
          include: {
            location: true,
          },
        },
        orderTickets: {
          include: {
            ticket: true,
            price: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (userRole !== UserRole.ADMIN && order.userId !== userId) {
      // Check if user is partner of the card
      const isPartner =
        userRole === UserRole.PARTNER &&
        order.card.partnerId &&
        (await this.prisma.user.findFirst({
          where: {
            id: userId,
            partnerId: order.card.partnerId,
          },
        }));

      if (!isPartner) {
        throw new ForbiddenException('You do not have permission to view this order');
      }
    }

    return order;
  }

  // Scheduled task to mark expired orders
  @Cron(CronExpression.EVERY_MINUTE)
  async checkAndMarkExpired() {
    const now = new Date();

    const expiredOrders = await this.prisma.order.updateMany({
      where: {
        status: OrderStatus.PREORDER,
        expired: false,
        expiresAt: {
          lt: now,
        },
      },
      data: {
        expired: true,
        status: OrderStatus.EXPIRED,
      },
    });

    if (expiredOrders.count > 0) {
      this.logger.log(`Marked ${expiredOrders.count} orders as expired`);
    }
  }

  // ─── Chat / Messages ──────────────────────────────────────────────

  private async checkOrderAccess(
    orderId: string,
    userId: string,
    userRole: UserRole,
    partnerId: string | null,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { card: { select: { partnerId: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (userRole === UserRole.ADMIN) return order;
    if (order.userId === userId) return order;
    if (
      userRole === UserRole.PARTNER &&
      partnerId &&
      order.card.partnerId === partnerId
    )
      return order;

    throw new ForbiddenException('Access denied');
  }

  async getMessages(
    orderId: string,
    userId: string,
    userRole: UserRole,
    partnerId: string | null,
  ) {
    await this.checkOrderAccess(orderId, userId, userRole, partnerId);

    const isOrganizer =
      userRole === UserRole.ADMIN || userRole === UserRole.PARTNER;

    // Mark incoming messages as read
    await this.prisma.orderMessage.updateMany({
      where: {
        orderId,
        readAt: null,
        isFromOrganizer: !isOrganizer, // messages from the other side
      },
      data: { readAt: new Date() },
    });

    return this.prisma.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });
  }

  async sendMessage(
    orderId: string,
    senderId: string,
    userRole: UserRole,
    partnerId: string | null,
    dto: CreateMessageDto,
  ) {
    await this.checkOrderAccess(orderId, senderId, userRole, partnerId);

    const isOrganizer =
      userRole === UserRole.ADMIN || userRole === UserRole.PARTNER;

    return this.prisma.orderMessage.create({
      data: {
        orderId,
        senderId,
        text: dto.text.trim(),
        isFromOrganizer: isOrganizer,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });
  }

  async getUnreadCount(
    userId: string,
    userRole: UserRole,
    partnerId: string | null,
  ): Promise<{ count: number }> {
    const isOrganizer =
      userRole === UserRole.ADMIN || userRole === UserRole.PARTNER;

    if (userRole === UserRole.ADMIN) {
      const count = await this.prisma.orderMessage.count({
        where: { isFromOrganizer: false, readAt: null },
      });
      return { count };
    }

    if (isOrganizer && partnerId) {
      const count = await this.prisma.orderMessage.count({
        where: {
          isFromOrganizer: false,
          readAt: null,
          order: { card: { partnerId } },
        },
      });
      return { count };
    }

    // Regular user
    const count = await this.prisma.orderMessage.count({
      where: {
        isFromOrganizer: true,
        readAt: null,
        order: { userId },
      },
    });
    return { count };
  }
}
