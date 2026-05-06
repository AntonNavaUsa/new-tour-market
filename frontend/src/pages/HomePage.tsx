import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import {
  Mountain, Users, Shield, Upload,
  Star, ChevronRight, MapPin, Compass, Tent, Award
} from 'lucide-react';
import { metaApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

const DEFAULT_HERO = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85';

const STATS = [
  { value: '50+', label: 'маршрутов' },
  { value: '8', label: 'опытных гидов' },
  { value: '3000+', label: 'довольных туристов' },
  { value: '5★', label: 'средняя оценка' },
];

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
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
    link: '/tours',
    badge: 'Популярно',
  },
  {
    title: 'Многодневные треккинги',
    subtitle: 'С ночёвками в горах, от 6 000 ₽',
    image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80',
    link: '/tours',
    badge: 'Топ сезон',
  },
  {
    title: 'Туры с проживанием',
    subtitle: 'Отель + маршруты, от 12 000 ₽',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    link: '/tour-packages',
    badge: 'Комфорт',
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

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === UserRole.ADMIN;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: metaApi.getSiteSettings,
  });

  const heroCoverUrl = settings?.heroCoverUrl ?? DEFAULT_HERO;

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

        <div className="container relative z-10 py-24 md:py-32">
          <div className="max-w-3xl">
            {/* Location badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              Красная Поляна, Сочи
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
              Походы и треккинги<br />
              <span className="text-emerald-400">в горах Кавказа</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/85 mb-10 max-w-xl leading-relaxed">
              Однодневные прогулки, многодневные маршруты и туры с проживанием.
              Опытные гиды, онлайн-бронирование, гарантия безопасности.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/tours">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white text-base px-8 py-3 h-auto shadow-xl shadow-emerald-900/40 border-0"
                >
                  <Compass className="h-5 w-5 mr-2" />
                  Выбрать поход
                </Button>
              </Link>
              <Link to="/tour-packages">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/50 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm text-base px-8 py-3 h-auto"
                >
                  <Tent className="h-5 w-5 mr-2" />
                  Туры с проживанием
                </Button>
              </Link>
            </div>
          </div>
        </div>

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

      {/* ── STATS BAR ────────────────────────────────────────────── */}
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
      </section>

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
              <Link key={cat.title} to={cat.link} className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
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
              </Link>
            ))}
          </div>
        </div>
      </section>

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
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&q=80)` }}
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
              <Link to="/tours">
                <Button
                  size="lg"
                  className="bg-amber-400 hover:bg-amber-500 text-stone-900 font-bold text-base px-8 py-3 h-auto border-0 shadow-xl shadow-black/30"
                >
                  Все походы и маршруты
                </Button>
              </Link>
              <Link to="/tour-packages">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white bg-white/10 hover:bg-white/20 text-base px-8 py-3 h-auto"
                >
                  Туры с проживанием
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
