import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CreatePriceDto,
  PriceFilterDto,
  CheckAvailabilityDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post('cards/:cardId/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create ticket for card' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async createTicket(
    @Param('cardId') cardId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.createTicket(cardId, userId, userRole, dto);
  }

  @Get('cards/:cardId/tickets')
  @ApiOperation({ summary: 'Get all tickets for card' })
  async getCardTickets(@Param('cardId') cardId: string) {
    return this.ticketsService.getCardTickets(cardId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID with prices' })
  @ApiQuery({ name: 'includeExpired', required: false, type: Boolean })
  async getTicket(@Param('id') id: string, @Query('includeExpired') includeExpired?: boolean) {
    return this.ticketsService.getTicketWithPrices(id, includeExpired);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket' })
  async updateTicket(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.ticketsService.updateTicket(id, userId, userRole, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ticket' })
  async deleteTicket(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ticketsService.deleteTicket(id, userId, userRole);
  }

  @Post(':ticketId/prices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create price for ticket' })
  @ApiResponse({ status: 201, description: 'Price created' })
  async createPrice(
    @Param('ticketId') ticketId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CreatePriceDto,
  ) {
    return this.ticketsService.createPrice(ticketId, userId, userRole, dto);
  }

  @Get(':ticketId/prices')
  @ApiOperation({ summary: 'Get prices for ticket' })
  @ApiQuery({ name: 'includeExpired', required: false, type: Boolean })
  async getPrices(
    @Param('ticketId') ticketId: string,
    @Query() filters: PriceFilterDto,
  ) {
    return this.ticketsService.getPrices(ticketId, filters);
  }

  @Patch('prices/:priceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update price' })
  async updatePrice(
    @Param('priceId') priceId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CreatePriceDto,
  ) {
    return this.ticketsService.updatePrice(priceId, userId, userRole, dto);
  }

  @Delete('prices/:priceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete price (archives if used in orders)' })
  async deletePrice(
    @Param('priceId') priceId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ticketsService.deletePrice(priceId, userId, userRole);
  }

  @Patch('prices/:priceId/unarchive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore archived price' })
  async unarchivePrice(
    @Param('priceId') priceId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.ticketsService.unarchivePrice(priceId, userId, userRole);
  }

  @Post(':ticketId/check-availability')
  @ApiOperation({ summary: 'Check ticket availability for date' })
  async checkAvailability(
    @Param('ticketId') ticketId: string,
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.ticketsService.checkAvailability(ticketId, dto.date);
  }
}
