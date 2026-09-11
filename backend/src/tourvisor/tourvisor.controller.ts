import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { TourvisorService } from './tourvisor.service';
import {
  ReferenceQueryDto,
  SearchResultsQueryDto,
  SearchStatusQueryDto,
  TourDetailsQueryDto,
  TourSearchDto,
} from './dto/tour-search.dto';

@Controller('tour-search')
export class TourvisorController {
  constructor(private readonly service: TourvisorService) {}

  @Get('departures')
  getDepartures(@Query() query: ReferenceQueryDto) {
    return this.service.getDepartures(query);
  }

  @Get('countries')
  getCountries(@Query() query: ReferenceQueryDto) {
    return this.service.getCountries(query);
  }

  @Get('arrivals')
  getArrivals(@Query() query: ReferenceQueryDto) {
    return this.service.getArrivals(query);
  }

  @Get('dates')
  getDates(@Query() query: ReferenceQueryDto) {
    return this.service.getDates(query);
  }

  @Get('currencies')
  getCurrencies() {
    return this.service.getCurrencies();
  }

  @Post('search')
  startSearch(@Body() query: TourSearchDto) {
    return this.service.startSearch(query);
  }

  @Get('search/:searchId/status')
  getStatus(
    @Param('searchId', ParseIntPipe) searchId: number,
    @Query() query: SearchStatusQueryDto,
  ) {
    return this.service.getStatus(searchId, query.operatorStatus);
  }

  @Get('search/:searchId/results')
  getResults(
    @Param('searchId', ParseIntPipe) searchId: number,
    @Query() query: SearchResultsQueryDto,
  ) {
    return this.service.getResults(searchId, query.limit);
  }

  @Get('tours/:tourId')
  getTour(
    @Param('tourId', ParseIntPipe) tourId: number,
    @Query() query: TourDetailsQueryDto,
  ) {
    return this.service.getTour(tourId, query);
  }

  @Get('tours/:tourId/flights')
  getFlights(
    @Param('tourId', ParseIntPipe) tourId: number,
    @Query() query: TourDetailsQueryDto,
  ) {
    return this.service.getFlights(tourId, query);
  }
}
