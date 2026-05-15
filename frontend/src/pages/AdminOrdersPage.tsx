import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../lib/api/orders';
import { messagesApi } from '../lib/api/messages';
import { OrderStatus } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { OrderChat } from '../components/OrderChat';
import type { Order } from '../types';

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PREORDER]: 'Предзаказ',
  [OrderStatus.CONFIRMED]: 'Подтверждён',
  [OrderStatus.PAID]: 'Оплачен',
  [OrderStatus.CANCELLED]: 'Отменён',
  [OrderStatus.EXPIRED]: 'Истёк',
  [OrderStatus.COMPLETED]: 'Завершён',
};

const STATUS_VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [OrderStatus.PREORDER]: 'outline',
  [OrderStatus.CONFIRMED]: 'secondary',
  [OrderStatus.PAID]: 'default',
  [OrderStatus.CANCELLED]: 'destructive',
  [OrderStatus.EXPIRED]: 'destructive',
  [OrderStatus.COMPLETED]: 'default',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PREORDER]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-300',
  [OrderStatus.PAID]: 'bg-green-100 text-green-800 border-green-300',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-300',
  [OrderStatus.EXPIRED]: 'bg-gray-100 text-gray-600 border-gray-300',
  [OrderStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

type FilterStatus = 'ALL' | 'UNPAID' | OrderStatus;

const FILTER_TABS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'Все' },
  { key: OrderStatus.PAID, label: 'Оплачены' },
  { key: 'UNPAID', label: 'Ожидают оплаты' },
  { key: OrderStatus.CONFIRMED, label: 'Подтверждены' },
  { key: OrderStatus.CANCELLED, label: 'Отменены' },
];

function matchesFilter(order: Order, filter: FilterStatus): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'UNPAID') return order.status === OrderStatus.PREORDER;
  return order.status === filter;
}

export function AdminOrdersPage() {
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => ordersApi.getAllOrders(),
  });

  const filtered = orders.filter((order) => {
    if (!matchesFilter(order, filter)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (order.customerName ?? order.user?.name ?? '').toLowerCase().includes(q) ||
      (order.customerEmail ?? order.user?.email ?? '').toLowerCase().includes(q) ||
      (order.customerPhone ?? '').includes(q) ||
      (order.card?.title ?? '').toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q)
    );
  });

  const countByFilter = (f: FilterStatus) =>
    orders.filter((o) => matchesFilter(o, f)).length;

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Заказы</h1>
        <p className="text-muted-foreground mt-1">
          Все заказы от клиентов. Всего: {orders.length}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              filter === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-70">({countByFilter(key)})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          placeholder="Поиск по клиенту, туру, ID..."
        />
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-20 text-center">Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="text-muted-foreground py-20 text-center">Заказов не найдено</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const [chatOpen, setChatOpen] = useState(false);

  const { data: existingMessages } = useQuery({
    queryKey: ['order-messages', order.id],
    queryFn: () => messagesApi.getMessages(order.id),
    staleTime: 60000,
  });

  useEffect(() => {
    if (existingMessages && existingMessages.length > 0) {
      setChatOpen(true);
    }
  }, [existingMessages]);

  const name = order.customerName || order.user?.name || '—';
  const email = order.customerEmail || order.user?.email || '—';
  const phone = order.customerPhone || order.user?.phone || '—';
  const tourDate = order.date
    ? new Date(order.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';
  const createdAt = new Date(order.createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const amount = Number(order.amount).toLocaleString('ru-RU');
  const prepayment = Number(order.prepaymentAmount).toLocaleString('ru-RU');

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          {/* Left: customer + tour */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-base">{name}</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status]}`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <div>{email}</div>
              <div>{phone}</div>
            </div>
            <div className="mt-2 text-sm">
              <span className="font-medium">{order.card?.title ?? 'Тур удалён'}</span>
            </div>
          </div>

          {/* Center: date + quantity */}
          <div className="flex flex-col gap-1 text-sm md:text-right md:min-w-[120px]">
            <div>
              <span className="text-muted-foreground">Дата тура:</span>{' '}
              <span className="font-medium">{tourDate}</span>
            </div>
            {order.time && (
              <div>
                <span className="text-muted-foreground">Время:</span>{' '}
                <span>{order.time}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Участников:</span>{' '}
              <span>{order.quantity}</span>
            </div>
          </div>

          {/* Right: amount + created */}
          <div className="flex flex-col gap-1 text-sm md:text-right md:min-w-[150px]">
            <div className="text-lg font-bold">{amount} ₽</div>
            {Number(order.prepaymentAmount) > 0 && Number(order.prepaymentAmount) !== Number(order.amount) && (
              <div className="text-muted-foreground text-xs">предоплата: {prepayment} ₽</div>
            )}
            <div className="text-muted-foreground text-xs mt-1">
              Создан: {createdAt}
            </div>
            <div className="text-muted-foreground text-xs opacity-60 font-mono">
              #{order.id.slice(-8).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Chat toggle */}
        <div className="mt-3 pt-3 border-t">
          <Button
            variant={chatOpen ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChatOpen((v) => !v)}
            className="gap-2 text-xs h-8"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Чат с клиентом
            {chatOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {chatOpen && (
          <div className="mt-3">
            <OrderChat orderId={order.id} isOrganizer={true} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
