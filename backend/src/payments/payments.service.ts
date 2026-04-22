import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto } from './dto';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { YooCheckout } from '@a2seven/yoo-checkout';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private yooKassa: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    const shopId = this.config.get('YOOKASSA_SHOP_ID');
    const secretKey = this.config.get('YOOKASSA_SECRET_KEY');
    const isPlaceholder = !shopId || !secretKey ||
      shopId === 'your-shop-id' || secretKey === 'your-secret-key';

    if (!isPlaceholder) {
      try {
        this.yooKassa = new YooCheckout({
          shopId,
          secretKey,
        });
        this.logger.log('YooKassa initialized successfully');
      } catch (error) {
        this.logger.warn('YooKassa initialization failed. Payment features will be limited.');
        this.logger.warn(error);
      }
    } else {
      this.logger.warn('YooKassa credentials not configured (using mock mode)');
    }
  }

  async createPayment(userId: string, dto: CreatePaymentDto) {
    // Verify order exists and belongs to user
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        card: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to pay for this order');
    }

    // Check order status
    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.EXPIRED) {
      throw new BadRequestException('Cannot pay for cancelled or expired order');
    }

    if (order.expired) {
      throw new BadRequestException('Order has expired');
    }

    // Use prepayment amount (20% rounded up to nearest 100 rubles)
    const paymentAmount = order.prepaymentAmount ?? order.amount;

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        orderId: dto.orderId,
        amount: paymentAmount,
        status: PaymentStatus.PENDING,
      },
    });

    // Create payment in YooKassa
    if (this.yooKassa) {
      try {
        const yooPayment = await this.yooKassa.createPayment({
          amount: {
            value: Number(paymentAmount).toFixed(2),
            currency: 'RUB',
          },
          confirmation: {
            type: 'embedded',
          },
          capture: true,
          description: `Предоплата 20% за заказ #${order.id.substring(0, 8)} - ${order.card.title}`,
          metadata: {
            orderId: order.id,
            paymentId: payment.id,
          },
        });

        // Update payment with YooKassa data
        const updatedPayment = await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymentIdExternal: yooPayment.id,
            confirmationToken: yooPayment.confirmation?.confirmation_token,
            metadata: yooPayment,
          },
        });

        return {
          paymentId: updatedPayment.id,
          confirmationToken: yooPayment.confirmation?.confirmation_token,
          amount: paymentAmount,
          totalAmount: order.amount,
          remainingAmount: Number(order.amount) - Number(paymentAmount),
        };
      } catch (error) {
        this.logger.error('YooKassa payment creation failed', error);

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            metadata: {
              error: error.message,
            },
          },
        });

        // In development mode fall through to mock response
        const isDev = this.config.get('NODE_ENV') !== 'production';
        if (isDev) {
          this.logger.warn('YooKassa failed in dev mode — returning mock response');
          return {
            paymentId: payment.id,
            confirmationToken: 'test_token_' + payment.id,
            amount: paymentAmount,
            totalAmount: order.amount,
            remainingAmount: Number(order.amount) - Number(paymentAmount),
            note: `YooKassa error (dev mock): ${error.message}`,
          };
        }

        throw new BadRequestException('Failed to create payment. Please try again later.');
      }
    }

    // If YooKassa is not configured, return mock response for testing
    return {
      paymentId: payment.id,
      confirmationToken: 'test_token_' + payment.id,
      amount: paymentAmount,
      totalAmount: order.amount,
      remainingAmount: Number(order.amount) - Number(paymentAmount),
      note: 'YooKassa not configured. This is a test payment.',
    };
  }

  async getPaymentStatus(paymentId: string, userId: string, userRole: UserRole) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            card: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check access
    if (userRole !== UserRole.ADMIN && payment.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this payment');
    }

    // Try to update status from YooKassa
    if (this.yooKassa && payment.paymentIdExternal) {
      try {
        const yooPayment = await this.yooKassa.getPayment(payment.paymentIdExternal);

        let newStatus = payment.status;

        switch (yooPayment.status) {
          case 'pending':
            newStatus = PaymentStatus.PENDING;
            break;
          case 'waiting_for_capture':
            newStatus = PaymentStatus.PROCESSING;
            break;
          case 'succeeded':
            newStatus = PaymentStatus.SUCCEEDED;
            break;
          case 'canceled':
            newStatus = PaymentStatus.CANCELLED;
            break;
        }

        if (newStatus !== payment.status) {
          await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: newStatus,
              metadata: yooPayment,
              paidAt: newStatus === PaymentStatus.SUCCEEDED ? new Date() : payment.paidAt,
            },
          });

          // If payment succeeded, update order
          if (newStatus === PaymentStatus.SUCCEEDED) {
            await this.handleSuccessfulPayment(paymentId);
          }
        }

        return {
          ...payment,
          status: newStatus,
          yooKassaData: yooPayment,
        };
      } catch (error) {
        this.logger.error('Failed to get payment status from YooKassa', error);
      }
    }

    return payment;
  }

  async handleSuccessfulPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            user: true,
            card: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Payment is not successful');
    }

    // Update order status to PAID
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: OrderStatus.PAID,
      },
    });

    this.logger.log(`Order ${payment.orderId} marked as PAID`);

    // Send email notification to user
    try {
      await this.notificationsService.sendPaymentSuccessNotification(
        payment.order.user.email,
        {
          orderId: payment.order.id,
          cardTitle: payment.order.card.title,
          amount: Number(payment.amount),
          paymentId: payment.paymentIdExternal || payment.id,
        },
      );
      this.logger.log(`Payment success notification sent to ${payment.order.user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send payment success notification:`, error);
      // Don't throw error, payment is still processed
    }

    return { message: 'Payment processed successfully' };
  }

  async handleCallback(orderId: string) {
    // This method handles return_url callback from YooKassa
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const latestPayment = order.payments[0];

    if (!latestPayment) {
      throw new NotFoundException('Payment not found');
    }

    // Check payment status
    if (this.yooKassa && latestPayment.paymentIdExternal) {
      try {
        const yooPayment = await this.yooKassa.getPayment(latestPayment.paymentIdExternal);

        if (yooPayment.status === 'succeeded') {
          await this.prisma.payment.update({
            where: { id: latestPayment.id },
            data: {
              status: PaymentStatus.SUCCEEDED,
              paidAt: new Date(),
              metadata: yooPayment,
            },
          });

          await this.handleSuccessfulPayment(latestPayment.id);

          return {
            success: true,
            order,
            payment: latestPayment,
          };
        }
      } catch (error) {
        this.logger.error('Failed to verify payment status', error);
      }
    }

    return {
      success: false,
      order,
      payment: latestPayment,
    };
  }

  async getAllPayments(userRole: UserRole, filters: any) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }

    const { skip = 0, take = 20, status } = filters;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
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
            },
          },
          order: {
            include: {
              card: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }
}
