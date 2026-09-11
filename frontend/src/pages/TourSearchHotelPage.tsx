import { useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import {
  Star,
  Heart,
  MapPin,
  Wifi,
  Umbrella,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import type { TourSearchResult, TourSearchForm } from '../types';

// Default gallery fallback images if tour item has limited photos
const DEFAULT_GALLERY = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
];

export function TourSearchHotelPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve state passed from search page if available
  const stateHotel = location.state?.hotel as TourSearchResult | undefined;
  const stateForm = location.state?.form as TourSearchForm | undefined;

  // Fallback default mock hotel if accessed directly by URL
  const hotel: TourSearchResult = useMemo(() => {
    if (stateHotel) return stateHotel;
    return {
      id: id || '1',
      name: 'Side Yesiloz Hotel',
      stars: 4,
      category: 4,
      rating: 7.7,
      reviewsCount: 102,
      price: 199898,
      priceOld: 235000,
      currency: 'RUB',
      picturelink: DEFAULT_GALLERY[0],
      images: DEFAULT_GALLERY,
      country: { name: 'Турция' },
      region: { name: 'Сиде' },
      meal: { name: 'Всё включено (All Inclusive)' },
      roomType: '2-комнатный семейный номер',
      nights: 7,
      date: '11.05.2026',
    };
  }, [stateHotel, id]);

  // Gallery state
  const photos = useMemo(() => {
    if (hotel.images && hotel.images.length >= 5) return hotel.images;
    if (hotel.picturelink) return [hotel.picturelink, ...DEFAULT_GALLERY.slice(1)];
    return DEFAULT_GALLERY;
  }, [hotel]);

  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Consultation form state
  const [consultName, setConsultName] = useState('');
  const [consultPhone, setConsultPhone] = useState('');
  const [agreeTerms, setConsultAgreeTerms] = useState(true);
  const [agreeData, setConsultAgreeData] = useState(true);
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  const totalGuests = stateForm ? stateForm.adults + stateForm.childs.length : 4;

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultName || !consultPhone) return;
    setConsultSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20 pt-6">
      <div className="container max-w-6xl px-4 sm:px-6">
        {/* BREADCRUMBS / BACK BUTTON */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Назад к поиску туров</span>
          </button>
        </div>

        {/* HOTEL HEADER SECTION */}
        <header className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {hotel.name}
              </h1>

              {/* RATING & REVIEWS */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {/* STARS */}
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: hotel.stars || hotel.category || 4 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>

                {/* RATING BADGE */}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                  <span>{hotel.rating || 7.7}</span>
                  <span>•</span>
                  <span>Хорошо</span>
                </div>

                {/* REVIEWS COUNT */}
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  {hotel.reviewsCount || 102} отзыва
                </span>
              </div>

              {/* TAGS / BADGES BELOW TITLE */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-slate-200/80 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Обновлен в 2023
                </span>
                <span className="rounded-lg bg-slate-200/80 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  2-комнатные семейные номера
                </span>
                <span className="rounded-lg bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-blue-500" />
                  Виза не нужна
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS & PRICE PREVIEW */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-3 rounded-2xl border transition flex items-center gap-2 text-sm font-semibold ${
                  isFavorite
                    ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="hidden sm:inline">В подборку</span>
              </button>
            </div>
          </div>
        </header>

        {/* PHOTO ALBUM GRID */}
        <section className="mb-10 overflow-hidden rounded-3xl bg-slate-200 dark:bg-zinc-900 p-1 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5 h-[340px] sm:h-[420px]">
            {/* MAIN BIG PHOTO (2 COLUMNS) */}
            <div
              onClick={() => setActivePhotoIndex(0)}
              className="group relative md:col-span-2 h-full cursor-pointer overflow-hidden rounded-2xl bg-slate-300 dark:bg-zinc-800"
            >
              <img
                src={photos[0]}
                alt={hotel.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              <span className="absolute bottom-3 left-3 rounded-xl bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white">
                Главное фото
              </span>
            </div>

            {/* SMALL PHOTOS GRID (2 COLUMNS) */}
            <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-1.5 h-full">
              {photos.slice(1, 4).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx + 1)}
                  className="group relative h-full cursor-pointer overflow-hidden rounded-2xl bg-slate-300 dark:bg-zinc-800"
                >
                  <img
                    src={img}
                    alt={`${hotel.name} - ${idx + 2}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
              ))}

              {/* 4TH PHOTO WITH OVERLAY (VIEW ALL) */}
              <div
                onClick={() => setActivePhotoIndex(4)}
                className="group relative h-full cursor-pointer overflow-hidden rounded-2xl bg-slate-300 dark:bg-zinc-800"
              >
                <img
                  src={photos[4] || photos[0]}
                  alt={`${hotel.name} - еще фото`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-colors group-hover:bg-black/70 flex flex-col items-center justify-center text-white text-center p-2">
                  <span className="text-xl font-extrabold tracking-tight">156 фото</span>
                  <span className="text-xs font-semibold underline underline-offset-4 mt-0.5 opacity-90">
                    Смотреть все
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 KEY INFO CARDS GRID */}
        <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: ПЛЯЖ */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Umbrella className="h-5 w-5" />
                </div>
                <span>Пляж</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                <li>• 3-я линия, 1100 метров до пляжа, песчаный, оборудованный</li>
                <li>• Вход в воду: пологий песчаный</li>
                <li>• Путь к пляжу: предоставляется бесплатный транспорт, вниз по лестнице или тропинке</li>
                <li>• Принадлежит отелю</li>
              </ul>
            </div>
            <button type="button" className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left inline-flex items-center gap-1">
              <span>Узнать больше о пляже</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* CARD 2: WI-FI И УДОБСТВА */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Wifi className="h-5 w-5" />
                </div>
                <span>Wi-Fi и удобства</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Платный Wi-Fi по всей территории отеля. Доступен в номерах и общественных зонах.
              </p>
            </div>
            <button type="button" className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left inline-flex items-center gap-1">
              <span>Ещё 112 удобств</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* CARD 3: УСЛОВИЯ ЗАСЕЛЕНИЯ */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-5 w-5" />
                </div>
                <span>Условия заселения</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                <li>• Заселение с 14:00</li>
                <li>• Выезд до 12:00</li>
                <li>• В номер не заселяют мужчин без женщин</li>
              </ul>
            </div>
            <button type="button" className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-left inline-flex items-center gap-1">
              <span>Все условия</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* CARD 4: РАСПОЛОЖЕНИЕ & КАРТА */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm flex flex-col justify-between group">
            {/* MAP BACKGROUND DECORATION */}
            <div className="absolute inset-0 opacity-25 dark:opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:12px_12px] bg-slate-100 dark:bg-zinc-800" />

            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <span>Карта</span>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm p-3 text-center shadow-sm">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                  Смотреть на карте
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold block text-slate-800 dark:text-slate-200 mb-0.5">От аэропорта до отеля:</span>
                <span>Antalya • 66.0 км, ≈1 ч. 2 мин.</span>
              </div>
            </div>
          </div>
        </section>

        {/* HOTEL BREAKDOWN / FACILITIES LIST */}
        <section className="mb-10 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6">
            Подробно об отеле
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ITEM 1 */}
            <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Бассейны и горки
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  2 бассейна, есть детский, 4 горки
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0 mt-1" />
            </div>

            {/* ITEM 2 */}
            <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Рестораны и бары
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Бар у бассейна, бар на территории
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0 mt-1" />
            </div>

            {/* ITEM 3 */}
            <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Для детей
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Детский клуб, от 4 до 12 лет
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0 mt-1" />
            </div>

            {/* ITEM 4 */}
            <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Развлечения и спорт
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Игровая комната, организация экскурсий, настольные игры
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0 mt-1" />
            </div>

            {/* ITEM 5 */}
            <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Дополнительные услуги
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Маникюр, массаж рук, пилинг для тела, спа-лаундж
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0 mt-1" />
            </div>

            {/* ITEM 6 */}
            <div className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Об отеле
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  231 номер, 4 этажа, год строительства 2007, ремонт в 2023
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 shrink-0 mt-1" />
            </div>
          </div>
        </section>

        {/* CONSULTATION / HELP CARD ("Подбираете отель?") */}
        <section className="mb-10 rounded-3xl bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/40 p-6 sm:p-8 border border-blue-100 dark:border-zinc-800 shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* LEFT TEXT & MANAGERS */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Подбираете отель?
                </h3>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  Наши сотрудники помогут найти лучший вариант по вашему бюджету и датам.
                </p>
              </div>

              {/* MANAGERS AVATARS */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 overflow-hidden">
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Менеджер 1"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover"
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
                    alt="Менеджер 2"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover"
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80"
                    alt="Менеджер 3"
                  />
                  <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Менеджер 4"
                  />
                </div>
                <div className="flex flex-col text-xs font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">Ответ за 15 минут</span>
                  <span className="text-slate-500">Опыт 10+ лет</span>
                </div>
              </div>
            </div>

            {/* RIGHT FORM */}
            <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
              {consultSubmitted ? (
                <div className="py-6 text-center space-y-3 animate-in fade-in duration-300">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Заявка отправлена!</h4>
                  <p className="text-xs text-slate-500">Наш менеджер свяжется с вами в ближайшее время.</p>
                </div>
              ) : (
                <form onSubmit={handleConsultSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Имя"
                      value={consultName}
                      onChange={(e) => setConsultName(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Телефон"
                      value={consultPhone}
                      onChange={(e) => setConsultPhone(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  {/* CHECKBOXES */}
                  <div className="space-y-2 text-[11px] text-slate-500">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setConsultAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded text-orange-500 focus:ring-orange-500"
                      />
                      <span>
                        Принимаю{' '}
                        <a href="/terms" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                          Пользовательское соглашение
                        </a>{' '}
                        и{' '}
                        <a href="/privacy" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                          Политику о персональных данных
                        </a>
                      </span>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeData}
                        onChange={(e) => setConsultAgreeData(e.target.checked)}
                        className="mt-0.5 rounded text-orange-500 focus:ring-orange-500"
                      />
                      <span>
                        Даю{' '}
                        <a href="/privacy" target="_blank" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                          Согласие на обработку персональных данных
                        </a>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!agreeTerms || !agreeData}
                    className="w-full py-3.5 px-6 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Подберите мне отель</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* BOOKING / TOUR SELECTION CARD */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider block mb-1">
                Доступный тур в отель
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Забронировать проживание
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                1 номер для {totalGuests} {totalGuests === 1 ? 'гостя' : 'гостей'} • {hotel.meal?.name || 'Всё включено'} • {hotel.roomType || 'Стандартный номер'}
              </p>
            </div>

            <div className="text-left sm:text-right">
              {hotel.priceOld && (
                <span className="text-sm text-slate-400 line-through block font-medium">
                  {hotel.priceOld.toLocaleString('ru-RU')} ₽
                </span>
              )}
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                от {hotel.price?.toLocaleString('ru-RU') || '199 898'} ₽
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Цена актуальна на данный момент и включает перелет, проживание, медицинскую страховку и трансфер.
            </div>

            <Link
              to={`/booking/${hotel.id}`}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/25 transition-all text-center text-base"
            >
              Забронировать тур
            </Link>
          </div>
        </section>
      </div>

      {/* FULLSCREEN LIGHTBOX PHOTO MODAL */}
      {activePhotoIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={() => setActivePhotoIndex((prev) => (prev! > 0 ? prev! - 1 : photos.length - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>

          <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl">
            <img
              src={photos[activePhotoIndex]}
              alt={`${hotel.name} - фото ${activePhotoIndex + 1}`}
              className="max-h-[80vh] w-auto object-contain rounded-2xl"
            />
            <div className="text-center text-white text-xs font-medium mt-3">
              Фото {activePhotoIndex + 1} из {photos.length}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePhotoIndex((prev) => (prev! < photos.length - 1 ? prev! + 1 : 0))}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
      )}
    </main>
  );
}
