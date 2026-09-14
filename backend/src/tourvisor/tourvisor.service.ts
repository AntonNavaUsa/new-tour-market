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

  getMeals() {
    return this.client.get('/meals');
  }

  getRegions(query: ReferenceQueryDto) {
    if (!query.countryId) {
      throw new BadRequestException('countryId is required');
    }
    return this.client.get('/regions', { countryId: query.countryId });
  }

  async getHotels(query: ReferenceQueryDto) {
    if (!query.countryId) {
      throw new BadRequestException('countryId is required');
    }
    const hotels = await this.client.get<Array<{ id?: number; name?: string }>>('/hotels', {
      countryId: query.countryId,
      regionId: query.regionId,
      category: query.category,
    });
    if (!query.name?.trim()) return hotels;

    const nameQuery = query.name.trim().toLowerCase();
    return hotels.filter((hotel) => hotel.name?.toLowerCase().includes(nameQuery));
  }

  getRooms(ids: number[]) {
    return this.client.get('/rooms', { ids });
  }

  async startSearch(search: TourSearchDto) {
    if (search.dateFrom > search.dateTo) {
      throw new BadRequestException('dateFrom must be before dateTo');
    }
    if (search.nightsFrom > search.nightsTo || search.nightsTo - search.nightsFrom > 10) {
      throw new BadRequestException('The nights range must be between 0 and 10 days');
    }
    if (new Date(search.dateTo).getTime() - new Date(search.dateFrom).getTime() > 21 * 86400000) {
      throw new BadRequestException('The departure date range cannot exceed 21 days');
    }

    let hotelIds: number[] | undefined = search.hotelIds;
    if (!hotelIds?.length && search.hotelName?.trim()) {
      const hotels = await this.client.get<Array<{ id?: number; name?: string }>>('/hotels', {
        countryId: search.countryId,
        regionId: search.resort ? Number(search.resort) : undefined,
        category: search.hotelStars,
      });
      const query = search.hotelName.trim().toLowerCase();
      hotelIds = hotels
        .filter((hotel) => hotel.name?.toLowerCase().includes(query))
        .map((hotel) => hotel.id)
        .filter((id): id is number => typeof id === 'number');
      if (hotelIds.length === 0) {
        throw new BadRequestException('Отели по заданному названию не найдены');
      }
    }

    const mealId = search.meal && /^\d+$/.test(search.meal) ? Number(search.meal) : undefined;

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
      meal: mealId,
      hotelCategory: search.hotelStars,
      regionIds: search.resort ? [Number(search.resort)] : undefined,
      hotelIds,
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
