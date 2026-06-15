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

export interface FaqTemplate {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
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

export const faqTemplatesApi = {
  findAll: (): Promise<FaqTemplate[]> =>
    api.get('/api/faq-templates').then((r) => r.data),

  create: (data: { question: string; answer: string; sortOrder?: number }): Promise<FaqTemplate> =>
    api.post('/api/faq-templates', data).then((r) => r.data),

  update: (id: string, data: { question?: string; answer?: string; sortOrder?: number }): Promise<FaqTemplate> =>
    api.patch(`/api/faq-templates/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/api/faq-templates/${id}`).then((r) => r.data),
};

export interface BookingStepsTemplate {
  id: string;
  name: string;
  steps: Array<{ title: string; description: string }>;
  createdAt: string;
  updatedAt: string;
}

export const bookingStepsTemplatesApi = {
  findAll: (): Promise<BookingStepsTemplate[]> =>
    api.get('/api/booking-steps-templates').then((r) => r.data),

  create: (data: { name: string; steps: Array<{ title: string; description: string }> }): Promise<BookingStepsTemplate> =>
    api.post('/api/booking-steps-templates', data).then((r) => r.data),

  update: (id: string, data: { name?: string; steps?: Array<{ title: string; description: string }> }): Promise<BookingStepsTemplate> =>
    api.patch(`/api/booking-steps-templates/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/api/booking-steps-templates/${id}`).then((r) => r.data),
};
