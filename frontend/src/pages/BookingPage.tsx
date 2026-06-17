import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cardsApi, ordersApi, authApi, extrasApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { formatPrice, formatDate, formatDuration, formatDurationRange, calculateTicketPrice, formatTierLabel } from '../lib/utils';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { handleApiError } from '../lib/axios';
import type { Price, Ticket } from '../types';
import { PricingType } from '../types';

function getTicketPriceForDate(ticket: Ticket, date: string): Price | undefined {
  if (!ticket.prices?.length) {
    return undefined;
  }

  const selectedDate = new Date(date);

  return ticket.prices.find((price) => {
    const from = new Date(price.dateFrom);
    const to = new Date(price.dateTo);
    return selectedDate >= from && selectedDate <= to;
  }) ?? ticket.prices[0];
}

const bookingSchema = z.object({
  customerName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  customerEmail: z.string().email('Неверный формат email'),
  customerPhone: z.string().min(10, 'Введите корректный номер телефона'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const selectedDate = searchParams.get('date');
  const selectedTime = searchParams.get('time');
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  // extraId -> quantity (0 = не выбрано)
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', id],
    queryFn: () => cardsApi.getCard(id!),
    enabled: !!id,
  });

  const { data: cardExtras = [] } = useQuery({
    queryKey: ['card-extras', id],
    queryFn: () => extrasApi.getForCard(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: user?.name || '',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) {
      setValue('customerName', user.name);
      setValue('customerEmail', user.email);
      setValue('customerPhone', user.phone);
    }
  }, [user, setValue]);

  useEffect(() => {
    if (!card || !selectedDate) return;
    const tickets = (card.tickets ?? [])
      .filter((ticket) => getTicketPriceForDate(ticket, selectedDate))
      .map((ticket) => ticket.id);
    if (tickets.length === 0) return;
    setTicketQuantities((prev) => {
      const hasAny = Object.values(prev).some((v) => v > 0);
      if (hasAny) return prev;
      return Object.fromEntries(tickets.map((ticketId) => [ticketId, ticketId === tickets[0] ? 1 : 0]));
    });
  }, [card, selectedDate]);

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!card || !selectedDate) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Ошибка бронирования</h1>
        <p className="text-muted-foreground mb-6">
          Тур или расписание не найдены
        </p>
        <Button onClick={() => navigate('/tours')}>Вернуться к турам</Button>
      </div>
    );
  }

  const availableTickets = (card.tickets ?? [])
    .map((ticket) => {
      const price = getTicketPriceForDate(ticket, selectedDate);

      if (!price) {
        return null;
      }

      return {
        ticket,
        price,
      };
    })
    .filter(
      (item): item is { ticket: Ticket; price: Price } => Boolean(item),
    );

  if (availableTickets.length === 0) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Расписание не найдено</h1>
        <Button onClick={() => navigate(`/tours/${id}`)}>
          Вернуться к туру
        </Button>
      </div>
    );
  }

  const updateQuantity = (ticketId: string, change: number) => {
    setTicketQuantities((prev) => {
      const selectedTicket = availableTickets.find((item) => item.ticket.id === ticketId);
      if (!selectedTicket) return prev;

      const currentQuantity = prev[ticketId] || 0;
      const maxAvailable = selectedTicket.price.availableSlots ?? Number.MAX_SAFE_INTEGER;
      const newQuantity = Math.max(
        0,
        Math.min(maxAvailable, currentQuantity + change)
      );

      return { ...prev, [ticketId]: newQuantity };
    });
  };

  const totalTicketsAmount = Object.entries(ticketQuantities).reduce(
    (sum, [ticketId, quantity]) => {
      const selectedTicket = availableTickets.find((item) => item.ticket.id === ticketId);
      if (!selectedTicket || quantity === 0) return sum;
      const calculated = calculateTicketPrice(selectedTicket.price, Number(quantity));
      return sum + (calculated ?? 0);
    },
    0
  );

  const totalExtrasAmount = Object.entries(extraQuantities).reduce(
    (sum, [extraId, qty]) => {
      if (qty === 0) return sum;
      const extra = cardExtras.find((e) => e.id === extraId);
      if (!extra) return sum;
      const price = parseFloat(extra.price);
      return sum + (extra.pricingType === PricingType.PER_GROUP ? price : price * qty);
    },
    0
  );

  const totalAmount = totalTicketsAmount + totalExtrasAmount;

  const totalTickets = Object.values(ticketQuantities).reduce(
    (sum, qty) => sum + qty,
    0
  );

  const onSubmit = async (data: BookingFormData) => {
    if (totalTickets === 0) {
      setError('Выберите хотя бы один билет');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Регистрируем или авторизуем пользователя по email/phone
      if (!user) {
        const authResponse = await authApi.bookingRegister({
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
        });
        localStorage.setItem('accessToken', authResponse.accessToken);
        localStorage.setItem('refreshToken', authResponse.refreshToken);
        useAuthStore.setState({
          user: authResponse.user,
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          isAuthenticated: true,
        });
      }

      const tickets = Object.entries(ticketQuantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([ticketId, quantity]) => ({
          ticketId,
          quantity,
        }));

      const extras = Object.entries(extraQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([extraId, quantity]) => ({ extraId, quantity }));

      await ordersApi.createOrder({
        cardId: card.id,
        date: selectedDate,
        time: selectedTime || undefined,
        tickets,
        ...(extras.length > 0 ? { extras } : {}),
        ...data,
      });

      navigate('/orders');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/tours/${id}`)}
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад к туру
        </Button>

        <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tour Info */}
            <Card>
              <CardHeader>
                <CardTitle>Информация о туре</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-lg">{card.title}</h3>
                    <p className="text-muted-foreground">
                      {formatDate(selectedDate)}{selectedTime ? ` в ${selectedTime}` : ''}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[card.location?.city, card.location?.country].filter(Boolean).join(', ') || 'Локация уточняется'}
                    {(card.durationFrom || card.durationTo) ? ` • ${formatDurationRange(card.durationFrom, card.durationTo)}` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Выбор билетов</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableTickets.map(({ ticket, price }) => {
                  const qty = ticketQuantities[ticket.id] || 0;
                  const hasGroupTiers = price.groupTiers && price.groupTiers.length > 0;
                  const calculatedPrice = qty > 0 ? calculateTicketPrice(price, qty) : null;
                  const noTierForQty = hasGroupTiers && qty > 0 && calculatedPrice === null;

                  return (
                  <div
                    key={ticket.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold">{ticket.title}</div>
                        {hasGroupTiers ? (
                          <div className="mt-1 space-y-0.5">
                            {price.groupTiers!.map((t, i) => (
                              <div key={i} className="text-xs text-muted-foreground">{formatTierLabel(t)}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(Number(price.adultPrice))} / чел.
                            {price.availableSlots !== null ? ` • Доступно: ${price.availableSlots}` : ''}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Button
                          type="button" variant="outline" size="sm"
                          onClick={() => updateQuantity(ticket.id, -1)}
                          disabled={!ticketQuantities[ticket.id]}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{qty}</span>
                        <Button
                          type="button" variant="outline" size="sm"
                          onClick={() => updateQuantity(ticket.id, 1)}
                          disabled={
                            price.availableSlots !== null &&
                            qty >= price.availableSlots
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {qty > 0 && (
                      <div className={`text-sm font-medium ${noTierForQty ? 'text-destructive' : 'text-primary'}`}>
                        {noTierForQty
                          ? `Нет тарифа для ${qty} человек`
                          : `Итого: ${formatPrice(calculatedPrice!)}`}
                      </div>
                    )}
                  </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Extras */}
            {cardExtras.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Дополнительные опции</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cardExtras.map((extra) => {
                    const qty = extraQuantities[extra.id] ?? 0;
                    const price = parseFloat(extra.price);
                    const lineTotal = extra.pricingType === PricingType.PER_GROUP ? price : price * (qty || 1);
                    const isPerGroup = extra.pricingType === PricingType.PER_GROUP;

                    return (
                      <div key={extra.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="font-semibold">{extra.title}</div>
                            {extra.description && (
                              <div className="text-sm text-muted-foreground">{extra.description}</div>
                            )}
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {formatPrice(price)}{isPerGroup ? ' / за группу' : ' / чел.'}
                            </div>
                          </div>
                          {isPerGroup ? (
                            /* За группу — просто чекбокс */
                            <label className="flex items-center gap-2 cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={qty > 0}
                                onChange={(e) =>
                                  setExtraQuantities((prev) => ({
                                    ...prev,
                                    [extra.id]: e.target.checked ? 1 : 0,
                                  }))
                                }
                                className="h-5 w-5 rounded border-input accent-primary"
                              />
                              <span className="text-sm">Добавить</span>
                            </label>
                          ) : (
                            /* За чел — счётчик */
                            <div className="flex items-center gap-3 shrink-0">
                              <Button
                                type="button" variant="outline" size="sm"
                                onClick={() =>
                                  setExtraQuantities((prev) => ({
                                    ...prev,
                                    [extra.id]: Math.max(0, (prev[extra.id] ?? 0) - 1),
                                  }))
                                }
                                disabled={qty === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{qty}</span>
                              <Button
                                type="button" variant="outline" size="sm"
                                onClick={() =>
                                  setExtraQuantities((prev) => ({
                                    ...prev,
                                    [extra.id]: (prev[extra.id] ?? 0) + 1,
                                  }))
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {qty > 0 && (
                          <div className="text-sm font-medium text-primary">
                            Итого: {formatPrice(isPerGroup ? price : price * qty)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Контактная информация</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Имя</Label>
                    <Input
                      id="customerName"
                      {...register('customerName')}
                    />
                    {errors.customerName && (
                      <p className="text-sm text-destructive">
                        {errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...register('customerEmail')}
                    />
                    {errors.customerEmail && (
                      <p className="text-sm text-destructive">
                        {errors.customerEmail.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Телефон</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      {...register('customerPhone')}
                    />
                    {errors.customerPhone && (
                      <p className="text-sm text-destructive">
                        {errors.customerPhone.message}
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Итого</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(ticketQuantities)
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([ticketId, quantity]) => {
                    const selectedTicket = availableTickets.find(
                      (item) => item.ticket.id === ticketId
                    );
                    if (!selectedTicket) return null;

                    const lineTotal = calculateTicketPrice(selectedTicket.price, Number(quantity)) ?? 0;

                    return (
                      <div key={ticketId} className="flex justify-between text-sm">
                        <span>
                          {selectedTicket.ticket.title} x{quantity}
                        </span>
                        <span>{formatPrice(lineTotal)}</span>
                      </div>
                    );
                  })}

                {/* Extras lines in summary */}
                {Object.entries(extraQuantities)
                  .filter(([_, qty]) => qty > 0)
                  .map(([extraId, qty]) => {
                    const extra = cardExtras.find((e) => e.id === extraId);
                    if (!extra) return null;
                    const price = parseFloat(extra.price);
                    const lineTotal = extra.pricingType === PricingType.PER_GROUP ? price : price * qty;
                    return (
                      <div key={extraId} className="flex justify-between text-sm text-muted-foreground">
                        <span>{extra.title}{extra.pricingType === PricingType.PER_PERSON ? ` x${qty}` : ''}</span>
                        <span>{formatPrice(lineTotal)}</span>
                      </div>
                    );
                  })}

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Всего</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg text-primary mt-1">
                    <span>К оплате сейчас (20%)</span>
                    <span>{formatPrice(Math.ceil(totalAmount * 0.2 / 100) * 100)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Остаток на месте</span>
                    <span>{formatPrice(totalAmount - Math.ceil(totalAmount * 0.2 / 100) * 100)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalTickets} {totalTickets === 1 ? 'билет' : 'билетов'}
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleSubmit(onSubmit)}
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting || totalTickets === 0}
                >
                  {isSubmitting ? 'Обработка...' : 'Забронировать'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
