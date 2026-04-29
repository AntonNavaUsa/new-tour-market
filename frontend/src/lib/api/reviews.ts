import { api } from '../axios';

export interface Review {
  id: string;
  cardId: string | null;
  authorName: string;
  authorPhoto: string | null;
  title: string | null;
  text: string;
  rating: number;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  card?: { id: string; title: string } | null;
}

export const reviewsApi = {
  getForCard: (cardId: string): Promise<Review[]> =>
    api.get(`/api/reviews/card/${cardId}`).then((r) => r.data),

  // Admin
  findAll: (cardId?: string): Promise<Review[]> =>
    api.get('/api/reviews', { params: cardId ? { cardId } : undefined }).then((r) => r.data),

  findOne: (id: string): Promise<Review> =>
    api.get(`/api/reviews/${id}`).then((r) => r.data),

  create: (data: Partial<Review>): Promise<Review> =>
    api.post('/api/reviews', data).then((r) => r.data),

  update: (id: string, data: Partial<Review>): Promise<Review> =>
    api.patch(`/api/reviews/${id}`, data).then((r) => r.data),

  uploadPhoto: (id: string, file: File): Promise<Review> => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/reviews/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  remove: (id: string): Promise<void> =>
    api.delete(`/api/reviews/${id}`).then((r) => r.data),
};
