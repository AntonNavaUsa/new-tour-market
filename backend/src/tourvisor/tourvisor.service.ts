import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { TourvisorClient } from './tourvisor.client';
import { PrismaService } from '../prisma/prisma.service';
import { SletatProvider } from './sletat.provider';
import {
  ReferenceQueryDto,
  TourDetailsQueryDto,
  TourSearchDto,
} from './dto/tour-search.dto';

@Injectable()
export class TourvisorService {
  constructor(
    private readonly client: TourvisorClient,
    private readonly prisma: PrismaService,
    private readonly sletat: SletatProvider,
  ) {}

  private async selectedProvider() {
    const setting = await this.prisma.siteSettings.findUnique({ where: { key: 'tourProvider' } });
    return setting?.value || 'tourvisor';
  }

  async getDepartures(query: ReferenceQueryDto) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getDepartures();
    return this.client.get('/departures', {
      departureCountryId: query.departureCountryId,
    });
  }

  async getCountries(query: ReferenceQueryDto) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getCountries(query);
    return this.client.get('/countries', {
      departureId: query.departureId,
      onlyCharter: query.onlyCharter,
      onlyDirect: query.onlyDirect,
    });
  }

  async getArrivals(query: ReferenceQueryDto) {
    if (await this.selectedProvider() === 'sletat') return [];
    if (!query.departureId) {
      throw new BadRequestException('departureId is required');
    }

    return this.client.get('/arrivals', {
      departureId: query.departureId,
      onlyCharter: query.onlyCharter,
      onlyDirect: query.onlyDirect,
    });
  }

  async getDates(query: ReferenceQueryDto) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getDates(query);
    if (!query.departureId || !query.countryId) {
      throw new BadRequestException('departureId and countryId are required');
    }

    return this.client.get('/tours/dates', {
      departureId: query.departureId,
      countryId: query.countryId,
      onlyCharter: query.onlyCharter,
    });
  }

  async getCurrencies() {
    if (await this.selectedProvider() === 'sletat') return [{ id: 5, name: 'RUB' }];
    return this.client.get('/currencies');
  }

  async getMeals() {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getMeals();
    return this.client.get('/meals');
  }

  async getRegions(query: ReferenceQueryDto) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getRegions(query);
    if (!query.countryId) {
      throw new BadRequestException('countryId is required');
    }
    return this.client.get('/regions', { countryId: query.countryId });
  }

  async getHotels(query: ReferenceQueryDto) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getHotels(query);
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

  async getRooms(ids: number[]) {
    if (await this.selectedProvider() === 'sletat') return [];
    return this.client.get('/rooms', { ids });
  }

  async startSearch(search: TourSearchDto) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.startSearch(search);
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

  async getStatus(searchId: number, operatorStatus: boolean) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getStatus(searchId);
    return this.client.get(`/tours/search/${searchId}/status`, { operatorStatus });
  }

  async getResults(searchId: number, limit: number) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getResults(searchId, limit);
    return this.client.get(`/tours/search/${searchId}`, { limit });
  }

  async getTour(tourId: number, query: TourDetailsQueryDto) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getTour(tourId, query);
    return this.client.get(`/tours/${tourId}`, { currency: query.currency });
  }

  async getFlights(tourId: number, query: TourDetailsQueryDto) {
    if (await this.selectedProvider() === 'sletat') return this.sletat.getFlights(tourId, query);
    return this.client.get(`/tours/${tourId}/flights`, { currency: query.currency });
  }
}
