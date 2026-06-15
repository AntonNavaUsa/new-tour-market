import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingStepsTemplatesService } from './booking-steps-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('booking-steps-templates')
@Controller('booking-steps-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class BookingStepsTemplatesController {
  constructor(private service: BookingStepsTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all booking-steps templates' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create booking-steps template' })
  create(@Body() data: { name: string; steps: Array<{ title: string; description: string }> }) {
    return this.service.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update booking-steps template' })
  update(
    @Param('id') id: string,
    @Body() data: { name?: string; steps?: Array<{ title: string; description: string }> },
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: delete booking-steps template' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
