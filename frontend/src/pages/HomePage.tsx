import { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import {
  Mountain, Users, Shield, Upload,
  Star, ChevronRight, MapPin, Compass, Tent, Award, Clock
} from 'lucide-react';
import { metaApi, cardsApi } from '../lib/api';
import { formatPrice, formatDuration, getMinPriceFromTiers } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import type { CardFilterParams, Card as TourCard } from '../types';
import { WeatherWidget } from '../components/WeatherWidget';

const DEFAULT_HERO = '/img/photo-1464822759023-fed622ff2c3b.jpg';

const FEATURES = [
  {
    icon: Mountain,
    title: 'Только горы',
    desc: 'Пешие походы, треккинги и активные туры с проживанием. Красная Поляна — наш дом.',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: Award,
    title: 'Сертифицированные гиды',
    desc: 'Все маршруты ведут гиды с официальными допусками и знанием горной медицины.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Shield,
    title: 'Безопасная оплата',
    desc: 'Оплата через YooKassa. Гарантия возврата средств при отмене за 48 часов.',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    icon: Users,
    title: 'Группы и соло',
    desc: 'Сборные группы от 2 человек и частные туры под ваш запрос и график.',
    color: 'bg-violet-100 text-violet-700',
  },
];

const CATEGORIES = [
  {
    title: 'Однодневные походы',
    subtitle: 'Без ночёвки, от 1 500 ₽',
    image: '/img/photo_3_2026-05-16_11-46-11.jpg',
    badge: 'Популярно',
    slug: 'hiking',
  },
  {
    title: 'Многодневные треккинги',
    subtitle: 'С ночёвками в горах, от 6 000 ₽',
    image: '/img/photo_1_2026-05-16_11-46-11.jpg',
    badge: 'Топ сезон',
    slug: 'pohod',
  },
  {
    title: 'Туры с проживанием',
    subtitle: 'Отель + маршруты, от 12 000 ₽',
    image: '/img/photo_2_2026-05-16_11-46-11.jpg',
    badge: 'Комфорт',
    slug: 'tour-packages',
  },
];

const REVIEWS = [
  {
    name: 'Александр М.',
    date: 'Апрель 2025',
    text: 'Потрясающий поход на Аибгу! Гид Сергей знает каждый камень. Вернёмся обязательно.',
    rating: 5,
  },
  {
    name: 'Мария К.',
    date: 'Март 2025',
    text: 'Первый раз в горах — и сразу влюбилась. Организация на высшем уровне, безопасность не вызывает сомнений.',
    rating: 5,
  },
  {
    name: 'Дмитрий Н.',
    date: 'Февраль 2025',
    text: 'Заказывали тур с проживанием для компании 8 человек. Всё чётко, вкусно и красиво!',
    rating: 5,
  },
];

function getMinTourPrice(card: TourCard): number | null {
  if (!card.tickets || card.tickets.length === 0) return null;
  let minPrice: number | null = null;
  for (const ticket of card.tickets) {
    if (!ticket.prices || ticket.prices.length === 0) continue;
    for (const price of ticket.prices) {
      if ((price as any).isArchived) continue;
      const rawTiers = (price as any).groupTiers;
      const tiers = typeof rawTiers === 'string' ? JSON.parse(rawTiers) : Array.isArray(rawTiers) ? rawTiers : null;
      if (tiers && tiers.length > 0) {
        const tierMin = getMinPriceFromTiers(tiers);
        if (minPrice === null || tierMin < minPrice) minPrice = tierMin;
        continue;
      }
      const adultPrice = parseFloat(price.adultPrice);
      if (!isNaN(adultPrice) && adultPrice > 0 && (minPrice === null || adultPrice < minPrice)) minPrice = adultPrice;
    }
  }
  return minPrice;
}

function groupByType(cards: TourCard[]): Map<string, TourCard[]> {
  const groups = new Map<string, TourCard[]>();
  for (const card of cards) {
    const key = card.cardType?.slug ?? 'other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(card);
  }
  return new Map(
    [...groups.entries()].sort(([, a], [, b]) => {
      const orderA = a[0]?.cardType?.sortOrder ?? 999;
      const orderB = b[0]?.cardType?.sortOrder ?? 999;
      return orderA - orderB;
    })
  );
}

// ─── Смените цифру (1, 2 или 3) чтобы увидеть разный вариант Hero ───────────
const HERO_VARIANT = 2 as 1 | 2 | 3;
//   1 — Чистый: логотип только в хедере, обложка дышит
//   2 — Брендблок: лого 64px + название компании горизонтально
//   3 — Сплит: текст слева, лого-глоб справа (только desktop)
// ─────────────────────────────────────────────────────────────────────────────

function scrollToId(id: string, offset = 80) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === UserRole.ADMIN;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const location = useLocation();

  const [toursFilter] = useState<CardFilterParams>({ skip: 0, take: 100 });
  const { data: toursData, isLoading: toursLoading } = useQuery({
    queryKey: ['cards-home', toursFilter],
    queryFn: () => cardsApi.getCards(toursFilter),
  });

  useEffect(() => {
    if (location.hash === '#tours') {
      setTimeout(() => {
        scrollToId('tours');
      }, 100);
    }
  }, [location.hash]);

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: metaApi.getSiteSettings,
  });

  const heroCoverUrl = settings?.heroCoverUrl ?? DEFAULT_HERO;

  const heroButtons = (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button size="lg" className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white text-base px-8 py-3 h-auto shadow-xl shadow-emerald-900/40 border-0" onClick={() => scrollToId('tours')}>
        <Compass className="h-5 w-5 mr-2" />Выбрать поход
      </Button>
      <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/50 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm text-base px-8 py-3 h-auto" onClick={() => scrollToId('tours')}>
        <Tent className="h-5 w-5 mr-2" />Туры с проживанием
      </Button>
    </div>
  );

  const heroContent =
    HERO_VARIANT === 1 ? (
      /* ── Вариант 1: Чистый hero, лого убрано — обложка дышит ── */
      <div className="container relative z-10 py-24 md:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            Красная Поляна, Сочи
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Походы и треккинги<br />
            <span className="text-emerald-400">в горах Кавказа</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/85 mb-10 max-w-xl leading-relaxed">
            Однодневные прогулки, многодневные маршруты и туры с проживанием.<br />
            Опытные гиды, онлайн-бронирование, гарантия безопасности.
          </p>
          {heroButtons}
        </div>
      </div>
    ) : HERO_VARIANT === 2 ? (
      /* ── Вариант 2: Горизонтальный брендблок (лого + название рядом) ── */
      <div className="container relative z-10 py-24 md:py-32">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-10">
            <img src="/logo.png" alt="Сезон приключений" className="h-16 w-16 object-contain drop-shadow-xl flex-shrink-0" />
            <div className="border-l border-white/30 pl-4">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">Красная Поляна, Сочи</p>
              <p className="text-white font-bold text-xl leading-tight">Сезон<br />приключений</p>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Походы и треккинги<br />
            <span className="text-emerald-400">в горах Кавказа</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/85 mb-10 max-w-xl leading-relaxed">
            Однодневные прогулки, многодневные маршруты и туры с проживанием.<br />
            Опытные гиды, онлайн-бронирование, гарантия безопасности.
          </p>
          {heroButtons}
        </div>
      </div>
    ) : (
      /* ── Вариант 3: Сплит — текст слева, лого-глоб справа (desktop) ── */
      <div className="container relative z-10 py-24 md:py-32">
        <div className="flex items-center justify-between gap-8 lg:gap-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              Красная Поляна, Сочи
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Походы и треккинги<br />
              <span className="text-emerald-400">в горах Кавказа</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/85 mb-10 max-w-xl leading-relaxed">
              Однодневные прогулки, многодневные маршруты и туры с проживанием.<br />
              Опытные гиды, онлайн-бронирование, гарантия безопасности.
            </p>
            {heroButtons}
          </div>
          <div className="hidden lg:flex flex-shrink-0 items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-3xl scale-150" />
              <img src="/logo.png" alt="Сезон приключений" className="relative h-64 w-64 object-contain drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </div>
    );

  const uploadMutation = useMutation({
    mutationFn: (file: File) => metaApi.uploadHeroCover(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroCoverUrl})` }}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        {heroContent}

        {/* Admin cover upload */}
        {isAdmin && (
          <div className="absolute bottom-4 right-4 z-20">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button
              size="sm"
              variant="secondary"
              className="gap-2 shadow-lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="h-4 w-4" />
              {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить обложку'}
            </Button>
          </div>
        )}
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── 
      <section className="bg-emerald-700 text-white py-6">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-white">{s.value}</div>
                <div className="text-emerald-200 text-sm mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>*/}

      {/* ── CATEGORIES ───────────────────────────────────────────── */}
      <section className="py-20 bg-stone-50">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-emerald-600 text-sm font-semibold uppercase tracking-widest">Каталог</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-3">Выберите формат</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Маршруты на любой уровень подготовки — от лёгких прогулок до настоящих экспедиций
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.title}
                href={`#${cat.slug}`}
                onClick={(e) => { e.preventDefault(); if (!document.getElementById(cat.slug)) scrollToId('tours'); else scrollToId(cat.slug); }}
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              >
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${cat.image})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="relative p-6 h-64 flex flex-col justify-end">
                  <span className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">{cat.badge}</span>
                  <h3 className="text-white text-xl font-bold">{cat.title}</h3>
                  <p className="text-white/75 text-sm mt-1">{cat.subtitle}</p>
                  <div className="flex items-center gap-1 text-emerald-400 text-sm font-medium mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Смотреть маршруты <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOURS ────────────────────────────────────────────────── */}
      <section id="tours" className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-emerald-600 text-sm font-semibold uppercase tracking-widest">Все маршруты</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-3">Наши туры</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Выберите маршрут — от лёгких прогулок до крутых треккингов.
            </p>
          </div>

          {toursLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-stone-100 h-80" />
              ))}
            </div>
          ) : toursData?.data && toursData.data.length > 0 ? (
            <div className="space-y-14">
              {Array.from(groupByType(toursData.data)).map(([slug, cards]) => (
                <div key={slug} id={slug}>
                  <h3 className="text-xl font-bold mb-6 pb-2 border-b">
                    <a href={`#${slug}`} className="hover:text-emerald-600 transition-colors">
                      {cards[0]?.cardType?.name ?? 'Другие'}
                    </a>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => (
                      <Link key={card.id} to={`/tours/${card.id}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                          {card.headPhotoUrl ? (
                            <div className="h-48 overflow-hidden rounded-t-lg">
                              <img
                                src={card.headPhotoUrl}
                                alt={card.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="h-48 bg-muted rounded-t-lg flex items-center justify-center">
                              <MapPin className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="line-clamp-2">{card.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {card.shortDescription || card.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              {card.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{card.location.city || card.location.country}</span>
                                </div>
                              )}
                              {card.durationFrom && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatDuration(card.durationFrom)}</span>
                                </div>
                              )}
                              {card.maxParticipants && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>до {card.maxParticipants}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between items-center">
                            {(() => {
                              const minPrice = getMinTourPrice(card);
                              return minPrice !== null ? (
                                <div>
                                  <p className="text-sm text-muted-foreground">от</p>
                                  <p className="text-2xl font-bold">{formatPrice(minPrice.toString())}</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm text-muted-foreground">Цена</p>
                                  <p className="font-semibold">Уточняйте</p>
                                </div>
                              );
                            })()}
                            <Button variant="outline">Подробнее</Button>
                          </CardFooter>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Туры не найдены.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── WEATHER ──────────────────────────────────────────────── */}
      <WeatherWidget />

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-emerald-600 text-sm font-semibold uppercase tracking-widest">Преимущества</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-3">Почему выбирают нас</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Мы специализируемся только на горном туризме и делаем это с полной отдачей
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col items-start gap-4">
                <div className={`rounded-xl p-3.5 ${f.color}`}>
                  <f.icon className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────────────── */}
      <section className="py-20 bg-stone-50">
        <div className="container">
          <div className="text-center mb-12">
            <span className="text-emerald-600 text-sm font-semibold uppercase tracking-widest">Отзывы</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-3">Что говорят туристы</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r) => (
              <div key={r.name} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed mb-5">«{r.text}»</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{r.name}</div>
                    <div className="text-muted-foreground text-xs">{r.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/img/photo-1454496522488-7a8e488e8606.jpg)` }}
        />
        <div className="absolute inset-0 bg-emerald-900/80" />
        <div className="container relative z-10 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ваш следующий поход начинается здесь
            </h2>
            <p className="text-emerald-200 text-lg mb-10">
              Для новичков и опытных — подберите маршрут, забронируйте онлайн и идите в горы
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-amber-400 hover:bg-amber-500 text-stone-900 font-bold text-base px-8 py-3 h-auto border-0 shadow-xl shadow-black/30"
                onClick={() => scrollToId('tours')}
              >
                Все походы и маршруты
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white bg-white/10 hover:bg-white/20 text-base px-8 py-3 h-auto"
                onClick={() => scrollToId('tours')}
              >
                Туры с проживанием
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
