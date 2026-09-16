import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { useEffect, useState } from 'react';
import { tourSearchApi } from './api';
import type { TourSearchForm } from '../types';

export type SearchPopover = 'departure' | 'country' | 'dates' | 'nights' | 'guests';

const SEARCH_FORM_STORAGE_KEY = 'travelio-tour-search-form';

export function createInitialTourSearchForm(): TourSearchForm {
  return {
    searchMode: 'tours',
    departureId: null,
    countryId: null,
    dateFrom: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
    dateTo: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    nightsFrom: 7,
    nightsTo: 10,
    adults: 2,
    childs: [],
    currency: 'RUB',
    onlyCharter: false,
    onlyDirect: false,
    hotelStars: null,
    resort: '',
    hotelName: '',
    hotelIds: [],
    meal: '',
  };
}

function readSavedForm(): TourSearchForm | undefined {
  try {
    const saved = localStorage.getItem(SEARCH_FORM_STORAGE_KEY);
    if (!saved) return undefined;

    const parsed = JSON.parse(saved) as Partial<TourSearchForm>;
    if (!Array.isArray(parsed.childs)) return undefined;

    return {
      ...createInitialTourSearchForm(),
      ...parsed,
      childs: parsed.childs,
      meal: typeof parsed.meal === 'string' && parsed.meal ? parsed.meal : '',
      searchMode: parsed.searchMode === 'hotels' ? 'hotels' : 'tours',
    } as TourSearchForm;
  } catch {
    return undefined;
  }
}

function normalizeForm(form: TourSearchForm): TourSearchForm {
  return {
    ...createInitialTourSearchForm(),
    ...form,
    meal: form.meal || '',
    searchMode: form.searchMode === 'hotels' ? 'hotels' : 'tours',
  };
}

export function useTourSearchForm(initialForm?: TourSearchForm) {
  const [form, setForm] = useState<TourSearchForm>(() => normalizeForm(initialForm ?? readSavedForm() ?? createInitialTourSearchForm()));
  const [invalidField, setInvalidField] = useState<SearchPopover | undefined>();
  const [validationNonce, setValidationNonce] = useState(0);
  const [hotelSearch, setHotelSearch] = useState('');
  const [debouncedHotelSearch, setDebouncedHotelSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHotelSearch(hotelSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [hotelSearch]);

  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_FORM_STORAGE_KEY, JSON.stringify(form));
    } catch {
      // localStorage can be unavailable in private browsing or restricted contexts.
    }
  }, [form]);

  const departuresQuery = useQuery({
    queryKey: ['tour-search', 'departures'],
    queryFn: tourSearchApi.getDepartures,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const countriesQuery = useQuery({
    queryKey: ['tour-search', 'countries', form.departureId],
    queryFn: () => tourSearchApi.getCountries(form.departureId!),
    enabled: form.departureId !== null,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const datesQuery = useQuery({
    queryKey: ['tour-search', 'dates', form.departureId, form.countryId],
    queryFn: () => tourSearchApi.getDates(form.departureId!, form.countryId!),
    enabled: form.departureId !== null && form.countryId !== null,
  });
  const mealsQuery = useQuery({
    queryKey: ['tour-search', 'meals'],
    queryFn: tourSearchApi.getMeals,
  });
  const regionsQuery = useQuery({
    queryKey: ['tour-search', 'regions', form.countryId],
    queryFn: () => tourSearchApi.getRegions(form.countryId!),
    enabled: form.countryId !== null,
  });
  const hotelsQuery = useQuery({
    queryKey: ['tour-search', 'hotels', form.countryId, form.resort, form.hotelStars, debouncedHotelSearch],
    queryFn: () => tourSearchApi.getHotels(form.countryId!, {
      regionId: form.resort ? Number(form.resort) : undefined,
      category: form.hotelStars ?? undefined,
      name: debouncedHotelSearch,
        limit: 20,
    }),
    enabled: form.countryId !== null && debouncedHotelSearch.length >= 3,
  });

  const updateForm = <K extends keyof TourSearchForm>(key: K, value: TourSearchForm[K]) => {
    setInvalidField(undefined);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const changeDeparture = (departureId: number | null) => {
    setInvalidField(undefined);
    setForm({ ...normalizeForm(initialForm ?? createInitialTourSearchForm()), departureId });
  };

  const validate = (): boolean => {
    let nextInvalidField: SearchPopover | undefined;
    if (!form.departureId) nextInvalidField = 'departure';
    else if (!form.countryId) nextInvalidField = 'country';
    else if (!form.dateFrom || !form.dateTo) nextInvalidField = 'dates';
    else if (form.nightsFrom < 1 || form.nightsTo < form.nightsFrom || form.nightsTo - form.nightsFrom > 10) nextInvalidField = 'nights';
    else if (form.adults < 1) nextInvalidField = 'guests';

    setInvalidField(nextInvalidField);
    if (nextInvalidField) setValidationNonce((current) => current + 1);
    return !nextInvalidField;
  };

  return {
    form,
    departures: departuresQuery.data,
    countries: countriesQuery.data,
    availableDates: datesQuery.data,
    meals: mealsQuery.data,
    regions: regionsQuery.data,
    hotels: hotelsQuery.data,
    isHotelsLoading: hotelsQuery.isLoading,
    hotelSearch,
    setHotelSearch,
    isDeparturesLoading: departuresQuery.isLoading,
    isCountriesLoading: countriesQuery.isLoading,
    invalidField,
    validationNonce,
    updateForm,
    changeDeparture,
    validate,
  };
}
