import api from '../axios';
import type { Ticket, Price, PricingType } from '../../types';

export interface CreateTicketPayload {
  title: string;
  description?: string;
  isMain?: boolean;
  position?: number;
  pricingType?: PricingType;
  tariffTypeId?: string;
  typeConfig?: any;
}

export interface CreatePricePayload {
  dateFrom: string;
  dateTo: string;
  adultPrice: number;
  childPrice?: number;
  minPrice?: number;
  availableSlots?: number;
}

export const ticketsApi = {
  getCardTickets: async (cardId: string): Promise<Ticket[]> => {
    const response = await api.get<Ticket[]>(`/api/tickets/cards/${cardId}/tickets`);
    return response.data;
  },

  createTicket: async (cardId: string, data: CreateTicketPayload): Promise<Ticket> => {
    const response = await api.post<Ticket>(`/api/tickets/cards/${cardId}/tickets`, data);
    return response.data;
  },

  updateTicket: async (ticketId: string, data: Partial<CreateTicketPayload>): Promise<Ticket> => {
    const response = await api.patch<Ticket>(`/api/tickets/${ticketId}`, data);
    return response.data;
  },

  deleteTicket: async (ticketId: string): Promise<void> => {
    await api.delete(`/api/tickets/${ticketId}`);
  },

  getPrices: async (ticketId: string): Promise<Price[]> => {
    const response = await api.get<Price[]>(`/api/tickets/${ticketId}/prices`);
    return response.data;
  },

  createPrice: async (ticketId: string, data: CreatePricePayload): Promise<Price> => {
    const response = await api.post<Price>(`/api/tickets/${ticketId}/prices`, data);
    return response.data;
  },

  updatePrice: async (priceId: string, data: CreatePricePayload): Promise<Price> => {
    const response = await api.patch<Price>(`/api/tickets/prices/${priceId}`, data);
    return response.data;
  },

  deletePrice: async (priceId: string): Promise<void> => {
    await api.delete(`/api/tickets/prices/${priceId}`);
  },
};
