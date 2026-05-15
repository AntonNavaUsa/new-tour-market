import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderFilterDto, CreateMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create pre-order (booking)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async createOrder(@CurrentUser('id') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createPreOrder(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user orders' })
  async getUserOrders(@CurrentUser('id') userId: string, @Query() filters: OrderFilterDto) {
    return this.ordersService.getUserOrders(userId, filters);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders (admin/partner)' })
  async getAllOrders(
    @CurrentUser('role') userRole: UserRole,
    @CurrentUser('partnerId') partnerId: string,
    @Query() filters: OrderFilterDto,
  ) {
    return this.ordersService.getAllOrders(userRole, partnerId, filters);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ordersService.getOrderById(id, userId, userRole);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm booking (for free tours)' })
  async confirmOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ordersService.confirmBooking(id, userId, userRole);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ordersService.cancelOrder(id, userId, userRole);
  }

  // ─── Chat ─────────────────────────────────────────────────────────

  @Get('messages/unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread messages count for current user' })
  async getUnreadCount(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentUser('partnerId') partnerId: string,
  ) {
    return this.ordersService.getUnreadCount(userId, userRole, partnerId ?? null);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get messages for an order' })
  async getMessages(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentUser('partnerId') partnerId: string,
  ) {
    return this.ordersService.getMessages(id, userId, userRole, partnerId ?? null);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message for an order' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentUser('partnerId') partnerId: string,
  ) {
    return this.ordersService.sendMessage(id, userId, userRole, partnerId ?? null, dto);
  }
}
