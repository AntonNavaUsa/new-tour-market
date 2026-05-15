import { api } from '../axios';
import type { OrderMessage } from '../../types';

export const messagesApi = {
  getMessages: (orderId: string): Promise<OrderMessage[]> =>
    api.get(`/api/orders/${orderId}/messages`).then((r) => r.data),

  sendMessage: (orderId: string, text: string): Promise<OrderMessage> =>
    api.post(`/api/orders/${orderId}/messages`, { text }).then((r) => r.data),

  getUnreadCount: (): Promise<{ count: number }> =>
    api.get('/api/orders/messages/unread-count').then((r) => r.data),
};
