import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ordersApi, paymentsApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { formatPrice, formatDateTime } from '../lib/utils';
import { OrderStatus } from '../types';

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  [OrderStatus.PREORDER]: {
    label: 'Ожидает оплаты',
    icon: Clock,
    className: 'text-yellow-600',
  },
  [OrderStatus.CONFIRMED]: {
    label: 'Подтверждён',
    icon: CheckCircle,
    className: 'text-blue-600',
  },
  [OrderStatus.PAID]: {
    label: 'Оплачен',
    icon: CheckCircle,
    className: 'text-green-600',
  },
  [OrderStatus.CANCELLED]: {
    label: 'Отменён',
    icon: XCircle,
    className: 'text-red-600',
  },
  [OrderStatus.EXPIRED]: {
    label: 'Истёк',
    icon: AlertCircle,
    className: 'text-muted-foreground',
  },
  [OrderStatus.COMPLETED]: {
    label: 'Завершён',
    icon: CheckCircle,
    className: 'text-green-600',
  },
};

export function OrdersPage() {
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders(),
  });

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Вы уверены, что хотите отменить этот заказ?')) {
      try {
        await ordersApi.cancelOrder(orderId);
        refetch();
      } catch (error) {
        console.error('Failed to cancel order:', error);
      }
    }
  };

  const handlePayOrder = async (orderId: string) => {
    setPayingOrderId(orderId);
    try {
      const payment = await paymentsApi.createPayment({ orderId });
      if (payment.confirmationUrl) {
        window.location.href = payment.confirmationUrl;
      }
    } catch (error) {
      console.error('Failed to create payment:', error);
    } finally {
      setPayingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-8">Мои заказы</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-8">Мои заказы</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">У вас пока нет заказов</h2>
            <p className="text-muted-foreground mb-6">
              Забронируйте свой первый тур прямо сейчас!
            </p>
            <Button asChild>
              <a href="/tours">Посмотреть туры</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Мои заказы</h1>

      <div className="space-y-6">
        {orders.map((order) => {
          const status = statusConfig[order.status] ?? {
            label: order.status,
            icon: AlertCircle,
            className: 'text-muted-foreground',
          };
          const StatusIcon = status.icon;

          return (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="mb-2">
                      {order.card?.title || 'Тур удалён'}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Заказ #{order.id} от {formatDateTime(order.createdAt)}
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${status.className}`}>
                    <StatusIcon className="h-5 w-5" />
                    <span className="font-semibold">{status.label}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Дата и время</div>
                      <div className="font-medium">
                        {order.date
                          ? `${formatDateTime(order.date)}${order.time ? ' в ' + order.time : ''}`
                          : 'Не указано'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Билеты</div>
                      <div className="space-y-1">
                        {order.orderTickets?.map((ot) => (
                          <div key={ot.id}>
                            {ot.ticket?.title ?? ot.priceSnapshot?.ticketTitle ?? 'Билет'}:
                            {' '}{ot.quantity} шт.
                            {ot.priceSnapshot?.calculatedTotal
                              ? ` — ${formatPrice(ot.priceSnapshot.calculatedTotal)}`
                              : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Контактная информация</div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm">{order.customerEmail}</div>
                      <div className="text-sm">{order.customerPhone}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Общая сумма</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatPrice(Number(order.amount))}
                      </div>
                      {order.prepaymentAmount && (
                        <>
                          <div className="text-sm text-muted-foreground mt-1">
                            Предоплата (оплачено онлайн):{' '}
                            <span className="font-medium text-foreground">
                              {formatPrice(Number(order.prepaymentAmount))}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Остаток к оплате на месте:{' '}
                            <span className="font-medium text-foreground">
                              {formatPrice(Number(order.amount) - Number(order.prepaymentAmount))}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {(order.status === OrderStatus.PREORDER || order.status === OrderStatus.CONFIRMED) && (
                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Отменить заказ
                    </Button>
                    <Button
                      onClick={() => handlePayOrder(order.id)}
                      disabled={payingOrderId === order.id}
                    >
                      {payingOrderId === order.id ? 'Обработка...' : 'Оплатить'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
