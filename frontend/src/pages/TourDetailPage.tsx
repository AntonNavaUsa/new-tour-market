import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cardsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { formatPrice, formatDate } from '../lib/utils';
import type { Price, Schedule, Ticket } from '../types';

type TimeSlot = {
  date: string;
  time: string;
};

function getDayName(date: Date) {
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  return dayNames[date.getDay()];
}

function isDateWithinRange(date: Date, from: string, to: string) {
  const target = new Date(date.toDateString()).getTime();
  const fromDate = new Date(new Date(from).toDateString()).getTime();
  const toDate = new Date(new Date(to).toDateString()).getTime();

  return target >= fromDate && target <= toDate;
}

function getUpcomingSlots(schedule?: Schedule, limit = 10): TimeSlot[] {
  if (!schedule) {
    return [];
  }

  const weeklySchedule = (schedule.weeklySchedule ?? {}) as Record<
    string,
    { active?: boolean; times?: string[] }
  >;
  const specialDates = Array.isArray(schedule.specialDates) ? schedule.specialDates : [];
  const slots: TimeSlot[] = [];

  for (let offset = 0; offset < 45 && slots.length < limit; offset += 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);

    const isoDate = date.toISOString().split('T')[0];
    const specialDate = specialDates.find((item: any) =>
      isDateWithinRange(date, item.dateFrom, item.dateTo ?? item.dateFrom),
    );

    if (specialDate?.isClosed) {
      continue;
    }

    const dayName = getDayName(date);
    const baseSchedule = weeklySchedule[dayName];
    const times = specialDate?.times?.length ? specialDate.times : baseSchedule?.times ?? [];
    const isActive = specialDate?.times?.length ? true : baseSchedule?.active;

    if (!isActive || times.length === 0) {
      continue;
    }

    for (const time of times) {
      slots.push({ date: isoDate, time });

      if (slots.length >= limit) {
        break;
      }
    }
  }

  return slots;
}

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

export function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', id],
    queryFn: () => cardsApi.getCard(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-96 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Тур не найден</h1>
        <Link to="/tours" className="text-primary hover:underline">
          Вернуться к каталогу
        </Link>
      </div>
    );
  }

  const allImages = [
    card.headPhotoUrl,
    ...(card.slideshowPhotos || []).map((photo) => photo.url),
  ].filter((image): image is string => Boolean(image));

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const schedule = card.schedules?.[0];
  const upcomingSlots = getUpcomingSlots(schedule);
  const minPrice = card.tickets && card.tickets.length > 0
    ? Math.min(
        ...card.tickets
          .flatMap((ticket) => (ticket.prices ?? []).map((price) => Number(price.adultPrice)))
          .filter((price) => Number.isFinite(price)),
      )
    : 0;
  const locationLabel = card.location
    ? [card.location.city, card.location.region, card.location.country].filter(Boolean).join(', ')
    : 'Локация уточняется';

  return (
    <div className="container py-12">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Назад
      </Button>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-4">
            {allImages.length > 0 ? (
              <>
                <img
                  src={allImages[currentImageIndex]}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentImageIndex
                              ? 'bg-white'
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Нет фотографий
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allImages.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-video rounded overflow-hidden ${
                    index === currentImageIndex ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${card.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tour Info */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{card.title}</h1>

          <div className="flex flex-wrap gap-4 mb-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{locationLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{card.duration ? `${card.duration} мин` : 'Длительность уточняется'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>До {card.maxParticipants} человек</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-3xl font-bold text-primary mb-2">
              от {formatPrice(minPrice)}
            </div>
            <p className="text-muted-foreground">за человека</p>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-3">Описание</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {card.description}
            </p>
          </div>

          {/* Schedules */}
          {upcomingSlots.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Доступные даты
              </h2>
              <div className="grid gap-3">
                {upcomingSlots.map((slot) => {
                  const availablePrices = (card.tickets ?? [])
                    .map((ticket) => getTicketPriceForDate(ticket, slot.date))
                    .filter((price): price is Price => Boolean(price));
                  const slotPrice = availablePrices.length > 0
                    ? Math.min(...availablePrices.map((price) => Number(price.adultPrice)))
                    : minPrice;
                  const totalAvailable = availablePrices.length > 0
                    ? Math.min(...availablePrices.map((price) => price.availableSlots ?? Number.MAX_SAFE_INTEGER))
                    : 0;

                  return (
                    <Card
                      key={`${slot.date}-${slot.time}`}
                      className={`cursor-pointer transition ${
                        selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                          ? 'ring-2 ring-primary'
                          : 'hover:border-primary'
                      }`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">
                              {formatDate(slot.date)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {slot.time}
                              {Number.isFinite(totalAvailable) && totalAvailable > 0
                                ? ` • ${totalAvailable} мест доступно`
                                : ''}
                            </div>
                          </div>
                          {slotPrice > 0 && (
                            <div className="text-right">
                              <div className="font-semibold">
                                от {formatPrice(slotPrice)}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!selectedSlot}
            onClick={() => {
              if (selectedSlot) {
                navigate(`/booking/${card.id}?date=${selectedSlot.date}&time=${selectedSlot.time}`);
              }
            }}
          >
            {selectedSlot ? 'Забронировать' : 'Выберите дату'}
          </Button>

          {/* Expression Photos */}
          {card.expressions && card.expressions.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-4">Дополнительные фото</h2>
              <div className="grid grid-cols-2 gap-4">
                {card.expressions.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="aspect-square rounded-lg overflow-hidden"
                  >
                    <img
                      src={photo.photoUrl}
                      alt={`Expression ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
