import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { UpdateWeeklyScheduleDto, AddSpecialDateDto, GetAvailableTimesDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) {}

  @Get('cards/:cardId')
  @ApiOperation({ summary: 'Get card schedule' })
  async getSchedule(@Param('cardId') cardId: string) {
    return this.schedulesService.getSchedule(cardId);
  }

  @Put('cards/:cardId/weekly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update weekly schedule' })
  async updateWeeklySchedule(
    @Param('cardId') cardId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: UpdateWeeklyScheduleDto,
  ) {
    return this.schedulesService.updateWeeklySchedule(cardId, userId, userRole, dto);
  }

  @Post('cards/:cardId/special-dates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add special date (holiday/closure)' })
  async addSpecialDate(
    @Param('cardId') cardId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: AddSpecialDateDto,
  ) {
    return this.schedulesService.addSpecialDate(cardId, userId, userRole, dto);
  }

  @Delete('cards/:cardId/special-dates/:index')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove special date' })
  async removeSpecialDate(
    @Param('cardId') cardId: string,
    @Param('index', ParseIntPipe) index: number,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.schedulesService.removeSpecialDate(cardId, userId, userRole, index);
  }

  @Post('cards/:cardId/available-times')
  @ApiOperation({ summary: 'Get available times for specific date' })
  async getAvailableTimes(@Param('cardId') cardId: string, @Body() dto: GetAvailableTimesDto) {
    return this.schedulesService.getAvailableTimes(cardId, dto);
  }

  @Get('cards/:cardId/month/:year/:month')
  @ApiOperation({ summary: 'Get month availability overview' })
  async getMonthAvailability(
    @Param('cardId') cardId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.schedulesService.getMonthAvailability(cardId, year, month);
  }
}
