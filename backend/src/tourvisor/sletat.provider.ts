import { BadRequestException, Injectable } from '@nestjs/common';
import { ReferenceQueryDto, TourDetailsQueryDto, TourSearchDto } from './dto/tour-search.dto';
import { SletatClient } from './sletat.client';

export type SletatSearchStatus = {
  searchId: number;
  status: string;
  progress: number;
  minPrice: number;
  operatorStatus: unknown[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {};

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const numberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const number = Number(value.replace(/[^\d.,-]/g, '').replace(',', '.'));
    return Number.isFinite(number) ? number : undefined;
  }
  return undefined;
};

const textValue = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

const referenceList = (value: unknown): Array<{ id: number; name: string }> => {
  const record = asRecord(value);
  const items = asArray(record['Data'] ?? value);
  return items
    .map((item) => asRecord(item))
    .map((item) => ({
      id: numberValue(item['Id'] ?? item['id']) ?? 0,
      name: textValue(item['Name'] ?? item['name']),
    }))
    .filter((item) => item.id > 0 && item.name);
};

const findNumber = (value: unknown, keys: string[]): number | undefined => {
  const record = asRecord(value);
  for (const key of keys) {
    const found = numberValue(record[key]);
    if (found !== undefined) return found;
  }
  return undefined;
};

const findRequestId = (value: unknown): number => {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  const record = asRecord(value);
  const direct = findNumber(record, ['requestId', 'RequestId', 'id', 'Id']);
  if (direct !== undefined) return direct;
  for (const child of Object.values(record)) {
    const nested = findRequestId(child);
    if (nested > 0) return nested;
  }
  throw new BadRequestException('Слетать.ру не вернул requestId поискового запроса');
};

@Injectable()
export class SletatProvider {
  private readonly searches = new Map<number, { query: Record<string, unknown>; rows: unknown[]; startedAt: number; lastStatusAt: number }>();
  private readonly offers = new Map<number, { sourceId: unknown; requestId: number }>();

  constructor(private readonly client: SletatClient) {}

  async getDepartures() {
    return referenceList(await this.client.get('GetDepartCities'));
  }

  async getCountries(query: ReferenceQueryDto) {
    return referenceList(await this.client.get('GetCountries', { townFromId: query.departureId }));
  }

  async getRegions(query: ReferenceQueryDto) {
    return referenceList(await this.client.get('GetCities', { countryId: query.countryId }));
  }

  async getHotels(query: ReferenceQueryDto) {
    const result = await this.client.get('GetHotels', {
      countryId: query.countryId,
      towns: query.regionId,
      stars: query.category ? this.starId(query.category) : undefined,
      filter: query.name,
      all: query.limit || -1,
    });
    const records = asArray(asRecord(result)['Data'] ?? result).map(asRecord);
    return records
      .map((item) => ({
        id: numberValue(item['Id'] ?? item['id']) ?? 0,
        name: textValue(item['Name'] ?? item['name']),
        rating: numberValue(item['Rate'] ?? item['rate']),
        category: textValue(item['StarName'] ?? item['starName']),
      }))
      .filter((item) => item.id > 0 && item.name);
  }

  async getMeals() {
    return referenceList(await this.client.get('GetMeals'));
  }

  async getDates(query: ReferenceQueryDto) {
    const result = asRecord(await this.client.get('GetTourDates', {
      dptCityId: query.departureId,
      countryId: query.countryId,
      resorts: query.regionId,
    }));
    const dates = asArray(result['dates'] ?? result['Dates']);
    return dates.map(textValue).filter(Boolean);
  }

  async startSearch(search: TourSearchDto): Promise<{ searchId: number }> {
    const query: Record<string, unknown> = {
      cityFromId: search.departureId,
      countryId: search.countryId,
      s_adults: search.adults,
      s_kids: search.childs.length,
      s_kids_ages: search.childs,
      s_nightsMin: search.nightsFrom,
      s_nightsMax: search.nightsTo,
      s_departFrom: this.formatDate(search.dateFrom),
      s_departTo: this.formatDate(search.dateTo),
      currencyAlias: search.currency || 'RUB',
      cities: search.resort ? [Number(search.resort)] : undefined,
      stars: search.hotelStars ? this.starId(search.hotelStars) : undefined,
      meals: search.meal && /^\d+$/.test(search.meal) ? [Number(search.meal)] : undefined,
      hotels: search.hotelIds,
      s_ticketsIncluded: search.onlyCharter ? 'true' : undefined,
      includeDescriptions: 1,
      pageSize: 100,
      pageNumber: 1,
      updateResult: 0,
    };
    const response = await this.client.get('GetTours', query);
    const searchId = findRequestId(response);
    this.searches.set(searchId, { query, rows: [], startedAt: Date.now(), lastStatusAt: 0 });
    return { searchId };
  }

  async getStatus(searchId: number): Promise<SletatSearchStatus> {
    const session = this.searches.get(searchId);
    if (!session) throw new BadRequestException('Поисковая сессия Слетать.ру не найдена');
    const sinceLastStatus = Date.now() - session.lastStatusAt;
    if (sinceLastStatus < 1500) await sleep(1500 - sinceLastStatus);
    session.lastStatusAt = Date.now();

    const response = asArray(await this.client.get('GetLoadState', { requestId: searchId }));
    const states = response.map(asRecord);
    const processed = states.filter((state) => state['IsProcessed'] === true || state['isProcessed'] === true).length;
    const progress = states.length ? Math.round((processed / states.length) * 100) : 0;
    const complete = states.length > 0 && processed === states.length;
    const minPrice = states.reduce((min, state) => Math.min(min, numberValue(state['MinPrice'] ?? state['minPrice']) || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
    const timedOut = Date.now() - session.startedAt > 120000;
    return {
      searchId,
      status: complete || timedOut ? (timedOut && !complete ? 'timeout' : 'complete') : 'searching',
      progress: timedOut && !complete ? 100 : progress,
      minPrice: minPrice === Number.MAX_SAFE_INTEGER ? 0 : minPrice,
      operatorStatus: states,
    };
  }

  async getResults(searchId: number, limit: number) {
    const session = this.searches.get(searchId);
    if (!session) throw new BadRequestException('Поисковая сессия Слетать.ру не найдена');
    const result = await this.client.get('GetTours', {
      ...session.query,
      requestId: searchId,
      updateResult: 1,
      pageSize: Math.min(Math.max(limit, 1), 2500),
      pageNumber: 1,
    });
    const data = asRecord(result);
    const rows = asArray(data['aaData'] ?? data['AaData']);
    const normalized = rows.map((row) => this.normalizeRow(row, searchId));
    session.rows = normalized;
    return normalized;
  }

  async getTour(tourId: number, query: TourDetailsQueryDto) {
    const offer = this.offers.get(tourId);
    const actualized = await this.client.get('ActualizePrice', {
      sourceId: offer?.sourceId,
      offerId: tourId,
      requestId: offer?.requestId,
      currencyAlias: query.currency || 'RUB',
      detailed: 1,
    });
    return actualized;
  }

  async getFlights(tourId: number, query: TourDetailsQueryDto) {
    return this.getTour(tourId, query);
  }

  private normalizeRow(row: unknown, requestId: number) {
    const values = asArray(row);
    const offerId = numberValue(values[0]);
    if (offerId !== undefined) {
      this.offers.set(offerId, { sourceId: values[1], requestId });
    }

    return {
      id: values[0] ?? 0,
      tourid: values[0] ?? 0,
      tourId: values[0] ?? 0,
      hotelcode: numberValue(values[3]),
      name: textValue(values[7]),
      category: numberValue(values[45]) ?? this.parseStar(values[8]),
      stars: numberValue(values[45]) ?? this.parseStar(values[8]),
      rating: numberValue(values[35]) ?? 0,
      price: numberValue(values[42]) ?? numberValue(values[15]) ?? 0,
      currency: textValue(values[43]) || textValue(values[15]).match(/[A-Z]{3}/)?.[0] || 'RUB',
      picturelink: textValue(values[29]) || undefined,
      picture: textValue(values[29]) || undefined,
      images: textValue(values[29]) ? [textValue(values[29])] : [],
      country: { id: numberValue(values[30]), name: textValue(values[31]) },
      region: { id: numberValue(values[5]), name: textValue(values[19]) },
      meal: { name: textValue(values[10]) },
      roomType: textValue(values[9]) || textValue(values[53]),
      nights: numberValue(values[14]),
      date: textValue(values[12]),
      description: textValue(values[38]) || undefined,
      operator: { name: textValue(values[34]) || undefined },
      sletatOfferId: values[0],
      sletatSourceId: values[1],
      archiveHash: textValue(values[68]) || undefined,
    };
  }

  private starId(category: number): number[] {
    return [400, 401, 402, 403, 404][Math.max(1, Math.min(category, 5)) - 1] ? [400 + category - 1] : [category];
  }

  private parseStar(value: unknown): number | undefined {
    const match = textValue(value).match(/\d+/);
    return match ? Number(match[0]) : undefined;
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
}
