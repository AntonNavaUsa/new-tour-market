import { api } from '../axios';
import { PricingType } from '../../types';

export interface CardExtra {
  id: string;
  cardId: string;
  title: string;
  description: string | null;
  price: string; // Decimal comes as string from backend
  pricingType: PricingType;
  isOptional: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const extrasApi = {
  // Public — only active
  getForCard: (cardId: string): Promise<CardExtra[]> =>
    api.get(`/api/extras/card/${cardId}`).then((r) => r.data),

  // Admin — all incl. inactive
  getForCardAdmin: (cardId: string): Promise<CardExtra[]> =>
    api.get(`/api/extras/card/${cardId}/admin`).then((r) => r.data),

  create: (data: {
    cardId: string;
    title: string;
    description?: string;
    price: number;
    pricingType?: PricingType;
    isOptional?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<CardExtra> =>
    api.post('/api/extras', data).then((r) => r.data),

  update: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      price: number;
      pricingType: PricingType;
      isOptional: boolean;
      isActive: boolean;
      sortOrder: number;
    }>,
  ): Promise<CardExtra> =>
    api.patch(`/api/extras/${id}`, data).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/api/extras/${id}`).then((r) => r.data),

  reorder: (cardId: string, ids: string[]): Promise<CardExtra[]> =>
    api.post(`/api/extras/card/${cardId}/reorder`, { ids }).then((r) => r.data),
};
