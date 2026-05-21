import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as LucideIcons from 'lucide-react';
import { MapPin, Clock, Calendar, ChevronLeft, ChevronRight, X, Check, Ruler, TrendingUp, Baby, Navigation, Star, Activity, BedDouble, RotateCcw, ShieldCheck } from 'lucide-react';
import CardTypeIcon from '../components/CardTypeIcon';
import { cardsApi, reviewsApi } from '../lib/api';
import { schedulesApi } from '../lib/api/accommodationsApi';
import { guidesApi } from '../lib/api/guides';
import { Button } from '../components/ui/button';
import { formatPrice, calcPrepayment, formatDate, formatDurationRange, formatDays, getMinPriceFromTiers, formatTierLabel } from '../lib/utils';
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
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
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
  
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
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

function getDifficultyLabel(difficulty?: string | null): string {
  switch (difficulty) {
    case 'EASY': return 'Простая';
    case 'MEDIUM': return 'Средняя';
    case 'ABOVE_MEDIUM': return 'Выше средней';
    default: return '';
  }
}

function renderDescriptionWithPullQuote(html: string, placeHistory?: string | null) {
  if (!placeHistory) {
    return <div className="text-foreground" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  let count = 0;
  let splitIndex = -1;
  let pos = 0;
  while (pos < html.length) {
    const idx = html.indexOf('</p>', pos);
    if (idx === -1) break;
    count++;
    if (count === 2) { splitIndex = idx + 4; break; }
    pos = idx + 4;
  }
  const before = splitIndex !== -1 ? html.slice(0, splitIndex) : html;
  const after = splitIndex !== -1 ? html.slice(splitIndex) : '';
  return (
    <>
      <div className="text-foreground" dangerouslySetInnerHTML={{ __html: before }} />
      <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">История места</p>
        <p className="text-base leading-relaxed text-foreground italic">{placeHistory}</p>
      </div>
      {after && <div className="text-foreground" dangerouslySetInnerHTML={{ __html: after }} />}
    </>
  );
}

function stripEmoji(str: string): string {
  return str.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '').replace(/\s{2,}/g, ' ').trim();
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
  const [showCalendar, setShowCalendar] = useState(true);
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(0);
  const [showDateError, setShowDateError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [accomLightboxIndex, setAccomLightboxIndex] = useState<number | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const { data: card, isLoading } = useQuery({
    queryKey: ['card', id],
    queryFn: () => cardsApi.getCard(id!),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewsApi.getForCard(id!),
    enabled: !!id,
  });

  const { data: allGuides = [] } = useQuery({
    queryKey: ['all-guides'],
    queryFn: () => guidesApi.getAllGuides(),
    staleTime: 5 * 60 * 1000,
  });

  // Load blocked dates from guide/accommodation calendars for current and next months
  const now = new Date();
  const { data: availableDatesCurrentMonth } = useQuery({
    queryKey: ['available-dates', id, now.getFullYear(), now.getMonth() + 1],
    queryFn: () => schedulesApi.getAvailableDates(id!, now.getFullYear(), now.getMonth() + 1),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const { data: availableDatesNextMonth } = useQuery({
    queryKey: ['available-dates', id, nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1],
    queryFn: () => schedulesApi.getAvailableDates(id!, nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const blockedDateSet = new Set<string>();
  for (const monthData of [availableDatesCurrentMonth, availableDatesNextMonth]) {
    if (monthData) {
      for (const day of monthData.days) {
        if (!day.available) blockedDateSet.add(day.date);
      }
    }
  }

  const validUrl = (url?: string | null) => (url && !url.startsWith('blob:') ? url : undefined);

  const allImages = [
    validUrl(card?.headPhotoUrl),
    ...(card?.slideshowPhotos || []).map((photo: any) => validUrl(photo.url)),
  ].filter((image): image is string => Boolean(image));

  const allThumbs = [
    validUrl(card?.headPhotoThumbUrl) ?? validUrl(card?.headPhotoUrl),
    ...(card?.slideshowPhotos || []).map((photo: any) => validUrl(photo.thumbUrl) ?? validUrl(photo.url)),
  ].filter((img): img is string => Boolean(img));

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

  // Auto-select time when only one option is available for the selected date
  useEffect(() => {
    if (!selectedDate || !card) return;
    const times = getTimesForDate(card.schedules?.[0], selectedDate);
    if (times.length === 1) {
      setSelectedSlot({ date: selectedDate, time: times[0] });
    }
  }, [selectedDate, card]);

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
  const availableDates = getAvailableDates(schedule).filter((d) => !blockedDateSet.has(d));
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
    {(card.heroType === 'no_cover' || card.noCover) ? (
      /* No-cover variant: simple page header */
      <div className="bg-background">
        <div className="container py-6 md:py-8">
          <div className="max-w-6xl mx-auto">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <Link to="/" className="hover:text-foreground transition">Главная</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <Link to="/tours" className="hover:text-foreground transition">Туры</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground truncate">{stripEmoji(card.title)}</span>
            </nav>
            <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">{stripEmoji(card.title)}</h1>
          </div>
        </div>
      </div>
    ) : card.heroType === 'perks' ? (
      /* ── Perks hero variant ── */
      (() => {
        const heroPerks = Array.isArray(card.heroPerks)
          ? (card.heroPerks as Array<{ icon: string; title: string; detail?: string }>)
          : [];
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / reviews.length
            : 0;
        return (
          <div className="bg-background py-6 md:py-10">
            <div className="container">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-sm mb-4 max-w-6xl mx-auto">
                <Link to="/" className="text-primary hover:underline transition">Главная</Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <Link to="/tours" className="text-primary hover:underline transition">Туры</Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="text-foreground truncate">{stripEmoji(card.title)}</span>
              </nav>
              <div className="max-w-6xl mx-auto overflow-hidden rounded-2xl shadow-lg border border-border md:grid md:grid-cols-[1fr_300px]">
                {/* ── Photo side ── */}
                <div className="relative min-h-[260px] md:min-h-[400px]">
                  {validUrl(card.headPhotoUrl) ? (
                    <img
                      src={validUrl(card.headPhotoUrl)!}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/22 to-black/76" />
                  {/* Badge top-left */}
                  {card.cardType && (
                    <span className="absolute top-3.5 left-3.5 bg-emerald-500/18 border border-emerald-400/40 text-emerald-300 text-[11px] font-medium uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
                      {card.cardType.name}
                    </span>
                  )}
                  {/* Title + subtitle + badges */}
                  <div className="absolute inset-0 flex flex-col justify-end md:justify-center px-4 pb-4 md:pb-0 md:px-6">
                    <h1 className="text-[26px] md:text-[38px] font-bold text-white leading-tight drop-shadow-lg mb-2">
                      {stripEmoji(card.title)}
                    </h1>
                    {card.shortDescription && (
                      <p className="text-sm md:text-base text-white/90 mb-3 leading-relaxed drop-shadow line-clamp-2">
                        {card.shortDescription}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <div className="hidden md:flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{locationLabel}</span>
                      </div>
                      {card.difficulty && (
                        <div className="hidden md:flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs">
                          <Activity className="h-3.5 w-3.5 shrink-0" />
                          <span>{getDifficultyLabel(card.difficulty)}</span>
                        </div>
                      )}
                      {card.distanceKm != null && (
                        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs">
                          <Ruler className="h-3.5 w-3.5 shrink-0" />
                          <span>{card.distanceKm} км</span>
                        </div>
                      )}
                      {(card.durationFrom || card.durationTo) && (
                        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>{formatDurationRange(card.durationFrom, card.durationTo)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Body panel ── */}
                <div className="bg-card flex flex-col justify-between p-[18px] md:p-[22px]">

                  {/* Perks list */}
                  {heroPerks.length > 0 && (
                    <ul className="mb-4">
                      {heroPerks.map((perk, idx) => {
                        const DynIcon = (LucideIcons as Record<string, any>)[perk.icon] as
                          | React.FC<React.SVGProps<SVGSVGElement>>
                          | undefined;
                        return (
                          <li
                            key={idx}
                            className="flex items-center gap-2.5 py-2.5 border-b border-border/70 last:border-b-0 text-sm text-foreground/80"
                          >
                            {DynIcon ? (
                              <DynIcon className="h-[18px] w-[18px] flex-shrink-0 stroke-emerald-600" />
                            ) : (
                              <Star className="h-[18px] w-[18px] flex-shrink-0 stroke-emerald-600" />
                            )}
                            <span className="flex-1">{perk.title}</span>
                            {perk.detail && (
                              <span className="text-xs text-muted-foreground shrink-0">{perk.detail}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Price row */}
                  {minPrice > 0 && (
                    <div className="flex items-end justify-between gap-2.5 py-3.5 border-y border-border/70 mb-3.5">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.7px] text-muted-foreground mb-1">
                          Стоимость тура
                        </div>
                        <div className="text-[30px] md:text-[32px] font-medium text-foreground leading-none mb-1">
                          {formatPrice(minPrice)}
                        </div>
                        <div className="text-xs text-emerald-600 mb-1">
                          Предоплата {formatPrice(calcPrepayment(minPrice))} · остаток на месте
                        </div>
                        {(card as any).postPaymentInfo && (
                          <div className="text-xs text-emerald-600 leading-tight">
                            {(card as any).postPaymentInfo}
                          </div>
                        )}
                      </div>
                      {quickDateOptions.length > 0 && (
                        <div className="bg-amber-50 text-amber-800 text-[11px] font-medium px-2.5 py-1.5 rounded-xl text-center leading-snug shrink-0 border border-amber-200">
                          Ближайшая<br />дата доступна
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <a
                    href="#booking-panel"
                    className="block w-full text-center rounded-[10px] bg-amber-500 hover:bg-amber-600 transition text-white font-medium text-[15px] py-[15px] mb-3"
                  >
                    Забронировать место →
                  </a>

                  {/* Trust row */}
                  <div className="flex justify-between flex-wrap gap-1">
                    {reviews.length > 0 && (
                      <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 stroke-yellow-400 flex-shrink-0" />
                        {avgRating.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                      <RotateCcw className="h-3.5 w-3.5 stroke-emerald-600 shrink-0" />
                      Гарантия возврата
                    </span>
                    <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 stroke-emerald-600 shrink-0" />
                      Сертифицированный гид
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      })()
    ) : (
      <>
    {/* Mobile: full-screen hero with centered overlay text */}
    <div className="md:hidden">
      <div className="relative w-full overflow-hidden bg-slate-900" style={{ height: 'calc(100dvh - 3rem)' }}>
        {validUrl(card.headPhotoUrl) ? (
          <img
            src={validUrl(card.headPhotoUrl)}
            alt={card.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
        )}

        {/* Breadcrumbs */}
        <nav className="absolute top-0 left-0 right-0 z-10 flex items-center gap-1.5 text-xs text-white px-4 pt-4 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
          <Link to="/" className="hover:underline transition shrink-0">Главная</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link to="/tours" className="hover:underline transition shrink-0">Туры</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-white/80 truncate">{stripEmoji(card.title)}</span>
        </nav>

        {/* Hero text */}
        <div className="absolute inset-0 flex flex-col items-start justify-center px-4">
          <h1 className="text-3xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
            {stripEmoji(card.title)}
          </h1>
          {card.shortDescription && (
            <p className="text-sm text-white/95 mb-6 leading-relaxed max-w-sm drop-shadow">
              {card.shortDescription}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{locationLabel}</span>
            </div>
            {card.difficulty && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs">
                <Activity className="h-3.5 w-3.5 shrink-0" />
                <span>{getDifficultyLabel(card.difficulty)}</span>
              </div>
            )}
            {card.distanceKm != null && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs">
                <Ruler className="h-3.5 w-3.5 shrink-0" />
                <span>{card.distanceKm} км</span>
              </div>
            )}
            {(card.durationFrom || card.durationTo) && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDurationRange(card.durationFrom, card.durationTo)}</span>
              </div>
            )}
            {card.durationDays != null && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDays(card.durationDays)}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('booking-panel');
              if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center justify-center rounded-full bg-yellow-400 text-black font-semibold text-sm px-8 py-3 shadow-lg hover:bg-yellow-300 transition"
          >
            {minPrice > 0 ? `Забронировать от ${formatPrice(minPrice)}` : 'Забронировать'}
          </button>
        </div>
      </div>
    </div>

    {/* Desktop: full overlay hero */}
    <div className="hidden md:block relative w-full overflow-hidden" style={{ height: 'calc(100dvh - 3rem)' }}>
      {validUrl(card.headPhotoUrl) ? (
        <img
          src={validUrl(card.headPhotoUrl)}
          alt={card.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}

      {/* Breadcrumbs */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 lg:px-8 pt-6">
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
            <Link to="/" className="hover:underline transition">Главная</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link to="/tours" className="hover:underline transition">Туры</Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="text-white/80 font-medium truncate">{stripEmoji(card.title)}</span>
          </nav>
        </div>
      </div>

      {/* Hero text */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
            {stripEmoji(card.title)}
          </h1>
          {card.shortDescription && (
            <p className="text-lg md:text-xl text-white/95 max-w-2xl mb-7 leading-relaxed drop-shadow">
              {card.shortDescription}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-sm">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{locationLabel}</span>
            </div>
            {card.difficulty && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-sm">
                <Activity className="h-4 w-4 shrink-0" />
                <span>{getDifficultyLabel(card.difficulty)}</span>
              </div>
            )}
            {card.distanceKm != null && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-sm">
                <Ruler className="h-4 w-4 shrink-0" />
                <span>{card.distanceKm} км</span>
              </div>
            )}
            {(card.durationFrom || card.durationTo) && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-sm">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{formatDurationRange(card.durationFrom, card.durationTo)}</span>
              </div>
            )}
            {card.durationDays != null && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-sm">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{formatDays(card.durationDays)}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('booking-panel');
              if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center justify-center rounded-full bg-yellow-400 text-black font-bold text-base px-10 py-3.5 shadow-xl hover:bg-yellow-300 transition"
          >
            {minPrice > 0 ? `Забронировать от ${formatPrice(minPrice)}` : 'Забронировать'}
          </button>
        </div>
        </div>
      </div>
    </div>
      </>
    )}

    <div className="container py-6 md:py-12 pb-24 lg:pb-12">
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
                <img src={allImages[0]} alt={card.title} className="w-full h-full object-cover group-hover:brightness-90 transition" loading="eager" decoding="async" />
              </button>
            )}

            {allImages.length === 2 && (
              <div className="grid grid-cols-2 gap-2 h-[460px]">
                {allImages.map((img, i) => (
                  <button key={i} className="group overflow-hidden rounded-none first:rounded-l-2xl last:rounded-r-2xl" onClick={() => openLightbox(i)}>
                    <img src={i === 0 ? img : (allThumbs[i] || img)} alt={`${card.title} ${i + 1}`} className="w-full h-full object-cover group-hover:brightness-90 transition" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
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
                  <img src={allImages[0]} alt={card.title} className="w-full h-full object-cover group-hover:brightness-90 transition duration-300" loading="eager" decoding="async" />
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
                        src={allThumbs[pos] || img}
                        alt={`${card.title} ${pos + 1}`}
                        className="w-full h-full object-cover group-hover:brightness-90 transition duration-300"
                        loading="lazy"
                        decoding="async"
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
                <img src={index === 0 ? image : (allThumbs[index] || image)} alt={`${card.title} ${index + 1}`} className="w-full h-full object-cover" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
              </button>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* noCover: badges row under photo gallery */}
      {(card.heroType === 'no_cover' || card.noCover) && (card.location || card.difficulty || card.distanceKm != null || card.durationFrom || card.durationTo) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {card.location && (
            <div className="flex items-center gap-1.5 bg-muted border border-border text-foreground px-3 py-1.5 rounded-full text-sm">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{locationLabel}</span>
            </div>
          )}
          {card.difficulty && (
            <div className="flex items-center gap-1.5 bg-muted border border-border text-foreground px-3 py-1.5 rounded-full text-sm">
              <Activity className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{getDifficultyLabel(card.difficulty)}</span>
            </div>
          )}
          {card.distanceKm != null && (
            <div className="flex items-center gap-1.5 bg-muted border border-border text-foreground px-3 py-1.5 rounded-full text-sm">
              <Ruler className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{card.distanceKm} км</span>
            </div>
          )}
          {(card.durationFrom || card.durationTo) && (
            <div className="flex items-center gap-1.5 bg-muted border border-border text-foreground px-3 py-1.5 rounded-full text-sm">
              <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{formatDurationRange(card.durationFrom, card.durationTo)}</span>
            </div>
          )}
          {card.durationDays != null && (
            <div className="flex items-center gap-1.5 bg-muted border border-border text-foreground px-3 py-1.5 rounded-full text-sm">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{formatDays(card.durationDays)}</span>
            </div>
          )}
        </div>
      )}

      
      {/* Two-column content */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-10 items-start">

        {/* LEFT — description, meta, expression photos */}
        <div className="lg:col-span-2 space-y-8">

      {(card.heroType === 'no_cover' || card.noCover) && card.shortDescription && (
        <div className="mb-10 max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 shadow-sm">
          <p className="text-base md:text-lg font-medium text-foreground leading-relaxed">{card.shortDescription}</p>
        </div>
      )}

          {/* For whom */}
          {card.forWhom && card.forWhom.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Для кого</h2>
              <ul className="space-y-2">
                {card.forWhom.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-3">Описание</h2>
            {renderDescriptionWithPullQuote(card.description, card.placeHistory)}
          </div>

          {/* Tour Program by days */}
          {card.tourProgram && Array.isArray(card.tourProgram) && card.tourProgram.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Программа тура</h2>
              <div className="space-y-0 rounded-xl border border-border overflow-hidden">
                {(card.tourProgram as Array<{ title: string; description: string }>).map((day, index) => (
                  <div
                    key={index}
                    className="flex gap-0 border-b border-border last:border-b-0"
                  >
                    {/* Day badge */}
                    <div className="flex flex-col items-center shrink-0 w-14 bg-primary/5 border-r border-border px-2 py-4">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide leading-none">День</span>
                      <span className="text-2xl font-bold text-primary mt-1 leading-none">{index + 1}</span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 px-4 py-4">
                      <p className="font-semibold text-foreground text-sm md:text-base leading-snug mb-1">
                        {day.title}
                      </p>
                      {day.description && (
                        <p className="text-sm text-foreground leading-relaxed">{day.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accommodation */}
          {card.cardAccommodations && card.cardAccommodations.length > 0 && (
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 bg-primary/5 border-b border-border px-5 py-4">
                <BedDouble className="h-5 w-5 text-primary shrink-0" />
                <h2 className="text-lg font-semibold">Проживание</h2>
              </div>
              <div className="px-5 py-5 space-y-8">
                {card.cardAccommodations.map((ca, accIdx) => {
                  const acc = ca.accommodation;
                  if (!acc) return null;
                  const photoOffset = card.cardAccommodations!.slice(0, accIdx).reduce(
                    (sum, c) => sum + (c.accommodation?.photos?.length ?? 0), 0
                  );
                  const typeLabels: Record<string, string> = {
                    HOTEL: 'Гостиница', HOSTEL: 'Хостел', GUESTHOUSE: 'Гостевой дом',
                    APARTMENT: 'Апартаменты', CAMPING: 'Кемпинг', OTHER: 'Другое',
                  };
                  const avgRating = acc.reviews?.length
                    ? acc.reviews.reduce((s, r) => s + r.rating, 0) / acc.reviews.length
                    : null;
                  return (
                    <div key={ca.accommodationId} className="space-y-4">
                      {/* Header */}
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base">{acc.name}</h3>
                            <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 shrink-0">
                              {typeLabels[acc.type] ?? acc.type}
                            </span>
                            {avgRating !== null && (
                              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                {avgRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          {acc.address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {acc.address}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {acc.description && (
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{acc.description}</p>
                      )}

                      {/* Photos */}
                      {acc.photos && acc.photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {acc.photos.map((photo, index) => (
                            <div
                              key={photo.id}
                              className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer"
                              onClick={() => setAccomLightboxIndex(photoOffset + index)}
                            >
                              <img
                                src={photo.thumbUrl || photo.url}
                                alt={`${acc.name} ${index + 1}`}
                                className="h-full w-full object-cover hover:scale-105 transition duration-300"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reviews */}
                      {acc.reviews && acc.reviews.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">Отзывы об объекте</p>
                          {acc.reviews.slice(0, 3).map((review) => (
                            <div key={review.id} className="bg-muted/40 rounded-xl px-4 py-3 space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-medium">{review.authorName}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {new Date(review.createdAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              {review.title && <p className="text-xs font-medium">{review.title}</p>}
                              <p className="text-sm text-foreground/80 leading-relaxed">{review.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Included / Not Included */}
          {((card.includedItems && card.includedItems.length > 0) || (card.notIncludedItems && card.notIncludedItems.length > 0)) && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Что включено</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {card.includedItems && card.includedItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Включено</p>
                    <ul className="space-y-1.5">
                      {card.includedItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                          <Check className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {card.notIncludedItems && card.notIncludedItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Не включено</p>
                    <ul className="space-y-1.5">
                      {card.notIncludedItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                          <X className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parameters block */}
          {(card.elevationGain || card.childFriendly != null || card.meetingPoint || card.cardType) && (
            <div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {card.elevationGain != null && (
                  <div className="flex min-h-[148px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/30 px-4 py-5 text-center">
                    <TrendingUp className="h-6 w-6 shrink-0 text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Набор высоты</p>
                    <p className="mt-1 text-sm font-semibold leading-snug">{card.elevationGain} м</p>
                  </div>
                )}
                {card.childFriendly != null && (
                  <div className="flex min-h-[148px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/30 px-4 py-5 text-center">
                    <Baby className="h-6 w-6 shrink-0 text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Можно с детьми</p>
                    <p className="mt-1 text-sm font-semibold leading-snug">{card.childFriendly ? 'Да' : 'Нет'}</p>
                  </div>
                )}
                {card.cardType && (
                  <div className="flex min-h-[148px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/30 px-4 py-5 text-center">
                    <CardTypeIcon icon={card.cardType.icon} className="h-6 w-6 shrink-0 text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Тип тура</p>
                    <p className="mt-1 text-sm font-semibold leading-snug">{card.cardType.name}</p>
                  </div>
                )}
                {card.meetingPoint && (
                  <div className="flex min-h-[148px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/30 px-4 py-5 text-center sm:col-span-2 lg:col-span-2 xl:col-span-1">
                    <Navigation className="h-6 w-6 shrink-0 text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">Место встречи</p>
                    <p className="mt-1 text-sm font-semibold leading-snug">{card.meetingPoint}</p>
                  </div>
                )}
              </div>
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
                      src={photo.thumbUrl || photo.photoUrl}
                      alt={`Expression ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guides */}
          {allGuides.length > 0 && (
            <div className="space-y-3">
              {allGuides.map((guide) => (
                <div
                  key={guide.id}
                  className="rounded-2xl overflow-hidden bg-white"
                  style={{ border: '1px solid rgba(0,0,0,0.09)' }}
                >
                  {/* Заголовок карточки */}
                  <div
                    className="flex items-center gap-2.5 px-4 py-3"
                    style={{ background: '#f9f8f5', borderBottom: '1px solid rgba(0,0,0,0.07)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span className="text-[13px] font-medium" style={{ color: '#1a1a18' }}>Гид программы</span>
                  </div>

                  {/* Фото + имя */}
                  <div
                    className="flex items-center gap-3.5 px-4 py-4"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
                  >
                    <div className="shrink-0">
                      {guide.photoUrl ? (
                        <img
                          src={guide.photoUrl}
                          alt={guide.name}
                          loading="lazy"
                          className="rounded-full object-cover"
                          style={{ width: 64, height: 64, border: '2px solid rgba(0,0,0,0.08)' }}
                        />
                      ) : (
                        <div
                          className="rounded-full flex items-center justify-center text-xl font-semibold"
                          style={{ width: 64, height: 64, background: '#e8f5ef', color: '#085041' }}
                        >
                          {guide.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium" style={{ color: '#1a1a18' }}>{guide.name}</div>
                      <div className="text-xs mt-0.5 leading-snug" style={{ color: '#6b6b65' }}>Гид тура</div>
                    </div>
                  </div>

                  {/* Биография / описание */}
                  {guide.description && (
                    <div
                      className="mx-4 my-3.5 px-3.5 py-3 text-[13px]"
                      style={{
                        background: '#f5faf8',
                        borderLeft: '2px solid #1D9E75',
                        borderRadius: '0 8px 8px 0',
                        color: '#4a4a45',
                        lineHeight: 1.65,
                      }}
                    >
                      {guide.description}
                    </div>
                  )}

                  {/* Квалификации */}
                  {guide.certifications && (
                    <div
                      className="flex items-center gap-2 px-4 py-3"
                      style={{ borderTop: '1px solid rgba(0,0,0,0.07)', fontSize: 12, color: '#6b6b65' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
                      </svg>
                      {guide.certifications}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* FAQ */}
          {(() => {
            const faqs = [
              {
                q: 'Нужна ли специальная физическая подготовка?',
                a: 'Базовый уровень физической активности достаточен для большинства наших туров. Сложность конкретного маршрута указана в описании (уровень подготовки и набор высоты). Если у вас есть сомнения — уточните у гида перед бронированием.',
              },
              {
                q: 'Что нужно взять с собой из снаряжения?',
                a: 'Список необходимого снаряжения зависит от тура. Как правило, достаточно удобной одежды по погоде, трекинговой обуви и воды. Специализированное снаряжение (каски, страховки и пр.) предоставляется гидом — это указано в блоке «Включено».',
              },
              {
                q: 'Что будет, если погода испортится?',
                a: 'Мы следим за прогнозом и уведомляем вас заранее. При опасных погодных условиях тур переносится на ближайшую доступную дату или предоставляется полный возврат средств — по вашему выбору.',
              },
              {
                q: 'Можно ли ехать с детьми?',
                a: 'Возможность участия с детьми указана в параметрах тура. Если тур помечен как «Можно с детьми» — минимальный возраст и ограничения уточняются у гида. Для детей действуют специальные цены.',
              },
              {
                q: 'Как отменить или перенести бронирование?',
                a: 'Вы можете отменить бронирование в любое время до начала тура и получить полный возврат без каких-либо условий. Перенос на другую дату также возможен — просто свяжитесь с нами через форму обратной связи или по телефону.',
              },
            ];
            return (
              <div>
                <h2 className="text-xl font-semibold mb-4">Частые вопросы</h2>
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {faqs.map((item, idx) => (
                    <div key={idx}>
                      <button
                        onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                        aria-expanded={faqOpen === idx}
                      >
                        <span className="font-medium text-sm md:text-base">{item.q}</span>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                            faqOpen === idx ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      {faqOpen === idx && (
                        <div className="px-5 pb-4 text-sm text-foreground leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Отзывы</h2>
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex gap-4 rounded-2xl border bg-card p-5">
                    {/* Photo */}
                    <div className="h-14 w-14 shrink-0 rounded-full overflow-hidden bg-muted border flex items-center justify-center">
                      {review.authorPhoto ? (
                        <img src={review.authorPhoto} alt={review.authorName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-muted-foreground">
                          {review.authorName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Callout */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm">{review.authorName}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.title && (
                        <p className="font-medium text-sm mb-1">{review.title}</p>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — price, schedule, booking */}
        <div className="lg:col-span-1 lg:self-start" id="booking-panel">
          <div className="space-y-6 rounded-xl border bg-card p-4 md:p-6 shadow-sm lg:sticky lg:top-16">

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
              {minPrice > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  Предоплата {formatPrice(calcPrepayment(minPrice))} · остаток на месте
                </p>
              )}
            </div>

            {/* Schedules */}
            {availableDates.length > 0 && (
              <div id="date-section">
                <h2 className={`text-base font-semibold mb-3 flex items-center gap-2 ${showDateError ? 'text-destructive' : ''}`}>
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
                {showDateError && (
                  <p className="text-sm text-destructive mb-3 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Пожалуйста, выберите дату для бронирования
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
                        onClick={() => { setSelectedDate(date); setSelectedSlot(null); setShowDateError(false); }}
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
                                onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); setShowDateError(false); }}
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
              className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold"
              onClick={() => {
                if (selectedSlot) {
                  navigate(`/booking/${card.id}?date=${selectedSlot.date}&time=${selectedSlot.time}`);
                } else if (selectedDate && timesForSelectedDate.length === 0) {
                  navigate(`/booking/${card.id}?date=${selectedDate}`);
                } else {
                  if (!selectedDate) {
                    setShowDateError(true);
                    setShowCalendar(true);
                  }
                  const el = document.getElementById('date-section');
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top, behavior: 'smooth' });
                  }
                }
              }}
            >
              {selectedSlot || (selectedDate && timesForSelectedDate.length === 0) ? 'Забронировать' : 'Забронировать место'}
            </Button>

            {/* Payment & refund conditions */}
            <div className="mt-3 rounded-lg bg-muted/40 border border-border/60 px-4 py-3 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Предоплата <strong className="text-foreground">20%</strong> при бронировании, остаток — на месте</span>
              </div>
              <div className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.49-5.49"/>
                </svg>
                <span>Гарантия полного возврата предоплаты при отмене за 48 часов — без условий</span>
              </div>
              <div className="flex items-start gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                <span>ИП Навакус Антон Борисович · ИНН 665908836379 · Оплата через ЮKassa</span>
              </div>
            </div>

            {/* After booking steps */}
            <div className="mt-3 rounded-lg border border-border/60 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/60">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-xs font-medium text-foreground">Что происходит после бронирования</span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-0">
                {[
                  {
                    title: 'Получаете подтверждение',
                    desc: 'Письмо на почту с деталями тура и контактами.',
                  },
                  {
                    title: 'Гид связывается с вами',
                    desc: 'За 2–3 дня до заезда — подбирает маршрут, отвечает на вопросы.',
                  },
                  {
                    title: 'Заезд',
                    desc: 'Отправляем инструкцию по самостоятельному заселению. Студия и ключи ждут вас.',
                  },
                  {
                    title: 'Поход и остаток оплаты',
                    desc: 'Встречаемся на следующий день и идём в поход! Остаток 80% — наличными или переводом после заселения.',
                  },
                ].map((step, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-[#e8f5ef] text-[#085041] text-[10px] font-medium flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="w-px flex-1 bg-border/60 my-1 min-h-[10px]" />
                      )}
                    </div>
                    <div className={i < arr.length - 1 ? 'pb-3 flex-1' : 'flex-1'}>
                      <div className="text-xs font-medium text-foreground leading-snug">{step.title}</div>
                      <div className="text-[11.5px] text-muted-foreground leading-relaxed mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
      </div>
    </div>

    {/* Mobile sticky bottom CTA */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t px-4 py-3 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="flex-1 min-w-0">
        {minPrice > 0 && (
          <>
            <div className="font-bold text-lg text-primary leading-none">от {formatPrice(minPrice)}</div>
            <div className="text-[10px] text-emerald-600 leading-none mt-0.5">предоплата {formatPrice(calcPrepayment(minPrice))}</div>
          </>
        )}
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {selectedSlot ? `${formatDate(selectedSlot.date)}, ${selectedSlot.time}` : 'Выберите дату и время'}
        </div>
      </div>
      <Button
        size="lg"
        className="shrink-0 px-6 bg-amber-500 hover:bg-amber-400 text-white font-semibold"
        onClick={() => {
          if (selectedSlot) {
            navigate(`/booking/${card.id}?date=${selectedSlot.date}&time=${selectedSlot.time}`);
          } else {
            const el = document.getElementById('booking-panel');
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top, behavior: 'smooth' });
            }
          }
        }}
      >
        {selectedSlot ? 'Забронировать' : 'Забронировать место'}
      </Button>
    </div>

    {/* Accommodation Lightbox */}
      {(() => {
        const accomPhotos = card.cardAccommodations?.flatMap((ca) => ca.accommodation?.photos ?? []) ?? [];
        if (accomLightboxIndex === null || accomPhotos.length === 0) return null;
        return (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setAccomLightboxIndex(null)}
          >
            <button
              onClick={() => setAccomLightboxIndex(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {accomLightboxIndex + 1} / {accomPhotos.length}
            </div>
            {accomLightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setAccomLightboxIndex(accomLightboxIndex - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}
            <img
              src={accomPhotos[accomLightboxIndex].url}
              alt={`Проживание ${accomLightboxIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain select-none"
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
            {accomLightboxIndex < accomPhotos.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setAccomLightboxIndex(accomLightboxIndex + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-1">
              {accomPhotos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={(e) => { e.stopPropagation(); setAccomLightboxIndex(i); }}
                  className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden transition ${
                    i === accomLightboxIndex ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
        </div>
        );
      })()}

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
