import api from '../axios';
import type { Location, CardType, TariffType, AdminUserOption } from '../../types';

export const metaApi = {
  getLocations: async (): Promise<Location[]> => {
    const response = await api.get<Location[]>('/api/meta/locations');
    return response.data;
  },

  createLocation: async (data: { country: string; city: string; region?: string; urlSlug: string; language?: string }): Promise<Location> => {
    const response = await api.post<Location>('/api/admin/locations', data);
    return response.data;
  },

  updateLocation: async (id: string, data: Partial<{ country: string; city: string; region: string; urlSlug: string; language: string }>): Promise<Location> => {
    const response = await api.patch<Location>(`/api/admin/locations/${id}`, data);
    return response.data;
  },

  deleteLocation: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/locations/${id}`);
  },

  getCardTypes: async (): Promise<CardType[]> => {
    const response = await api.get<CardType[]>('/api/meta/card-types');
    return response.data;
  },

  createCardType: async (data: { name: string; slug: string; icon?: string | null; sortOrder?: number }): Promise<CardType> => {
    const response = await api.post<CardType>('/api/admin/card-types', data);
    return response.data;
  },

  updateCardType: async (id: string, data: Partial<{ name: string; slug: string; icon: string | null; sortOrder: number }>): Promise<CardType> => {
    const response = await api.patch<CardType>(`/api/admin/card-types/${id}`, data);
    return response.data;
  },

  deleteCardType: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/card-types/${id}`);
  },

  getAdminUsers: async (): Promise<AdminUserOption[]> => {
    const response = await api.get<AdminUserOption[]>('/api/admin/users');
    return response.data;
  },

  getTariffTypes: async (): Promise<TariffType[]> => {
    const response = await api.get<TariffType[]>('/api/meta/tariff-types');
    return response.data;
  },

  createTariffType: async (data: { name: string; description?: string; ageFrom?: number; ageTo?: number; sortOrder?: number }): Promise<TariffType> => {
    const response = await api.post<TariffType>('/api/admin/tariff-types', data);
    return response.data;
  },

  updateTariffType: async (id: string, data: Partial<{ name: string; description: string; ageFrom: number; ageTo: number; sortOrder: number }>): Promise<TariffType> => {
    const response = await api.patch<TariffType>(`/api/admin/tariff-types/${id}`, data);
    return response.data;
  },

  deleteTariffType: async (id: string): Promise<void> => {
    await api.delete(`/api/admin/tariff-types/${id}`);
  },

  getSiteSettings: async (): Promise<Record<string, string>> => {
    const response = await api.get<Record<string, string>>('/api/meta/site-settings');
    return response.data;
  },

  uploadHeroCover: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ url: string }>('/api/admin/settings/hero-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};