import api from '../axios';
import type {
  Card,
  CreateCardRequest,
  UpdateCardRequest,
  CardFilterParams,
  PaginatedResponse,
} from '../../types';

export const cardsApi = {
  // Получить все карточки с фильтрацией
  getCards: async (params?: CardFilterParams): Promise<PaginatedResponse<Card>> => {
    const response = await api.get<PaginatedResponse<Card>>('/api/cards', { params });
    return response.data;
  },

  // Получить карточки текущего пользователя
  getMyCards: async (params?: CardFilterParams): Promise<PaginatedResponse<Card>> => {
    const response = await api.get<PaginatedResponse<Card>>('/api/cards/my', { params });
    return response.data;
  },

  // Получить карточку по ID
  getCard: async (id: string): Promise<Card> => {
    const response = await api.get<Card>(`/api/cards/${id}`);
    return response.data;
  },

  // Создать карточку
  createCard: async (data: CreateCardRequest): Promise<Card> => {
    const response = await api.post<Card>('/api/cards', data);
    return response.data;
  },

  // Обновить карточку
  updateCard: async (id: string, data: UpdateCardRequest): Promise<Card> => {
    const response = await api.patch<Card>(`/api/cards/${id}`, data);
    return response.data;
  },

  // Удалить карточку
  deleteCard: async (id: string): Promise<void> => {
    await api.delete(`/api/cards/${id}`);
  },

  // Загрузить главное фото
  uploadMainPhoto: async (cardId: string, file: File): Promise<Card> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<{ card: Card }>(`/api/cards/${cardId}/photos/main`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.card;
  },

  // Загрузить фото в слайдшоу
  uploadSlideshowPhotos: async (cardId: string, files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await api.post(`/api/cards/${cardId}/photos/slideshow`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Загрузить фото впечатлений
  uploadExpressionPhotos: async (cardId: string, files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await api.post(`/api/cards/${cardId}/photos/expressions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Изменить порядок фото в слайдшоу
  reorderSlideshowPhotos: async (
    cardId: string,
    photos: Array<{ id: string; sortOrder: number }>
  ): Promise<void> => {
    await api.patch(`/api/cards/${cardId}/photos/slideshow/reorder`, { photos });
  },

  // Удалить фото из слайдшоу
  deleteSlideshowPhoto: async (photoId: string): Promise<void> => {
    await api.delete(`/api/cards/photos/${photoId}`);
  },
};
