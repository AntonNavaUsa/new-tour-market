import api from '../axios';
import type { Order, CreateOrderRequest } from '../../types';

export const ordersApi = {
  // Создать предзаказ
  createOrder: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<Order>('/api/orders', data);
    return response.data;
  },

  // Получить заказы текущего пользователя
  getMyOrders: async (): Promise<Order[]> => {
    const response = await api.get<{ data: Order[] } | Order[]>('/api/orders');
    const result = response.data;
    return Array.isArray(result) ? result : result.data;
  },

  // Получить все заказы (admin/partner)
  getAllOrders: async (): Promise<Order[]> => {
    const response = await api.get<{ data: Order[] } | Order[]>('/api/orders/all');
    const result = response.data;
    return Array.isArray(result) ? result : result.data;
  },

  // Получить заказ по ID
  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/api/orders/${id}`);
    return response.data;
  },

  // Подтвердить бронирование
  confirmOrder: async (id: string): Promise<Order> => {
    const response = await api.post<Order>(`/api/orders/${id}/confirm`);
    return response.data;
  },

  // Отменить заказ
  cancelOrder: async (id: string): Promise<Order> => {
    const response = await api.post<Order>(`/api/orders/${id}/cancel`);
    return response.data;
  },
};
