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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment for order' })
  @ApiResponse({
    status: 201,
    description: 'Payment created, returns confirmation token for YooKassa widget',
  })
  async createPayment(@CurrentUser('id') userId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(userId, dto);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check payment status' })
  async getPaymentStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.paymentsService.getPaymentStatus(id, userId, userRole);
  }

  @Get('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle payment callback (return_url)' })
  async handleCallback(@Query('orderId') orderId: string) {
    return this.paymentsService.handleCallback(orderId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'YooKassa webhook notification handler' })
  async handleWebhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }

  @Post(':id/success')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manual payment success handler (for testing)' })
  async handleSuccess(@Param('id') paymentId: string) {
    return this.paymentsService.handleSuccessfulPayment(paymentId);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments (admin only)' })
  async getAllPayments(@CurrentUser('role') userRole: UserRole, @Query() filters: any) {
    return this.paymentsService.getAllPayments(userRole, filters);
  }
}
