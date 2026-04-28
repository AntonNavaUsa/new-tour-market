import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Clock, Users, Calendar, ChevronLeft, ChevronRight, X, Ruler, TrendingUp, Baby, Navigation } from 'lucide-react';
import CardTypeIcon from '../components/CardTypeIcon';
import { cardsApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { formatPrice, formatDate, formatDurationRange, getMinPriceFromTiers, formatTierLabel } from '../lib/utils';
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

function isTodayAvailableWithBuffer(times: string[], bufferHours = 3): boolean {
  if (times.length === 0) return false;
  const latestTime = times.reduce((latest, t) => (t > latest ? t : latest), times[0]);
  const [h, m] = latestTime.split(':').map(Number);
  const lastStart = new Date();
  lastStart.setHours(h, m, 0, 0);
  return Date.now() + bufferHours * 60 * 60 * 1000 <= lastStart.getTime();
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
      if (offset === 0 && !isTodayAvailableWithBuffer(times)) {
        continue;
      }
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
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', id],
    queryFn: () => cardsApi.getCard(id!),
    enabled: !!id,
  });

  const allImages = [
    card?.headPhotoUrl,
    ...(card?.slideshowPhotos || []).map((photo: any) => photo.url),
  ].filter((image): image is string => Boolean(image));

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % allImages.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, allImages.length]);

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

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxNext = () => setLightboxIndex((i) => (i + 1) % allImages.length);
  const lightboxPrev = () => setLightboxIndex((i) => (i - 1 + allImages.length) % allImages.length);

  const schedule = card.schedules?.[0];
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
    <>
    {/* ─── Hero Cover ─── */}

    {/* Mobile: stacked image + text block */}
    <div className="md:hidden">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
        {card.headPhotoUrl ? (
          <img
            src={card.headPhotoUrl}
            alt={card.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
        )}
        {/* Light bottom fade into text block */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 to-transparent" />

        {/* Breadcrumbs */}
        <nav className="absolute top-0 left-0 right-0 flex items-center gap-1.5 text-xs text-white/60 px-4 pt-4">
          <Link to="/" className="hover:text-white transition shrink-0">Главная</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to="/tours" className="hover:text-white transition shrink-0">Туры</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-white/80 truncate">{card.title}</span>
        </nav>
      </div>

      {/* Text below image */}
      <div className="bg-slate-900 px-4 pt-4 pb-6">
        <h1 className="text-2xl font-bold text-white mb-2 leading-tight break-words">
          {card.title}
        </h1>
        {card.shortDescription && (
          <p className="text-sm text-white/70 mb-4 leading-relaxed">
            {card.shortDescription}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-white/90 px-3 py-1.5 rounded-full text-xs">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{locationLabel}</span>
          </div>
          {(card.durationFrom || card.durationTo) && (
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-white/90 px-3 py-1.5 rounded-full text-xs">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDurationRange(card.durationFrom, card.durationTo)}</span>
            </div>
          )}
          {card.maxParticipants && (
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-white/90 px-3 py-1.5 rounded-full text-xs">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>До {card.maxParticipants} чел.</span>
            </div>
          )}
          {minPrice > 0 && (
            <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow">
              от {formatPrice(minPrice)}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Desktop: full overlay hero */}
    <div className="hidden md:block relative h-[75vh] min-h-[520px] w-full overflow-hidden">
      {card.headPhotoUrl ? (
        <img
          src={card.headPhotoUrl}
          alt={card.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

      {/* Breadcrumbs */}
      <div className="absolute top-0 left-0 right-0 z-10 px-6 lg:px-8 pt-6">
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-white/60">
            <Link to="/" className="hover:text-white transition">Главная</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link to="/tours" className="hover:text-white transition">Туры</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="text-white/80 font-medium truncate">{card.title}</span>
          </nav>
        </div>
      </div>

      {/* Hero text */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 lg:px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
            {card.title}
          </h1>
          {card.shortDescription && (
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mb-7 leading-relaxed drop-shadow">
              {card.shortDescription}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-sm">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{locationLabel}</span>
            </div>
            {(card.durationFrom || card.durationTo) && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-sm">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{formatDurationRange(card.durationFrom, card.durationTo)}</span>
              </div>
            )}
            {card.maxParticipants && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-sm">
                <Users className="h-4 w-4 shrink-0" />
                <span>До {card.maxParticipants} чел.</span>
              </div>
            )}
            {minPrice > 0 && (
              <div className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                от {formatPrice(minPrice)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    <div className="container py-6 md:py-12 pb-24 lg:pb-12 overflow-hidden">
      <div className="max-w-6xl mx-auto">

      {/* Photo Gallery */}
      {allImages.length > 0 && (
        <div className="mb-10">
          {/* Desktop: Airbnb-style grid */}
          <div className="hidden md:block relative rounded-2xl overflow-hidden">
            {allImages.length === 1 && (
              <button
                className="w-full h-[460px] block group"
                onClick={() => openLightbox(0)}
              >
                <img src={allImages[0]} alt={card.title} className="w-full h-full object-cover group-hover:brightness-90 transition" />
              </button>
            )}

            {allImages.length === 2 && (
              <div className="grid grid-cols-2 gap-2 h-[460px]">
                {allImages.map((img, i) => (
                  <button key={i} className="group overflow-hidden rounded-none first:rounded-l-2xl last:rounded-r-2xl" onClick={() => openLightbox(i)}>
                    <img src={img} alt={`${card.title} ${i + 1}`} className="w-full h-full object-cover group-hover:brightness-90 transition" />
                  </button>
                ))}
              </div>
            )}

            {allImages.length >= 3 && (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[460px]">
                {/* Large first image */}
                <button
                  className="col-span-2 row-span-2 group overflow-hidden rounded-l-2xl"
                  onClick={() => openLightbox(0)}
                >
                  <img src={allImages[0]} alt={card.title} className="w-full h-full object-cover group-hover:brightness-90 transition duration-300" />
                </button>
                {/* Grid 2×2 on right */}
                {allImages.slice(1, 5).map((img, i) => {
                  const pos = i + 1;
                  const roundedClass =
                    i === 1 ? 'rounded-tr-2xl' :
                    i === 3 ? 'rounded-br-2xl' : '';
                  return (
                    <button
                      key={pos}
                      className={`group overflow-hidden relative ${roundedClass}`}
                      onClick={() => openLightbox(pos)}
                    >
                      <img
                        src={img}
                        alt={`${card.title} ${pos + 1}`}
                        className="w-full h-full object-cover group-hover:brightness-90 transition duration-300"
                      />
                      {/* "Show all" overlay on last visible cell */}
                      {i === 3 && allImages.length > 5 && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white pointer-events-none">
                          <span className="text-2xl font-bold">+{allImages.length - 5}</span>
                          <span className="text-sm mt-1">ещё фото</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Show all button */}
            <button
              onClick={() => openLightbox(0)}
              className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 hover:bg-white backdrop-blur-sm text-sm font-semibold text-gray-800 px-4 py-2 rounded-xl shadow-md transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Все фото · {allImages.length}
            </button>
          </div>

          {/* Mobile: horizontal scroll strip */}
          <div className="md:hidden overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-2 snap-x snap-mandatory w-max min-w-full">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => openLightbox(index)}
                className="flex-shrink-0 w-64 h-44 rounded-xl overflow-hidden snap-start"
              >
                <img src={image} alt={`${card.title} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* Two-column content */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-10 items-start">

        {/* LEFT — description, meta, expression photos */}
        <div className="lg:col-span-2 space-y-8 order-last lg:order-none">

          {/* Meta */}
          <div className="hidden md:flex flex-wrap gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{locationLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span>{(card.durationFrom || card.durationTo) ? formatDurationRange(card.durationFrom, card.durationTo) : 'Длительность уточняется'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>До {card.maxParticipants} человек</span>
            </div>
          </div>

          {/* Description */}
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-3">Описание</h2>
            <div
              className="text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: card.description }}
            />
          </div>

          {/* Parameters block */}
          {(card.durationFrom || card.durationTo || card.distanceKm || card.elevationGain || card.childFriendly != null || card.meetingPoint || card.cardType) && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Параметры</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(card.durationFrom || card.durationTo) && (
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                    <Clock className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Длительность</p>
                      <p className="text-sm font-medium">{formatDurationRange(card.durationFrom, card.durationTo)}</p>
                    </div>
                  </div>
                )}
                {card.distanceKm != null && (
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                    <Ruler className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Длина</p>
                      <p className="text-sm font-medium">{card.distanceKm} км</p>
                    </div>
                  </div>
                )}
                {card.elevationGain != null && (
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                    <TrendingUp className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Набор высоты</p>
                      <p className="text-sm font-medium">{card.elevationGain} м</p>
                    </div>
                  </div>
                )}
                {card.childFriendly != null && (
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                    <Baby className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Можно с детьми</p>
                      <p className="text-sm font-medium">{card.childFriendly ? 'Да' : 'Нет'}</p>
                    </div>
                  </div>
                )}
                {card.cardType && (
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3">
                    <CardTypeIcon icon={card.cardType.icon} className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Тип тура</p>
                      <p className="text-sm font-medium">{card.cardType.name}</p>
                    </div>
                  </div>
                )}
                {card.meetingPoint && (
                  <div className="flex items-start gap-3 rounded-xl border bg-muted/40 px-4 py-3 sm:col-span-2">
                    <Navigation className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Место встречи</p>
                      <p className="text-sm font-medium">{card.meetingPoint}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* For whom */}
          {card.forWhom && card.forWhom.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Для кого</h2>
              <ul className="space-y-2">
                {card.forWhom.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-0.5 text-primary shrink-0">👤</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expression Photos */}
          {card.expressions && card.expressions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Дополнительные фото</h2>
              <div className="grid grid-cols-2 gap-4">
                {card.expressions.map((photo, index) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden">
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

          {/* Guides */}
          {card.user?.guides && card.user.guides.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Гиды программы</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {card.user.guides.map((guide) => (
                  <div key={guide.id} className="flex gap-4 rounded-xl border bg-card p-4">
                    <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-muted bg-muted flex items-center justify-center">
                      {guide.photoUrl ? (
                        <img src={guide.photoUrl} alt={guide.name} className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">{guide.name}</p>
                      {guide.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-3">{guide.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — price, schedule, booking */}
        <div className="lg:col-span-1 order-first lg:order-none" id="booking-panel">
          <div className="sticky top-6 space-y-6 rounded-xl border bg-card p-4 md:p-6 shadow-sm">

            {/* Price */}
            <div>
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
                <p className="text-muted-foreground text-sm">за человека</p>
              )}
            </div>

            {/* Schedules */}
            {availableDates.length > 0 && (
              <div>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Выберите дату
                  {hasEarlyBookingOnly && (
                    <span className="ml-1 text-xs font-normal px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                      Раннее бронирование
                    </span>
                  )}
                </h2>
                {hasEarlyBookingOnly && (
                  <p className="text-sm text-muted-foreground mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    Ближайшие даты временно недоступны. Вы можете забронировать тур заранее на будущие даты.
                  </p>
                )}

                {/* Quick date selection */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {quickDateOptions.map((date) => {
                    const { label } = getDateLabel(date);
                    const isSelected = selectedDate === date;
                    const earlyBooking = isEarlyBooking(date);
                    return (
                      <button
                        key={date}
                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                        className={`p-2 rounded-lg border-2 transition text-center ${
                          isSelected
                            ? 'border-primary bg-primary/5 font-semibold'
                            : earlyBooking
                            ? 'border-amber-300 hover:border-amber-400 bg-amber-50/50'
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-medium">{earlyBooking ? formatDate(date) : label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
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
                    className="w-full mb-3"
                    onClick={() => {
                      if (!showCalendar) setCalendarMonthIndex(0);
                      setShowCalendar(!showCalendar);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {showCalendar ? 'Скрыть календарь' : 'Показать другие даты'}
                  </Button>
                )}

                {showCalendar && availableDates.length > 3 && (() => {
                  const months = groupDatesByMonth(availableDates);
                  const safeIdx = Math.min(calendarMonthIndex, months.length - 1);
                  const { month, dates: monthDates } = months[safeIdx];
                  const firstDate = new Date(monthDates[0]);
                  const year = firstDate.getFullYear();
                  const monthIdx = firstDate.getMonth();
                  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
                  const offset = (new Date(year, monthIdx, 1).getDay() + 6) % 7;
                  const availableSet = new Set(monthDates);
                  return (
                    <div className="mb-3 p-3 rounded-lg bg-muted/30">
                      {/* Month navigation */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => setCalendarMonthIndex((i) => Math.max(0, i - 1))}
                          disabled={safeIdx === 0}
                          className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold">{month}</span>
                        <button
                          onClick={() => setCalendarMonthIndex((i) => Math.min(months.length - 1, i + 1))}
                          disabled={safeIdx === months.length - 1}
                          className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Month counter */}
                      {months.length > 1 && (
                        <div className="flex justify-center gap-1 mb-3">
                          {months.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCalendarMonthIndex(i)}
                              className={`w-1.5 h-1.5 rounded-full transition ${
                                i === safeIdx ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                              }`}
                            />
                          ))}
                        </div>
                      )}

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
                                onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); setShowCalendar(false); }}
                                className={`py-1.5 rounded-md border text-xs font-medium transition ${
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
                            <div key={dateStr} className="py-1.5 text-xs text-muted-foreground/30">{day}</div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Time selection */}
                {selectedDate && timesForSelectedDate.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Выберите время</h3>
                    <div className="grid grid-cols-3 gap-2">
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
                            className={`p-2 rounded-lg border-2 transition text-center ${
                              isSelected
                                ? 'border-primary bg-primary/5 font-semibold'
                                : 'border-input hover:border-primary/50'
                            }`}
                          >
                            <div className="text-sm font-medium">{time}</div>
                            {slotPrice > 0 && (
                              <div className="text-xs text-muted-foreground mt-0.5">от {formatPrice(slotPrice)}</div>
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
          </div>
        </div>

      </div>
      </div>
    </div>

    {/* Mobile sticky bottom CTA */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="flex-1 min-w-0">
        {minPrice > 0 && (
          <div className="font-bold text-lg text-primary leading-none">от {formatPrice(minPrice)}</div>
        )}
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {selectedSlot ? `${formatDate(selectedSlot.date)}, ${selectedSlot.time}` : 'Выберите дату и время'}
        </div>
      </div>
      <Button
        size="lg"
        className="shrink-0 px-6"
        disabled={!selectedSlot}
        onClick={() => {
          if (selectedSlot) {
            navigate(`/booking/${card.id}?date=${selectedSlot.date}&time=${selectedSlot.time}`);
          } else {
            document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      >
        {selectedSlot ? 'Забронировать' : 'Выбрать дату'}
      </Button>
    </div>

    {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightboxIndex + 1} / {allImages.length}
          </div>

          {/* Prev */}
          {allImages.length > 1 && (
            <button
              onClick={lightboxPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Image */}
          <img
            src={allImages[lightboxIndex]}
            alt={`${card?.title} ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
            draggable={false}
          />

          {/* Next */}
          {allImages.length > 1 && (
            <button
              onClick={lightboxNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {/* Thumbnails strip */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-1">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setLightboxIndex(index)}
                  className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden transition ${
                    index === lightboxIndex
                      ? 'ring-2 ring-white opacity-100'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
