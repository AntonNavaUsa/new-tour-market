import { api } from '../axios';
import type {
  TourSearchForm,
  TourSearchReference,
  TourSearchStatus,
  TourSearchResult,
} from '../../types';

export const tourSearchApi = {
  getDepartures: async (): Promise<TourSearchReference[]> =>
    (await api.get<TourSearchReference[]>('/api/tour-search/departures', { params: { departureCountryId: 1 } })).data,

  getCountries: async (departureId: number): Promise<TourSearchReference[]> =>
    (await api.get<TourSearchReference[]>('/api/tour-search/countries', { params: { departureId } })).data,

  getDates: async (departureId: number, countryId: number): Promise<string[]> =>
    (await api.get<string[]>('/api/tour-search/dates', { params: { departureId, countryId } })).data,

  startSearch: async (form: TourSearchForm): Promise<{ searchId: number }> =>
    (await api.post<{ searchId: number }>('/api/tour-search/search', form)).data,

  getStatus: async (searchId: number): Promise<TourSearchStatus> =>
    (await api.get<TourSearchStatus>(`/api/tour-search/search/${searchId}/status`)).data,

  getResults: async (searchId: number, limit = 100): Promise<TourSearchResult[]> =>
    (await api.get<TourSearchResult[]>(`/api/tour-search/search/${searchId}/results`, { params: { limit } })).data,
};
