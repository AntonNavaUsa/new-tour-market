import { api } from '../axios';
import type {
  TourSearchForm,
  TourSearchReference,
  TourSearchStatus,
  TourSearchResult,
} from '../../types';

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const num = Number(value.replace(/[^\d.,-]/g, '').replace(',', '.'));
    return Number.isFinite(num) ? num : undefined;
  }
  return undefined;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === 'string') return [item];
        if (item && typeof item === 'object') {
          const entries = Object.values(item as Record<string, unknown>);
          return entries.filter((entry): entry is string => typeof entry === 'string');
        }
        return [];
      })
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[;,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const firstNestedValue = (source: unknown, keys: string[]): unknown => {
  const seen = new Set<unknown>();

  const walk = (value: unknown): unknown => {
    if (!value || typeof value !== 'object' || seen.has(value)) return undefined;
    seen.add(value);

    const record = value as Record<string, unknown>;
    for (const [key, entry] of Object.entries(record)) {
      if (keys.some((wanted) => wanted.toLowerCase() === key.toLowerCase()) && entry !== null && entry !== undefined && entry !== '') {
        return entry;
      }
    }

    for (const entry of Object.values(record)) {
      const found = walk(entry);
      if (found !== undefined) return found;
    }

    return undefined;
  };

  return walk(source);
};

export const normalizeTourSearchResult = (raw: unknown): TourSearchResult => {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const hotel = (source['hotel'] && typeof source['hotel'] === 'object' ? source['hotel'] as Record<string, unknown> : {}) as Record<string, unknown>;
  const country = (source['country'] && typeof source['country'] === 'object' ? source['country'] as Record<string, unknown> : {}) as Record<string, unknown>;
  const region = (source['region'] && typeof source['region'] === 'object' ? source['region'] as Record<string, unknown> : {}) as Record<string, unknown>;
  const meal = (source['meal'] && typeof source['meal'] === 'object' ? source['meal'] as Record<string, unknown> : {}) as Record<string, unknown>;
  const room = (source['room'] && typeof source['room'] === 'object' ? source['room'] as Record<string, unknown> : {}) as Record<string, unknown>;

  const readString = (record: Record<string, unknown>, key: string): string => {
    const value = record[key];
    return typeof value === 'string' ? value.trim() : '';
  };

  const maybePrice =
    toNumber(source['price']) ??
    toNumber(source['amount']) ??
    toNumber(source['totalPrice']) ??
    toNumber(source['cost']) ??
    toNumber(hotel['price']) ??
    toNumber(firstNestedValue(source, ['price', 'amount', 'totalPrice', 'cost'])) ??
    0;

  const maybeName =
    readString(source, 'name') ||
    readString(hotel, 'name') ||
    readString(source, 'hotelName') ||
    'Отель';

  const maybePicture =
    readString(source, 'picturelink') ||
    readString(source, 'picture') ||
    readString(source, 'image') ||
    readString(hotel, 'picturelink') ||
    readString(hotel, 'picture') ||
    (Array.isArray(source['photos']) ? toStringArray(source['photos'])[0] : undefined) ||
    (Array.isArray(source['images']) ? toStringArray(source['images'])[0] : undefined) ||
    (Array.isArray(hotel['photos']) ? toStringArray(hotel['photos'])[0] : undefined) ||
    (Array.isArray(hotel['images']) ? toStringArray(hotel['images'])[0] : undefined) ||
    undefined;

  const maybeCountryName =
    readString(country, 'name') ||
    readString(source, 'countryName') ||
    readString(hotel, 'countryName') ||
    '';

  const maybeRegionName =
    readString(region, 'name') ||
    readString(source, 'regionName') ||
    readString(hotel, 'regionName') ||
    '';

  const roomType =
    readString(source, 'roomType') ||
    readString(source, 'roomName') ||
    readString(room, 'name') ||
    readString(source, 'category') ||
    '';

  const mealName =
    readString(meal, 'name') ||
    readString(source, 'mealName') ||
    readString(source, 'board') ||
    '';

  const hotelDescription = readString(hotel, 'description');
  const hotelImages = Array.isArray(hotel['images']) ? toStringArray(hotel['images']) : [];
  const hotelPhotos = Array.isArray(hotel['photos']) ? toStringArray(hotel['photos']) : [];
  const operatorValue = source['operator'];
  const operatorRecord = operatorValue && typeof operatorValue === 'object' ? (operatorValue as Record<string, unknown>) : undefined;

  return {
    id: (source['id'] ?? source['tourid'] ?? source['tourId'] ?? source['hotelcode'] ?? hotel['id'] ?? 0) as string | number,
    name: maybeName,
    category: toNumber(source['category']) ?? toNumber(source['stars']) ?? 4,
    stars: toNumber(source['stars']) ?? toNumber(source['category']) ?? 4,
    rating: toNumber(source['rating']) ?? 4.5,
    reviewsCount: toNumber(source['reviewsCount']),
    price: maybePrice,
    priceOld: toNumber(source['priceOld']) ?? toNumber(source['oldPrice']) ?? undefined,
    currency: typeof source['currency'] === 'string' && source['currency'] ? source['currency'] : 'RUB',
    picturelink: maybePicture,
    picture: maybePicture,
    images: Array.isArray(source['images']) ? toStringArray(source['images']) : Array.isArray(source['photos']) ? toStringArray(source['photos']) : [],
    photos: Array.isArray(source['photos']) ? toStringArray(source['photos']) : Array.isArray(source['images']) ? toStringArray(source['images']) : [],
    description: typeof source['description'] === 'string' ? source['description'] : hotelDescription,
    country: maybeCountryName ? { name: maybeCountryName } : { name: '' },
    region: maybeRegionName ? { name: maybeRegionName } : { name: '' },
    hotel: {
      description: hotelDescription || undefined,
      images: hotelImages,
      photos: hotelPhotos,
    },
    hotelcode: toNumber(source['hotelcode']) ?? toNumber(hotel['id']),
    tourid: source['tourid'] ?? source['tourId'] ?? source['id'],
    tourId: source['tourId'] ?? source['tourid'] ?? source['id'],
    operator: operatorRecord ? { name: typeof operatorRecord['name'] === 'string' ? operatorRecord['name'] : undefined } : undefined,
    meal: mealName ? { name: mealName } : undefined,
    roomType,
    nights: toNumber(source['nights']),
    date: typeof source['date'] === 'string' ? source['date'] : undefined,
  };
};

export const normalizeTourSearchResults = (payload: unknown): TourSearchResult[] => {
  if (Array.isArray(payload)) return payload.map((item) => normalizeTourSearchResult(item));

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [record['items'], record['results'], record['data'], record['offers'], record['tours']];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate.map((item) => normalizeTourSearchResult(item));
    }
  }

  return [];
};

export const tourSearchApi = {
  getDepartures: async (): Promise<TourSearchReference[]> =>
    (await api.get<TourSearchReference[]>('/api/tour-search/departures', { params: { departureCountryId: 1 } })).data,

  getCountries: async (departureId: number): Promise<TourSearchReference[]> =>
    (await api.get<TourSearchReference[]>('/api/tour-search/countries', { params: { departureId } })).data,

  getDates: async (departureId: number, countryId: number): Promise<string[]> =>
    (await api.get<string[]>('/api/tour-search/dates', { params: { departureId, countryId } })).data,

  getMeals: async (): Promise<TourSearchReference[]> =>
    (await api.get<TourSearchReference[]>('/api/tour-search/meals')).data,

  getRegions: async (countryId: number): Promise<TourSearchReference[]> =>
    (await api.get<TourSearchReference[]>('/api/tour-search/regions', { params: { countryId } })).data,

  getHotels: async (countryId: number, params: { regionId?: number; category?: number; name?: string; limit?: number }): Promise<TourSearchReference[]> =>
    (await api.get<TourSearchReference[]>('/api/tour-search/hotels', { params: { countryId, ...params } })).data,

  getRooms: async (ids: number[]): Promise<Record<string, unknown>[]> =>
    (await api.get<Record<string, unknown>[]>('/api/tour-search/rooms', { params: { ids: ids.join(',') } })).data,

  startSearch: async (form: TourSearchForm): Promise<{ searchId: number }> =>
    (await api.post<{ searchId: number }>('/api/tour-search/search', form)).data,

  getStatus: async (searchId: number): Promise<TourSearchStatus> =>
    (await api.get<TourSearchStatus>(`/api/tour-search/search/${searchId}/status`)).data,

  getResults: async (searchId: number, limit = 100): Promise<TourSearchResult[]> => {
    const { data } = await api.get<unknown>(`/api/tour-search/search/${searchId}/results`, { params: { limit } });
    return normalizeTourSearchResults(data);
  },

  getTour: async (tourId: number, currency = 'RUB'): Promise<Record<string, unknown>> =>
    (await api.get<Record<string, unknown>>(`/api/tour-search/tours/${tourId}`, { params: { currency } })).data,
};
