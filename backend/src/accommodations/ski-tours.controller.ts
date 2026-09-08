import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccommodationsService } from './accommodations.service';
import { AccommodationFilterDto } from './dto';

@ApiTags('ski-tours')
@Controller('ski-tours')
export class SkiToursController {
  constructor(private accommodationsService: AccommodationsService) {}

  @Get('hotels')
  @ApiOperation({ summary: 'List ski-tour hotels with filters' })
  async findHotels(@Query() filters: AccommodationFilterDto) {
    return this.accommodationsService.findSkiHotels(filters);
  }
}
