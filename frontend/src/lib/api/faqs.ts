import { api } from '../axios';

export interface Faq {
  id: string;
  cardId: string;
  question: string;
  answer: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  card?: { id: string; title: string };
}

export const faqsApi = {
  getForCard: (cardId: string): Promise<Faq[]> =>
    api.get(`/api/faqs/card/${cardId}`).then((r) => r.data),

  // Admin
  findAll: (cardId?: string): Promise<Faq[]> =>
    api.get('/api/faqs', { params: cardId ? { cardId } : undefined }).then((r) => r.data),

  findOne: (id: string): Promise<Faq> =>
    api.get(`/api/faqs/${id}`).then((r) => r.data),

  create: (data: Omit<Faq, 'id' | 'createdAt' | 'updatedAt' | 'card'>): Promise<Faq> =>
    api.post('/api/faqs', data).then((r) => r.data),

  update: (id: string, data: Partial<Omit<Faq, 'id' | 'cardId' | 'createdAt' | 'updatedAt' | 'card'>>): Promise<Faq> =>
    api.patch(`/api/faqs/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/api/faqs/${id}`).then((r) => r.data),

  reorder: (cardId: string, ids: string[]): Promise<Faq[]> =>
    api.post(`/api/faqs/card/${cardId}/reorder`, { ids }).then((r) => r.data),
};
