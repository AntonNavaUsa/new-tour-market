import { BadRequestException, Injectable } from '@nestjs/common';
import { TourvisorClient } from './tourvisor.client';
import {
  ReferenceQueryDto,
  TourDetailsQueryDto,
  TourSearchDto,
} from './dto/tour-search.dto';

@Injectable()
export class TourvisorService {
  constructor(private readonly client: TourvisorClient) {}

  getDepartures(query: ReferenceQueryDto) {
    return this.client.get('/departures', {
      departureCountryId: query.departureCountryId,
    });
  }

  getCountries(query: ReferenceQueryDto) {
    return this.client.get('/countries', {
      departureId: query.departureId,
      onlyCharter: query.onlyCharter,
      onlyDirect: query.onlyDirect,
    });
  }

  getArrivals(query: ReferenceQueryDto) {
    if (!query.departureId) {
      throw new BadRequestException('departureId is required');
    }

    return this.client.get('/arrivals', {
      departureId: query.departureId,
      onlyCharter: query.onlyCharter,
      onlyDirect: query.onlyDirect,
    });
  }

  getDates(query: ReferenceQueryDto) {
    if (!query.departureId || !query.countryId) {
      throw new BadRequestException('departureId and countryId are required');
    }

    return this.client.get('/tours/dates', {
      departureId: query.departureId,
      countryId: query.countryId,
      onlyCharter: query.onlyCharter,
    });
  }

  getCurrencies() {
    return this.client.get('/currencies');
  }

  startSearch(search: TourSearchDto) {
    if (search.dateFrom > search.dateTo) {
      throw new BadRequestException('dateFrom must be before dateTo');
    }
    if (search.nightsFrom > search.nightsTo || search.nightsTo - search.nightsFrom > 10) {
      throw new BadRequestException('The nights range must be between 0 and 10 days');
    }
    if (new Date(search.dateTo).getTime() - new Date(search.dateFrom).getTime() > 21 * 86400000) {
      throw new BadRequestException('The departure date range cannot exceed 21 days');
    }

    return this.client.get('/tours/search', {
      departureId: search.departureId,
      countryId: search.countryId,
      dateFrom: search.dateFrom,
      dateTo: search.dateTo,
      nightsFrom: search.nightsFrom,
      nightsTo: search.nightsTo,
      adults: search.adults,
      childs: search.childs,
      currency: search.currency,
      onlyCharter: search.onlyCharter,
      onlyDirect: search.onlyDirect,
    });
  }

  getStatus(searchId: number, operatorStatus: boolean) {
    return this.client.get(`/tours/search/${searchId}/status`, { operatorStatus });
  }

  getResults(searchId: number, limit: number) {
    return this.client.get(`/tours/search/${searchId}`, { limit });
  }

  getTour(tourId: number, query: TourDetailsQueryDto) {
    return this.client.get(`/tours/${tourId}`, { currency: query.currency });
  }

  getFlights(tourId: number, query: TourDetailsQueryDto) {
    return this.client.get(`/tours/${tourId}/flights`, { currency: query.currency });
  }
}
