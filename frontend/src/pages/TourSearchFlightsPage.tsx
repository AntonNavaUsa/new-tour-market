import { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Utensils,
  Calendar,
  Users,
  Clock,
  Plane,
  ChevronRight,
  Share2,
  Check,
  Building2,
  ShieldCheck,
  Bus,
} from 'lucide-react';
import type { TourSearchResult, TourSearchForm } from '../types';

interface FlightOffer {
  id: string;
  operator: string;
  operatorLogo?: string;
  isRecommended?: boolean;
  isFastConfirm?: boolean;
  isCheapest?: boolean;
  nights: number;
  price: number;
  oldPrice?: number;
  transferIncluded: boolean;
  insuranceIncluded: boolean;
  outbound: {
    airline: string;
    isCharter: boolean;
    departureTime: string;
    departureCity: string;
    departureCode: string;
    arrivalTime: string;
    arrivalCity: string;
    arrivalCode: string;
    dateStr: string;
    flightDuration: string;
    baggage: string;
    handBaggage: string;
  };
  inbound: {
    airline: string;
    isCharter: boolean;
    departureTime: string;
    departureCity: string;
    departureCode: string;
    arrivalTime: string;
    arrivalCity: string;
    arrivalCode: string;
    dateStr: string;
    flightDuration: string;
    baggage: string;
    handBaggage: string;
  };
}

const MOCK_FLIGHT_OFFERS: FlightOffer[] = [
  {
    id: 'offer-1',
    operator: 'Fun & Sun',
    isRecommended: true,
    isFastConfirm: true,
    nights: 7,
    price: 120847,
    transferIncluded: true,
    insuranceIncluded: true,
    outbound: {
      airline: 'Red Wings',
      isCharter: true,
      departureTime: '12:40',
      departureCity: 'Москва',
      departureCode: 'DME',
      arrivalTime: '17:45',
      arrivalCity: 'Анталья',
      arrivalCode: 'AYT',
      dateStr: '27 сен, вс',
      flightDuration: '5 ч 5 м',
      baggage: '10 кг',
      handBaggage: '10 кг',
    },
    inbound: {
      airline: 'Red Wings',
      isCharter: true,
      departureTime: '06:40',
      departureCity: 'Анталья',
      departureCode: 'AYT',
      arrivalTime: '11:40',
      arrivalCity: 'Москва',
      arrivalCode: 'DME',
      dateStr: '04 окт, вс',
      flightDuration: '5 ч',
      baggage: '10 кг',
      handBaggage: '10 кг',
    },
  },
  {
    id: 'offer-2',
    operator: 'Fun & Sun',
    isCheapest: true,
    isFastConfirm: true,
    nights: 7,
    price: 120847,
    transferIncluded: true,
    insuranceIncluded: true,
    outbound: {
      airline: 'Aeroflot',
      isCharter: true,
      departureTime: '16:05',
      departureCity: 'Москва',
      departureCode: 'VKO',
      arrivalTime: '21:00',
      arrivalCity: 'Анталья',
      arrivalCode: 'AYT',
      dateStr: '27 сен, вс',
      flightDuration: '4 ч 55 м',
      baggage: '10 кг',
      handBaggage: '5 кг',
    },
    inbound: {
      airline: 'Red Wings',
      isCharter: true,
      departureTime: '06:40',
      departureCity: 'Анталья',
      departureCode: 'AYT',
      arrivalTime: '11:40',
      arrivalCity: 'Москва',
      arrivalCode: 'DME',
      dateStr: '04 окт, вс',
      flightDuration: '5 ч',
      baggage: '10 кг',
      handBaggage: '10 кг',
    },
  },
  {
    id: 'offer-3',
    operator: 'Anex Tour',
    isFastConfirm: true,
    nights: 7,
    price: 122911,
    transferIncluded: true,
    insuranceIncluded: true,
    outbound: {
      airline: 'Azur Air',
      isCharter: true,
      departureTime: '16:05',
      departureCity: 'Москва',
      departureCode: 'VKO',
      arrivalTime: '21:00',
      arrivalCity: 'Анталья',
      arrivalCode: 'AYT',
      dateStr: '27 сен, вс',
      flightDuration: '4 ч 55 м',
      baggage: '10 кг',
      handBaggage: '5 кг',
    },
    inbound: {
      airline: 'Azur Air',
      isCharter: true,
      departureTime: '21:15',
      departureCity: 'Анталья',
      departureCode: 'AYT',
      arrivalTime: '02:20',
      arrivalCity: 'Москва',
      arrivalCode: 'DME',
      dateStr: '04 окт, вс',
      flightDuration: '5 ч 5 м',
      baggage: '10 кг',
      handBaggage: '5 кг',
    },
  },
  {
    id: 'offer-4',
    operator: 'Coral Travel',
    isFastConfirm: true,
    nights: 7,
    price: 122911,
    transferIncluded: true,
    insuranceIncluded: true,
    outbound: {
      airline: 'Pegasus',
      isCharter: true,
      departureTime: '12:40',
      departureCity: 'Москва',
      departureCode: 'DME',
      arrivalTime: '17:45',
      arrivalCity: 'Анталья',
      arrivalCode: 'AYT',
      dateStr: '27 сен, вс',
      flightDuration: '5 ч 5 м',
      baggage: '10 кг',
      handBaggage: '10 кг',
    },
    inbound: {
      airline: 'Pegasus',
      isCharter: true,
      departureTime: '21:15',
      departureCity: 'Анталья',
      departureCode: 'AYT',
      arrivalTime: '02:20',
      arrivalCity: 'Москва',
      arrivalCode: 'DME',
      dateStr: '04 окт, вс',
      flightDuration: '5 ч 5 м',
      baggage: '10 кг',
      handBaggage: '10 кг',
    },
  },
];

export function TourSearchFlightsPage() {
  const location = useLocation();

  // Retrieve state passed from previous page or sessionStorage
  const stateHotel = location.state?.hotel as TourSearchResult | undefined;
  const stateRoomName = location.state?.roomName as string | undefined;
  const stateForm = location.state?.form as TourSearchForm | undefined;

  const [copiedShare, setCopiedShare] = useState(false);
  const [indivTransfer, setIndivTransfer] = useState<Record<string, boolean>>({});

  // Filter States
  const [sortOption, setSortOption] = useState<'default' | 'priceAsc' | 'duration'>('default');
  const [filterBaggage, setFilterBaggage] = useState<'all' | 'included'>('all');
  const [filterDirect, setFilterDirect] = useState(false);

  const hotel = useMemo(() => {
    if (stateHotel) return stateHotel;
    return {
      id: '1',
      name: 'Side Yesiloz Hotel',
      stars: 4,
      rating: 7.7,
      country: { name: 'Турция' },
      region: { name: 'Сиде' },
      picturelink: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    };
  }, [stateHotel]);

  const roomName = stateRoomName || 'Номер эконом-класса';
  const totalGuests = stateForm ? stateForm.adults + stateForm.childs.length : 2;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const toggleIndivTransfer = (id: string) => {
    setIndivTransfer((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20 pt-6">
      <div className="container max-w-6xl px-4 sm:px-6">
        {/* HEADER TOP BAR */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900">
            <Check className="h-3.5 w-3.5 text-blue-500" />
            Виза не нужна
          </span>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition shadow-sm"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{copiedShare ? 'Ссылка скопирована!' : 'Поделиться'}</span>
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
          Тур с перелётом в Турцию
        </h1>

        {/* HOTEL & ROOM COMPACT SUMMARY CARD */}
        <div className="mb-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* HOTEL INFO */}
            <div className="md:col-span-4 space-y-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800 pb-4 md:pb-0 md:pr-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {hotel.name}
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {Array.from({ length: hotel.stars || 4 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {hotel.rating || 7.7}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{hotel.region?.name || 'Сиде'}, {hotel.country?.name || 'Турция'} • от аэропорта Antalya ≈ 66 км</span>
              </p>
            </div>

            {/* SELECTED ROOM INFO */}
            <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r border-slate-100 dark:border-zinc-800 pb-4 md:pb-0 md:pr-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {roomName}
                </h3>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">22 м²</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">Кондиционер</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">Телевизор</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">Мини-бар</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800">Телефон</span>
              </div>

              <p className="text-[11px] text-slate-500">
                Уборка в номере — ежедневно. Мини-бар: пустой. <span className="text-indigo-600 font-semibold hover:underline cursor-pointer">+24 удобства</span>
              </p>
            </div>

            {/* HOTEL THUMBNAIL PHOTO */}
            <div className="md:col-span-3 flex justify-end">
              <div className="h-28 w-full md:w-36 overflow-hidden rounded-2xl bg-slate-200 dark:bg-zinc-800 relative group">
                <img
                  src={hotel.picturelink}
                  alt={hotel.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>
            </div>
          </div>

          {/* TRIP QUICK SUMMARY BADGES */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span>27 сен, вс - 04 окт, вс</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>7 ночей</span>
            </div>
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-emerald-500" />
              <span>Всё включено</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span>{totalGuests} взрослых</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" />
              <span>Заселение с 14:00, Выезд до 12:00</span>
            </div>
          </div>
        </div>

        {/* SECTION TITLE & FILTERS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Выберите тур
            </h2>
          </div>

          {/* FILTER BUTTONS ROW */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-bold scrollbar-none">
            <button
              type="button"
              onClick={() => setSortOption('default')}
              className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition ${
                sortOption === 'default'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              ↑↓ По умолчанию
            </button>

            <button
              type="button"
              onClick={() => setFilterBaggage(filterBaggage === 'included' ? 'all' : 'included')}
              className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition ${
                filterBaggage === 'included'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              Багаж {filterBaggage === 'included' ? '✓' : '▾'}
            </button>

            <button
              type="button"
              onClick={() => setFilterDirect(!filterDirect)}
              className={`px-3.5 py-2 rounded-xl border whitespace-nowrap transition flex items-center gap-1 ${
                filterDirect
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <Plane className="h-3.5 w-3.5" />
              <span>Прямой перелет</span>
            </button>

            <button
              type="button"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-slate-100 transition"
            >
              Трансфер включен
            </button>

            <button
              type="button"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-slate-100 transition"
            >
              Регулярным рейсы
            </button>

            <button
              type="button"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-slate-100 transition"
            >
              Авиакомпания ▾
            </button>

            <button
              type="button"
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 whitespace-nowrap hover:bg-slate-100 transition"
            >
              Быстрое подтверждение
            </button>
          </div>

          {/* FLIGHT OFFERS LIST */}
          <div className="space-y-4">
            {MOCK_FLIGHT_OFFERS.map((offer) => {
              const isIndiv = !!indivTransfer[offer.id];
              const finalPrice = isIndiv ? offer.price + 11252 : offer.price;

              return (
                <div
                  key={offer.id}
                  className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6 hover:shadow-md transition"
                >
                  {/* BADGES TOP */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {offer.isRecommended && (
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-extrabold shadow-sm">
                        Рекомендуемый
                      </span>
                    )}
                    {offer.isCheapest && (
                      <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow-sm">
                        Самый дешевый
                      </span>
                    )}
                    {offer.isFastConfirm && (
                      <span className="px-3 py-1 rounded-full bg-sky-500 text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1">
                        ⚡ Быстрое подтверждение
                      </span>
                    )}
                  </div>

                  {/* FLIGHT DETAILS GRID & OPERATOR PRICE */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* FLIGHTS (OUTBOUND & INBOUND) */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-zinc-800 pb-6 lg:pb-0 lg:pr-6">
                      {/* OUTBOUND (ТУДА) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-900 dark:text-white">Туда</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            Чартер ({offer.outbound.airline})
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                              {offer.outbound.departureTime}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-medium">
                              {offer.outbound.departureCity} ({offer.outbound.departureCode})
                            </span>
                          </div>

                          <div className="flex-1 px-3 text-center">
                            <span className="text-[10px] font-semibold text-slate-400 block">
                              В пути: {offer.outbound.flightDuration}
                            </span>
                            <div className="relative my-1 flex items-center justify-center">
                              <div className="h-0.5 w-full bg-slate-200 dark:bg-zinc-700" />
                              <Plane className="absolute h-3.5 w-3.5 text-slate-400 rotate-90 bg-white dark:bg-zinc-900 px-0.5" />
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-600">Прямой</span>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                              {offer.outbound.arrivalTime}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-medium">
                              {offer.outbound.arrivalCity} ({offer.outbound.arrivalCode})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>{offer.outbound.dateStr}</span>
                          <span>🧳 {offer.outbound.baggage} • 🛍️ {offer.outbound.handBaggage}</span>
                        </div>
                      </div>

                      {/* INBOUND (ОБРАТНО) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-900 dark:text-white">Обратно</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            Чартер ({offer.inbound.airline})
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                              {offer.inbound.departureTime}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-medium">
                              {offer.inbound.departureCity} ({offer.inbound.departureCode})
                            </span>
                          </div>

                          <div className="flex-1 px-3 text-center">
                            <span className="text-[10px] font-semibold text-slate-400 block">
                              В пути: {offer.inbound.flightDuration}
                            </span>
                            <div className="relative my-1 flex items-center justify-center">
                              <div className="h-0.5 w-full bg-slate-200 dark:bg-zinc-700" />
                              <Plane className="absolute h-3.5 w-3.5 text-slate-400 rotate-90 bg-white dark:bg-zinc-900 px-0.5" />
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-600">Прямой</span>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                              {offer.inbound.arrivalTime}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-medium">
                              {offer.inbound.arrivalCity} ({offer.inbound.arrivalCode})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>{offer.inbound.dateStr}</span>
                          <span>🧳 {offer.inbound.baggage} • 🛍️ {offer.inbound.handBaggage}</span>
                        </div>
                      </div>
                    </div>

                    {/* OPERATOR, INCLUSIONS & BOOK BUTTON */}
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
                          {offer.operator}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                          Детали тура ❯
                        </span>
                      </div>

                      {/* INCLUSIONS */}
                      <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-medium">
                        <li className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{offer.nights} ночей</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Bus className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Групповой трансфер</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Медицинская страховка</span>
                        </li>
                      </ul>

                      {/* INDIVIDUAL TRANSFER TOGGLE */}
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Индивидуальный трансфер (+11 252 ₽)</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isIndiv}
                            onChange={() => toggleIndivTransfer(offer.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500" />
                        </label>
                      </div>

                      {/* PRICE & ACTION */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {finalPrice.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>

                        <Link
                          to={`/booking/${hotel.id}`}
                          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl shadow-md shadow-orange-500/20 transition-all text-sm"
                        >
                          Выбрать тур
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
