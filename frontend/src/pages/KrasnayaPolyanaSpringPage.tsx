import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, X, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Button } from '../components/ui/button';

// ──────────────────────────────────────────────
// JSON-LD structured data helpers
// ──────────────────────────────────────────────
function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint: dangerouslySetInnerHTML is intentional for SEO JSON-LD
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ──────────────────────────────────────────────
// Data
// ──────────────────────────────────────────────
interface Activity {
  name: string;
  price: string;
  link: string;
}

interface Location {
  id: string;
  title: string;
  description: string;
  howToGet: string;
  image: string;
  gallery: string[];
  status: string;
  statusColor: string;
  activity?: Activity;
}

const locations: Location[] = [
  {
    id: 'naberezhnye-mzymty',
    title: 'Набережные Мзымты (Роза Хутор и Эсто-Садок)',
    description:
      'Променад вдоль бурлящей реки. Весной здесь зацветает магнолия и черешня, а воздух наполняется ароматом цветущих садов. Отличное место для утренних прогулок и вечерних посиделок у воды.',
    howToGet:
      'Пешком или на велосипеде вдоль берега. Электробусы курсируют от автостанции Эсто-Садок.',
    image: '/img/photo-1506905925346-21bda4d32df4.jpg',
    gallery: [
      '/img/photo-1506905925346-21bda4d32df4.jpg',
      '/img/photo-1506905925346-21bda4d32df4.jpg',
      '/img/photo-1454496522488-7a8e488e8606.jpg',
    ],
    status: 'Доступно сейчас',
    statusColor: 'text-green-700 bg-green-50',
    activity: { name: 'Аренда электровелосипеда', price: 'от 600 ₽/ч', link: '/tours' },
  },
  {
    id: 'krugozor-efremova',
    title: 'Кругозор Ефремова',
    description:
      'Лучшая панорамная точка для пикника с видом на всю долину и заснеженные вершины. Подъем занимает 30–40 минут по тропе через реликтовый лес.',
    howToGet:
      'Трейл начинается у серебряной стелы в парке «Южные культуры». GPS: 43.6789, 40.3204.',
    image: '/img/photo-1464822759023-fed622ff2c3b.jpg',
    gallery: [
      '/img/photo-1464822759023-fed622ff2c3b.jpg',
      '/img/photo-1464822759023-fed622ff2c3b.jpg',
      '/img/photo-1454496522488-7a8e488e8606.jpg',
    ],
    status: 'Доступно сейчас',
    statusColor: 'text-green-700 bg-green-50',
    activity: { name: 'Фото-тур с местным гидом', price: 'от 2 500 ₽', link: '/tours' },
  },
  {
    id: 'vodopad-keyva',
    title: 'Водопад Кейва',
    description:
      'Самый полноводный водопад Красной Поляны именно весной. Маршрут проходит в тени деревьев мимо мхов и папоротников — доступен даже новичкам.',
    howToGet:
      'Маршрут стартует от поворота на ул. Горная. Парковка у кафе «Лесная».',
    image: '/img/photo-1551632811-561732d1e306.jpg',
    gallery: [
      '/img/photo-1551632811-561732d1e306.jpg',
      '/img/photo-1454496522488-7a8e488e8606.jpg',
      '/img/photo-1506905925346-21bda4d32df4.jpg',
    ],
    status: 'Пик полноводия',
    statusColor: 'text-blue-700 bg-blue-50',
    activity: { name: 'Пеший поход (3 часа)', price: 'от 2 000 ₽', link: '/tours' },
  },
  {
    id: 'park-alpak',
    title: 'Парк Альпак «Пача Мама»',
    description:
      'Обаятельные альпаки на высоте 1100 м. Весной животные особенно активны — можно кормить, гладить и делать невероятные фото на фоне белеющих вершин.',
    howToGet:
      'Маршрутное такси № 6 до остановки «Горная Олимпийская деревня», далее 300 м пешком.',
    image: '/img/photo-1483728642387-6c3bdd6c93e5.jpg',
    gallery: [
      '/img/photo-1483728642387-6c3bdd6c93e5.jpg',
      '/img/photo-1483728642387-6c3bdd6c93e5.jpg',
      '/img/photo-1506905925346-21bda4d32df4.jpg',
    ],
    status: 'Открыто',
    statusColor: 'text-green-700 bg-green-50',
    activity: { name: 'Билеты в парк + трансфер', price: 'от 1 800 ₽', link: '/tours' },
  },
  {
    id: 'volierny-kompleks-laura',
    title: 'Вольерный комплекс «Лаура»',
    description:
      'Понаблюдайте за зубрами и кавказскими леопардами в их естественной среде обитания. Весной в вольерах появляется молодняк — особенно трогательное зрелище.',
    howToGet:
      'На автомобиле или такси до санатория «Лаура». Бесплатная парковка на территории.',
    image: '/img/photo-1551632811-561732d1e306.jpg',
    gallery: [
      '/img/photo-1551632811-561732d1e306.jpg',
      '/img/photo-1454496522488-7a8e488e8606.jpg',
      '/img/photo-1551632811-561732d1e306.jpg',
    ],
    status: 'Открыто',
    statusColor: 'text-green-700 bg-green-50',
  },
  {
    id: 'dolmeny',
    title: 'Дольмены Красной Поляны',
    description:
      'Древние мегалиты — место силы в лесной тишине. Возраст некоторых камней превышает 4000 лет. Весной тропа к ним особенно живописна.',
    howToGet:
      'От поселка Медовеевка по грунтовой дороге 2 км. Удобнее всего на внедорожнике или пешком.',
    image: '/img/photo-1454496522488-7a8e488e8606.jpg',
    gallery: [
      '/img/photo-1454496522488-7a8e488e8606.jpg',
      '/img/photo-1551632811-561732d1e306.jpg',
      '/img/photo-1464822759023-fed622ff2c3b.jpg',
    ],
    status: 'Доступно сейчас',
    statusColor: 'text-green-700 bg-green-50',
    activity: { name: 'Конная прогулка к дольменам', price: 'от 3 500 ₽', link: '/tours' },
  },
  {
    id: 'terrenkury',
    title: 'Терренкуры (Тропы здоровья)',
    description:
      'Оборудованные дорожки в лесу с мягким набором высоты и скамейками через каждые 500 м. Идеально для тех, кто хочет насладиться природой без лишней нагрузки.',
    howToGet:
      'Вход на терренкур № 1 — у санатория «Красная Поляна», вход на № 2 — от ул. Заповедная.',
    image: '/img/photo-1551632811-561732d1e306.jpg',
    gallery: [
      '/img/photo-1551632811-561732d1e306.jpg',
      '/img/photo-1506905925346-21bda4d32df4.jpg',
      '/img/photo-1454496522488-7a8e488e8606.jpg',
    ],
    status: 'Доступно сейчас',
    statusColor: 'text-green-700 bg-green-50',
  },
];

// ──────────────────────────────────────────────
// Lightbox component
// ──────────────────────────────────────────────
interface LightboxProps {
  images: string[];
  startIndex: number;
  title: string;
  onClose: () => void;
}

function Lightbox({ images, startIndex, title, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Галерея: ${title}`}
    >
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X className="w-7 h-7" />
      </button>

      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
        onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + images.length) % images.length); }}
        aria-label="Предыдущее фото"
      >
        <ChevronLeft className="w-9 h-9" />
      </button>

      <img
        src={images[current]}
        alt={`${title} — фото ${current + 1}`}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
        onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % images.length); }}
        aria-label="Следующее фото"
      >
        <ChevronRightIcon className="w-9 h-9" />
      </button>

      <div className="absolute bottom-4 text-white/60 text-sm">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Location Card component (GetYourGuide style)
// ──────────────────────────────────────────────
interface LocationCardProps {
  location: Location;
  index: number;
}

function LocationCard({ location, index }: LocationCardProps) {
  const [lightbox, setLightbox] = useState<{ open: boolean; index: number }>({ open: false, index: 0 });
  const cardRef = useRef<HTMLElement>(null);

  // Structured data for each activity (Product schema)
  const productJsonLd = location.activity
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: location.activity.name,
        description: location.description,
        offers: {
          '@type': 'Offer',
          price: location.activity.price.replace(/[^\d]/g, ''),
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
          url: `https://seasonadventures.ru${location.activity.link}`,
        },
      }
    : null;

  return (
    <article
      ref={cardRef}
      id={location.id}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col scroll-mt-24"
    >
      {productJsonLd && <JsonLd data={productJsonLd} />}

      {/* Image with gallery trigger */}
      <figure className="relative h-56 cursor-pointer group" onClick={() => setLightbox({ open: true, index: 0 })}>
        <img
          src={location.image}
          alt={`${location.title} — Красная Поляна весна`}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading={index < 2 ? 'eager' : 'lazy'}
          decoding="async"
          width={800}
          height={448}
        />
        {/* Status badge */}
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm bg-white/85 ${location.statusColor}`}>
          {location.status}
        </span>
        {/* Gallery hint */}
        <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          {location.gallery.length} фото
        </span>
        <figcaption className="sr-only">{location.title}</figcaption>
      </figure>

      {/* Thumbnail strip */}
      <div className="flex gap-1 px-3 pt-3">
        {location.gallery.slice(0, 3).map((img, i) => (
          <button
            key={i}
            className={`w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${lightbox.open && lightbox.index === i ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
            onClick={() => setLightbox({ open: true, index: i })}
            aria-label={`Открыть фото ${i + 1}`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" width={56} height={40} />
          </button>
        ))}
      </div>

      <div className="p-5 flex-grow flex flex-col">
        <h2 className="text-xl font-bold mb-2 text-gray-900">{location.title}</h2>
        <p className="text-gray-600 text-sm mb-3 flex-grow leading-relaxed">{location.description}</p>

        {/* How to get */}
        <div className="flex items-start gap-2 text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
          <span>{location.howToGet}</span>
        </div>

        {/* Activity CTA (Variant A — inline card) */}
        {location.activity && (
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-gray-400 font-bold tracking-tight">{location.activity.name}</p>
              <p className="text-lg font-bold text-gray-900">{location.activity.price}</p>
            </div>
            <Link to={location.activity.link}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-5">
                Бронировать
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox.open && (
        <Lightbox
          images={location.gallery}
          startIndex={lightbox.index}
          title={location.title}
          onClose={() => setLightbox({ open: false, index: 0 })}
        />
      )}
    </article>
  );
}

// ──────────────────────────────────────────────
// Filter bar
// ──────────────────────────────────────────────
type FilterValue = 'all' | 'open' | 'activity';

function FilterBar({ active, onChange }: { active: FilterValue; onChange: (v: FilterValue) => void }) {
  const filters: { value: FilterValue; label: string }[] = [
    { value: 'all', label: 'Все места' },
    { value: 'open', label: 'Открыто сейчас' },
    { value: 'activity', label: 'С активностями' },
  ];
  return (
    <div className="flex gap-2 flex-wrap mb-8" role="group" aria-label="Фильтр мест">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            active === f.value
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Sticky CTA for waterfall section (Variant B)
// ──────────────────────────────────────────────
function WaterfallStickyBanner() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="relative">
      {visible && (
        <div className="fixed bottom-6 right-6 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-xs animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🏔️</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Водопад Кейва с гидом</p>
              <p className="text-xs text-gray-500 mb-2">Пик полноводия! Лучшее время — сейчас</p>
              <Link to="/tours">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl">
                  Сходить с гидом → от 2 000 ₽
                </Button>
              </Link>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => setVisible(false)}
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
export function KrasnayaPolyanaSpringPage() {
  const [filter, setFilter] = useState<FilterValue>('all');

  const filteredLocations = locations.filter((loc) => {
    if (filter === 'open') return loc.status !== 'Профилактика до мая';
    if (filter === 'activity') return Boolean(loc.activity);
    return true;
  });

  // Article JSON-LD for the whole page
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Что посмотреть в Красной Поляне весной: топ красивых мест',
    description:
      'Путеводитель по весенней Красной Поляне. Водопады, эко-тропы, парк альпак и смотровые площадки. Узнайте, куда сходить и что посмотреть прямо сейчас.',
    author: { '@type': 'Organization', name: 'Сезон Приключений' },
    publisher: {
      '@type': 'Organization',
      name: 'Сезон Приключений',
      url: 'https://seasonadventures.ru',
    },
    datePublished: '2026-04-22',
    dateModified: '2026-04-22',
    image: '/img/photo-1506905925346-21bda4d32df4.jpg',
    mainEntityOfPage: 'https://seasonadventures.ru/guides/krasnaya-polyana-spring',
  };

  return (
    <>
      {/* SEO meta-tags via document title (router level) */}
      <JsonLd data={articleJsonLd} />

      {/* ── Hero ── */}
      <section
        className="relative min-h-[55vh] flex items-center justify-center overflow-hidden bg-slate-900 text-white"
        aria-label="Герой-секция"
      >
        <div className="absolute inset-0 z-0">
          <img
            src="/img/photo-1506905925346-21bda4d32df4.jpg"
            alt="Красная Поляна весной"
            className="w-full h-full object-cover opacity-55"
            loading="eager"
            decoding="async"
            width={1600}
            height={900}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto py-24">
          <p className="text-sm font-semibold text-blue-300 uppercase tracking-widest mb-4">
            Путеводитель · Весна 2026
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-5 leading-tight drop-shadow-md">
            Что посмотреть в Красной Поляне весной
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed drop-shadow">
            Гид по самым сочным локациям межсезонья от команды&nbsp;
            <span className="font-semibold text-white">«Сезон Приключений»</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/tours">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-xl shadow-lg">
                Посмотреть активности
              </Button>
            </Link>
            <a href="#locations">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 rounded-xl backdrop-blur-sm">
                Читать путеводитель
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Breadcrumbs ── */}
      <nav aria-label="Хлебные крошки" className="container py-3">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <li><Link to="/" className="hover:text-foreground transition-colors">Главная</Link></li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li><Link to="/guides" className="hover:text-foreground transition-colors">Путеводители</Link></li>
          <li><ChevronRight className="w-3.5 h-3.5" /></li>
          <li className="text-foreground font-medium">Красная Поляна весной</li>
        </ol>
      </nav>

      {/* ── Intro text ── */}
      <section className="container pb-4">
        <div className="max-w-2xl">
          <p className="text-muted-foreground leading-relaxed">
            Весна — лучшее время для Красной Поляны вне горнолыжного сезона. Тают снега открывают
            водопады, зацветают луга, а цены в отелях падают вдвое. Мы собрали{' '}
            <strong>7 мест</strong>, которые стоит посетить прямо сейчас.
          </p>
        </div>
      </section>

      {/* ── Locations grid ── */}
      <main id="locations" className="container py-8">
        <FilterBar active={filter} onChange={setFilter} />

        {filteredLocations.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Нет мест по выбранному фильтру</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((loc, i) => (
              <LocationCard key={loc.id} location={loc} index={i} />
            ))}
          </div>
        )}
      </main>

      {/* Sticky CTA appears when waterfall card is in view */}
      <WaterfallStickyBanner />

      {/* ── Internal linking block ── */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-12 mt-4">
        <div className="container">
          <h2 className="text-2xl font-bold mb-6 text-center">Explore больше</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <Link
              to="/tours"
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-center group"
            >
              <div className="text-3xl mb-2">🧗</div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Все активности
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Каталог туров и экскурсий</p>
            </Link>
            <Link
              to="/guides/rosa-peak"
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-center group"
            >
              <div className="text-3xl mb-2">⛰️</div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Лендинг №2
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Активности в Красной Поляне</p>
            </Link>
            <Link
              to="/guides/day-trips"
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-center group"
            >
              <div className="text-3xl mb-2">🚌</div>
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Лендинг №3
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Выезды из Красной Поляны</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ for SEO ── */}
      <section className="container py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Часто задаваемые вопросы</h2>
          <dl className="space-y-4">
            {[
              {
                q: 'Когда лучше ехать в Красную Поляну весной?',
                a: 'Оптимальное время — апрель–май. В апреле водопады на пике полноводия, цветут сады, а горы ещё покрыты снегом — фотографии получаются контрастными и эффектными.',
              },
              {
                q: 'Нужно ли бронировать активности заранее?',
                a: 'В межсезонье очереди небольшие, но на популярные форматы (фото-туры, конные прогулки) лучше бронировать за 1–2 дня.',
              },
              {
                q: 'Как добраться до Красной Поляны?',
                a: 'Из Сочи или Адлера на электричке «Ласточка» (40 мин) или такси. Если летите, ближайший аэропорт — Сочи (Адлер), ~50 мин на такси.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border border-gray-100 rounded-xl p-5 bg-white">
                <dt className="font-semibold text-gray-900 mb-2">{q}</dt>
                <dd className="text-sm text-gray-600 leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="bg-blue-600 text-white py-12">
        <div className="container text-center">
          <Clock className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-3">Планируете отдых в Красной Поляне весной?</h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Наши гиды помогут подобрать лучшие активности под погоду и уровень подготовки.
          </p>
          <Link to="/tours">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 rounded-xl font-bold px-8">
              Смотреть все туры
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
