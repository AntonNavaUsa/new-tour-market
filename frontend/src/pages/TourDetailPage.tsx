import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cardsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { formatPrice, formatDate, formatDuration, getMinPriceFromTiers, formatTierLabel } from '../lib/utils';
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

  for (let offset = 0; offset < 90 && slots.length < limit; offset += 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);

    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

function getAvailableDates(schedule?: Schedule, scanDays = 90): string[] {
  if (!schedule) {
    return [];
  }

  const weeklySchedule = (schedule.weeklySchedule ?? {}) as Record<
    string,
    { active?: boolean; times?: string[] }
  >;
  const specialDates = Array.isArray(schedule.specialDates) ? schedule.specialDates : [];
  const dates: string[] = [];

  for (let offset = 0; offset < scanDays; offset += 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);

    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

    if (isActive && times.length > 0) {
      dates.push(isoDate);
    }
  }

  return dates;
}

function isEarlyBooking(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 30;
}

function getDayNameRu(dateStr: string): string {
  const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return dayNames[new Date(dateStr).getDay()];
}

function groupDatesByMonth(dates: string[]): { month: string; dates: string[] }[] {
  const months: Record<string, string[]> = {};
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];
  for (const date of dates) {
    const d = new Date(date);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (!months[key]) months[key] = [];
    months[key].push(date);
  }
  return Object.entries(months).map(([month, dates]) => ({ month, dates }));
}

function getTimesForDate(schedule: Schedule | undefined, dateStr: string): string[] {
  if (!schedule) {
    return [];
  }

  const date = new Date(dateStr);
  const weeklySchedule = (schedule.weeklySchedule ?? {}) as Record<
    string,
    { active?: boolean; times?: string[] }
  >;
  const specialDates = Array.isArray(schedule.specialDates) ? schedule.specialDates : [];

  const specialDate = specialDates.find((item: any) =>
    isDateWithinRange(date, item.dateFrom, item.dateTo ?? item.dateFrom),
  );

  if (specialDate?.isClosed) {
    return [];
  }

  if (specialDate?.times?.length) {
    return specialDate.times;
  }

  const dayName = getDayName(date);
  const baseSchedule = weeklySchedule[dayName];
  
  return baseSchedule?.active ? (baseSchedule.times ?? []) : [];
}

function getDateLabel(dateStr: string): { label: string; dayName: string } {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const dateTime = date.getTime();
  
  const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const dayName = dayNames[date.getDay()];

  if (dateTime === today.getTime()) {
    return { label: 'Сегодня', dayName };
  } else if (dateTime === tomorrow.getTime()) {
    return { label: 'Завтра', dayName };
  } else if (dateTime === dayAfterTomorrow.getTime()) {
    return { label: 'Послезавтра', dayName };
  }
  
  return { label: dayName, dayName };
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

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
  const availableDates = getAvailableDates(schedule);
  const quickDateOptions = availableDates.slice(0, 3);
  const hasEarlyBookingOnly = availableDates.length > 0 && isEarlyBooking(availableDates[0]);
  const minPrice = card.tickets && card.tickets.length > 0
    ? Math.min(
        ...card.tickets.flatMap((ticket) =>
          (ticket.prices ?? [])
            .filter((p: any) => !p.isArchived)
            .map((price: any) => {
              if (price.groupTiers && price.groupTiers.length > 0) {
                return getMinPriceFromTiers(price.groupTiers);
              }
              return Number(price.adultPrice);
            })
        ).filter((p) => Number.isFinite(p)),
      )
    : 0;

  const hasGroupPricing = card.tickets?.some((t) =>
    t.prices?.some((p: any) => !p.isArchived && p.groupTiers && p.groupTiers.length > 0),
  );

  const allTiers = card.tickets?.flatMap((t) =>
    (t.prices ?? []).filter((p: any) => !p.isArchived && p.groupTiers?.length).flatMap((p: any) => p.groupTiers),
  ) ?? [];
  const locationLabel = card.location
    ? [card.location.city, card.location.region, card.location.country].filter(Boolean).join(', ')
    : 'Локация уточняется';

  const timesForSelectedDate = selectedDate ? getTimesForDate(schedule, selectedDate) : [];

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
              <span>{card.duration ? formatDuration(card.duration) : 'Длительность уточняется'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>До {card.maxParticipants} человек</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-3xl font-bold text-primary mb-1">
              от {formatPrice(minPrice)}
            </div>
            {hasGroupPricing && allTiers.length > 0 ? (
              <div className="space-y-0.5 mt-2">
                {allTiers.map((t: any, i: number) => (
                  <div key={i} className="text-sm text-muted-foreground">{formatTierLabel(t)}</div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">за человека</p>
            )}
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-3">Описание</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {card.description}
            </p>
          </div>

          {/* Schedules */}
          {availableDates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Выберите дату
                {hasEarlyBookingOnly && (
                  <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                    Раннее бронирование
                  </span>
                )}
              </h2>
              {hasEarlyBookingOnly && (
                <p className="text-sm text-muted-foreground mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  Ближайшие даты временно недоступны. Вы можете забронировать тур заранее на будущие даты.
                </p>
              )}
              
              {/* Quick date selection */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {quickDateOptions.map((date) => {
                  const { label } = getDateLabel(date);
                  const isSelected = selectedDate === date;
                  const earlyBooking = isEarlyBooking(date);
                  return (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedSlot(null);
                      }}
                      className={`p-4 rounded-lg border-2 transition text-center ${
                        isSelected
                          ? 'border-primary bg-primary/5 font-semibold'
                          : earlyBooking
                          ? 'border-amber-300 hover:border-amber-400 bg-amber-50/50'
                          : 'border-input hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg font-medium">{earlyBooking ? formatDate(date) : label}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {earlyBooking ? getDayNameRu(date) : formatDate(date)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Calendar for other dates */}
              {availableDates.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {showCalendar ? 'Скрыть календарь' : 'Показать другие даты'}
                </Button>
              )}

              {showCalendar && availableDates.length > 3 && (
                <div className="mb-4 p-4 rounded-lg bg-muted/30">
                  {groupDatesByMonth(availableDates.slice(3)).map(({ month, dates: monthDates }) => {
                    const firstDate = new Date(monthDates[0]);
                    const year = firstDate.getFullYear();
                    const monthIdx = firstDate.getMonth();
                    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
                    // Monday-first: (getDay()+6)%7 → Mon=0, ..., Sun=6
                    const offset = (new Date(year, monthIdx, 1).getDay() + 6) % 7;
                    const availableSet = new Set(monthDates);
                    return (
                      <div key={month} className="mb-6">
                        <div className="text-sm font-semibold text-muted-foreground mb-2">{month}</div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d) => (
                            <div key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
                          ))}
                          {Array.from({ length: offset }, (_, i) => (
                            <div key={`empty-${i}`} />
                          ))}
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isAvailable = availableSet.has(dateStr);
                            const isSelected = selectedDate === dateStr;
                            if (isAvailable) {
                              return (
                                <button
                                  key={dateStr}
                                  onClick={() => {
                                    setSelectedDate(dateStr);
                                    setSelectedSlot(null);
                                    setShowCalendar(false);
                                  }}
                                  className={`py-2 rounded-md border text-sm font-medium transition ${
                                    isSelected
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-input hover:border-primary/50 hover:bg-background'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            }
                            return (
                              <div key={dateStr} className="py-2 text-sm text-muted-foreground/30">
                                {day}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Time selection */}
              {selectedDate && timesForSelectedDate.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-3">Выберите время</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timesForSelectedDate.map((time) => {
                      const slot = { date: selectedDate, time };
                      const isSelected = selectedSlot?.date === slot.date && selectedSlot?.time === slot.time;
                      
                      const availablePrices = (card.tickets ?? [])
                        .map((ticket) => getTicketPriceForDate(ticket, slot.date))
                        .filter((price): price is Price => Boolean(price));
                      const slotPrice = availablePrices.length > 0
                        ? Math.min(...availablePrices.map((price) => Number(price.adultPrice)))
                        : minPrice;

                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-lg border-2 transition text-center ${
                            isSelected
                              ? 'border-primary bg-primary/5 font-semibold'
                              : 'border-input hover:border-primary/50'
                          }`}
                        >
                          <div className="font-medium">{time}</div>
                          {slotPrice > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              от {formatPrice(slotPrice)}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
