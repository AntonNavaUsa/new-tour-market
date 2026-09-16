import { BadRequestException, Injectable } from '@nestjs/common';
import { ReferenceQueryDto, TourDetailsQueryDto, TourSearchDto } from './dto/tour-search.dto';
import { SletatClient } from './sletat.client';
import { MEAL_CATALOG, MEAL_GROUP_DESCRIPTIONS, MEAL_GROUP_NAMES, type MealGroup, type MealGroupId } from './meal-catalog';

export type SletatSearchStatus = {
  searchId: number;
  status: string;
  progress: number;
  minPrice: number;
  operatorStatus: unknown[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Sletat can mark every operator "processed" within 1-2s when serving a stale/empty cached
// requestId, well before the real crawl has populated results. Do not trust "complete" earlier
// than this, or the app randomly reports zero/few offers instead of waiting for real data.
const MIN_SEARCH_AGE_MS = 6000;

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

const canonicalMealLabels = {
  any: 'Любое',
  allInclusive: 'Всё включено',
  ultraAllInclusive: 'Ультра всё включено',
  threeMeals: '3-разовое',
  twoMeals: '2-разовое',
  breakfast: 'Завтраки',
} as const;

const mealCatalogByCode = new Map(MEAL_CATALOG.map((item) => [item.code.toLowerCase(), item]));
const mealGroupIds = new Set<string>(MEAL_CATALOG.map((item) => item.group));

// The search form sends the group id (e.g. "breakfast"), not a meal code — match it directly.
const mealGroupId = (input: string): MealGroupId | undefined => {
  const value = input.trim().toLowerCase();
  return mealGroupIds.has(value) ? (value as MealGroupId) : undefined;
};

const mealGroup = (group: MealGroupId, sourceIds: number[]): MealGroup => ({
  id: group,
  name: MEAL_GROUP_NAMES[group],
  description: MEAL_GROUP_DESCRIPTIONS[group],
  codes: MEAL_CATALOG.filter((item) => item.group === group).map((item) => item.code),
  sourceIds,
});

export const normalizeMealName = (input: string): string => {
  const value = textValue(input).toLowerCase();
  if (!value) return canonicalMealLabels.any;
  const catalogItem = mealCatalogByCode.get(value);
  if (catalogItem) return MEAL_GROUP_NAMES[catalogItem.group];

  const variants = {
    allInclusive: ['ai', 'all inclusive', 'all-inclusive', 'allinclusive', 'all inclusive (ai)', 'inclusive'],
    ultraAllInclusive: ['uai', 'usai', 'ultra all inclusive', 'ultra-all-inclusive', 'ultraallinclusive', 'ultra all inclusive (uai)', 'ultra all inclusive (usai)', 'ultra all inclusive (ai)'],
    threeMeals: ['fb', 'full board', 'full-board', 'fullboard', '3-разовое', '3 разовое', '3 meals', '3 meal', '3 x meals', '3x meals', '3-разовое питание', 'fullboard', 'full board (fb)'],
    twoMeals: ['hb', 'half board', 'half-board', 'halfboard', '2-разовое', '2 разовое', '2 meals', '2 meal', '2-разовое питание', 'half board (hb)'],
    breakfast: ['bb', 'breakfast', 'breakfasts', 'breakfast included', 'ro', 'room only', 'room only (ro)', 'с завтраками', 'завтраки', 'breakfast only', 'breakfast and dining', 'breakfast (bb)'],
  } as const;

  if ((variants.allInclusive as readonly string[]).includes(value)) return canonicalMealLabels.allInclusive;
  if ((variants.ultraAllInclusive as readonly string[]).includes(value)) return canonicalMealLabels.ultraAllInclusive;
  if ((variants.threeMeals as readonly string[]).includes(value)) return canonicalMealLabels.threeMeals;
  if ((variants.twoMeals as readonly string[]).includes(value)) return canonicalMealLabels.twoMeals;
  if ((variants.breakfast as readonly string[]).includes(value)) return canonicalMealLabels.breakfast;

  if (value.includes('all inclusive')) return canonicalMealLabels.allInclusive;
  if (value.includes('ultra all inclusive') || value.includes('ultra-all-inclusive') || value.includes('uai') || value.includes('usai')) return canonicalMealLabels.ultraAllInclusive;
  if (value.includes('full board') || value.includes('fullboard') || value.includes('fb')) return canonicalMealLabels.threeMeals;
  if (value.includes('half board') || value.includes('halfboard') || value.includes('hb')) return canonicalMealLabels.twoMeals;
  if (value.includes('breakfast') || value.includes('завтрак') || value.includes('ro')) return canonicalMealLabels.breakfast;

  return canonicalMealLabels.any;
};

const normalizeMealReference = (value: unknown): { id: number; name: string } => {
  const raw = asRecord(value);
  const id = numberValue(raw['Id'] ?? raw['id']) ?? 0;
  const name = textValue(raw['Name'] ?? raw['name']);
  return {
    id,
    name: id > 0 && name ? normalizeMealName(name) : '',
  };
};

const currentMealIds = new Map<string, number>();

const mealIdsForSelection = (selection: string): number[] | undefined => {
  const groups = selection.split(',').map((value) => value.trim()).map(mealGroupId).filter((value): value is MealGroupId => Boolean(value));
  if (groups.length === 0) return undefined;
  return Array.from(new Set(groups.flatMap((group) => {
    const itemIds = MEAL_CATALOG
      .filter((item) => item.group === group)
      .map((item) => item.code.toLowerCase())
      .map((code) => currentMealIds.get(code))
      .filter((id): id is number => typeof id === 'number');
    return itemIds;
  })));
};

const normalizeMealDisplay = (value: string): string => {
  const normalized = normalizeMealName(value);
  return normalized === canonicalMealLabels.any ? '' : normalized;
};

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
  private mealsCache?: { expiresAt: number; value: MealGroup[] };
  private departuresCache?: { expiresAt: number; value: Array<{ id: number; name: string }> };
  private readonly countriesCache = new Map<number, { expiresAt: number; value: Array<{ id: number; name: string }> }>();

  constructor(private readonly client: SletatClient) {}

  async getDepartures() {
    if (this.departuresCache && this.departuresCache.expiresAt > Date.now()) return this.departuresCache.value;
    const value = referenceList(await this.client.get('GetDepartCities'));
    this.departuresCache = { expiresAt: Date.now() + 24 * 60 * 60 * 1000, value };
    return value;
  }

  async getCountries(query: ReferenceQueryDto) {
    const departureId = query.departureId!;
    const cached = this.countriesCache.get(departureId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const value = referenceList(await this.client.get('GetCountries', { townFromId: departureId }));
    this.countriesCache.set(departureId, { expiresAt: Date.now() + 24 * 60 * 60 * 1000, value });
    return value;
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
    if (this.mealsCache && this.mealsCache.expiresAt > Date.now()) return this.mealsCache.value;
    const result = await this.client.get('GetMeals');
    const meals = asArray(asRecord(result)['Data'] ?? result);
    currentMealIds.clear();
    for (const meal of meals) {
      const raw = asRecord(meal);
      const id = numberValue(raw['Id'] ?? raw['id']);
      const code = textValue(raw['Name'] ?? raw['name']);
      if (id && code) currentMealIds.set(code.toLowerCase(), id);
    }

    const value = Array.from(new Set(MEAL_CATALOG.map((item) => item.group)))
      .map((group) => mealGroup(group, MEAL_CATALOG
        .filter((item) => item.group === group)
        .map((item) => currentMealIds.get(item.code.toLowerCase()))
        .filter((id): id is number => typeof id === 'number')))
      .filter((group) => group.sourceIds.length > 0);
    this.mealsCache = { expiresAt: Date.now() + 10 * 60 * 1000, value };
    return value;
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
    // The meal group -> Sletat id mapping is only populated by getMeals(); ensure it ran at least
    // once so a meal filter is never silently dropped to an empty id list on a fresh backend process.
    if (search.meal && currentMealIds.size === 0) {
      await this.getMeals();
    }
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
      meals: search.meal ? mealIdsForSelection(search.meal) : undefined,
      hotels: search.hotelIds,
      // Default (tours) omits the flag, matching Sletat's normal fast search; "hotels" mode
      // explicitly excludes flights. Forcing 'true' for tours made every search much slower.
      s_ticketsIncluded: search.searchMode === 'hotels' ? 'false' : undefined,
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
    const elapsed = Date.now() - session.startedAt;
    // Sletat can report every operator as already processed within the first couple of seconds
    // when it serves a stale/empty cached search, before the real crawl has actually populated
    // results for that requestId. A minimum age guards against reading that premature snapshot
    // as the final answer, which caused searches to randomly return few or zero offers.
    const allProcessed = states.length > 0 && processed === states.length;
    const complete = allProcessed && elapsed >= MIN_SEARCH_AGE_MS;
    const minPrice = states.reduce((min, state) => Math.min(min, numberValue(state['MinPrice'] ?? state['minPrice']) || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
    const timedOut = elapsed > 120000;
    return {
      searchId,
      status: complete || timedOut ? (timedOut && !complete ? 'timeout' : 'complete') : 'searching',
      progress: timedOut && !complete ? 100 : Math.min(progress, allProcessed && !complete ? 99 : 100),
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
      sourceId: query.sourceId ?? offer?.sourceId,
      offerId: tourId,
      requestId: query.requestId ? Number(query.requestId) : offer?.requestId,
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
      rating: numberValue(values[89]) ?? numberValue(values[35]) ?? 0,
      reviewsCount: numberValue(values[90]) ?? 0,
      price: numberValue(values[42]) ?? numberValue(values[15]) ?? 0,
      currency: textValue(values[43]) || textValue(values[15]).match(/[A-Z]{3}/)?.[0] || 'RUB',
      picturelink: textValue(values[29]) || undefined,
      picture: textValue(values[29]) || undefined,
      images: textValue(values[29]) ? [textValue(values[29])] : [],
      country: { id: numberValue(values[30]), name: textValue(values[31]) },
      region: { id: numberValue(values[5]), name: textValue(values[19]) },
      meal: { name: normalizeMealDisplay(textValue(values[10])) },
      roomType: textValue(values[9]) || textValue(values[53]),
      nights: numberValue(values[14]),
      date: textValue(values[12]),
      description: textValue(values[38]) || undefined,
      operator: { name: textValue(values[34]) || undefined },
      sletatOfferId: values[0],
      sletatSourceId: values[1],
      sletatRequestId: requestId,
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
