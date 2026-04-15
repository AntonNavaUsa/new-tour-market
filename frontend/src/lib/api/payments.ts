import api from '../axios';
import type { CreatePaymentRequest, PaymentResponse, Payment } from '../../types';

export const paymentsApi = {
  // Создать платеж
  createPayment: async (data: CreatePaymentRequest): Promise<PaymentResponse> => {
    const response = await api.post<PaymentResponse>('/api/payments/create', data);
    return response.data;
  },

  // Получить статус платежа
  getPaymentStatus: async (id: string): Promise<Payment> => {
    const response = await api.get<Payment>(`/api/payments/${id}/status`);
    return response.data;
  },

  // Обработать callback от YooKassa
  handleCallback: async (orderId: string): Promise<any> => {
    const response = await api.get(`/api/payments/callback`, {
      params: { orderId },
    });
    return response.data;
  },

  // Получить все платежи (admin)
  getAllPayments: async (): Promise<Payment[]> => {
    const response = await api.get<Payment[]>('/api/payments/all');
    return response.data;
  },
};
