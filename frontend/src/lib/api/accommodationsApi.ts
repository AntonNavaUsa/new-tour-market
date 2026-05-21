import { api } from '../axios';
import type {
  Accommodation,
  AccommodationPhoto,
  AccommodationBlock,
  Review,
  AvailableDatesResponse,
} from '../../types';

export interface AccommodationFilter {
  search?: string;
  type?: string;
  skip?: number;
  take?: number;
}

export interface PaginatedAccommodations {
  data: (Accommodation & { _count: { reviews: number } })[];
  meta: { total: number; skip: number; take: number; hasMore: boolean };
}

export const accommodationsApi = {
  getAll: (filters?: AccommodationFilter) =>
    api.get<PaginatedAccommodations>('/api/accommodations', { params: filters }).then((r) => r.data),

  getOne: (id: string) =>
    api.get<Accommodation>(`/api/accommodations/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; address?: string; type?: string }) =>
    api.post<Accommodation>('/api/accommodations', data).then((r) => r.data),

  update: (id: string, data: { name?: string; description?: string; address?: string; type?: string }) =>
    api.patch<Accommodation>(`/api/accommodations/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/accommodations/${id}`).then((r) => r.data),

  // Photos
  uploadPhotos: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api
      .post<AccommodationPhoto[]>(`/api/accommodations/${id}/photos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  reorderPhotos: (id: string, photos: { id: string; sortOrder: number }[]) =>
    api.patch<AccommodationPhoto[]>(`/api/accommodations/${id}/photos/reorder`, { photos }).then((r) => r.data),

  deletePhoto: (photoId: string) =>
    api.delete(`/api/accommodations/photos/${photoId}`).then((r) => r.data),

  replacePhoto: (photoId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .put<AccommodationPhoto>(`/api/accommodations/photos/${photoId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  // Reviews
  getReviews: (id: string) =>
    api.get<Review[]>(`/api/reviews/accommodation/${id}`).then((r) => r.data),

  // Calendar
  getCalendar: (id: string, year: number, month: number) =>
    api
      .get<{ blocks: AccommodationBlock[]; orders: { date: string; id: string }[] }>(
        `/api/accommodations/${id}/calendar`,
        { params: { year, month } },
      )
      .then((r) => r.data),

  createBlock: (id: string, data: { dateFrom: string; dateTo: string; reason?: string }) =>
    api.post<AccommodationBlock>(`/api/accommodations/${id}/blocks`, data).then((r) => r.data),

  deleteBlock: (id: string, blockId: string) =>
    api.delete(`/api/accommodations/${id}/blocks/${blockId}`).then((r) => r.data),
};

export const schedulesApi = {
  getAvailableDates: (cardId: string, year: number, month: number) =>
    api
      .get<AvailableDatesResponse>(`/api/schedules/cards/${cardId}/available-dates/${year}/${month}`)
      .then((r) => r.data),
};
