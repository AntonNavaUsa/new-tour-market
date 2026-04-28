import api from '../axios';
import type { Guide } from '../../types';

export const guidesApi = {
  getMyGuides: async (): Promise<Guide[]> => {
    const response = await api.get<Guide[]>('/api/guides/my');
    return response.data;
  },

  createGuide: async (data: { name: string; description?: string; position?: number }): Promise<Guide> => {
    const response = await api.post<Guide>('/api/guides', data);
    return response.data;
  },

  updateGuide: async (id: string, data: { name?: string; description?: string; position?: number }): Promise<Guide> => {
    const response = await api.patch<Guide>(`/api/guides/${id}`, data);
    return response.data;
  },

  uploadPhoto: async (id: string, file: File): Promise<Guide> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<Guide>(`/api/guides/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteGuide: async (id: string): Promise<void> => {
    await api.delete(`/api/guides/${id}`);
  },
};
