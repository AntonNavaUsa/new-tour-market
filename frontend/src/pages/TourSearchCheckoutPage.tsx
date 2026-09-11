import { useState, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Star,
  MapPin,
  Utensils,
  Calendar,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { TourSearchResult } from '../types';

export function TourSearchCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Retrieve state passed from previous steps
  const stateHotel = location.state?.hotel as TourSearchResult | undefined;
  const stateRoomName = location.state?.roomName as string | undefined;
  const stateOfferPrice = location.state?.offerPrice as number | undefined;

  const hotel = useMemo(() => {
    if (stateHotel) return stateHotel;
    // Fallback if accessed directly
    return {
      id: id || '1',
      name: 'Side Yesiloz Hotel',
      stars: 4,
      rating: 7.7,
      country: { name: 'Турция' },
      region: { name: 'Сиде' },
      picturelink: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    };
  }, [stateHotel, id]);

  const roomName = stateRoomName || 'Номер эконом-класса';
  const basePrice = stateOfferPrice || 120847;

  // Contact info state
  const [contactLastName, setContactLastName] = useState('');
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isBuyer, setIsBuyer] = useState(true);

  // Tourists data state (2 tourists default)
  const [tourist1, setTourist1] = useState({
    lastName: '',
    firstName: '',
    birthDate: '',
    passportNumber: '',
    passportExpiry: '',
    citizenship: 'Россия',
  });

  const [tourist2, setTourist2] = useState({
    lastName: '',
    firstName: '',
    birthDate: '',
    passportNumber: '',
    passportExpiry: '',
    citizenship: 'Россия',
  });

  // Extras state (Add-ons)
  const [transferAirportToHotel, setTransferAirportToHotel] = useState(false);
  const [transferHotelToAirport, setTransferHotelToAirport] = useState(false);
  const [extendedInsurance, setExtendedInsurance] = useState(false);

  // Payment Option state (100% or 50%)
  const [paymentOption, setPaymentOption] = useState<'full' | 'half'>('full');

  // Terms agreement & promo state
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setPromoApplied] = useState(false);

  // Details dropdown expanded
  const [showTourDetails, setShowTourDetails] = useState(false);

  // Calculate prices
  const transferPrice = 5600;
  const insurancePrice = 3400;

  const extrasTotal =
    (transferAirportToHotel ? transferPrice : 0) +
    (transferHotelToAirport ? transferPrice : 0) +
    (extendedInsurance ? insurancePrice : 0);

  const totalPrice = basePrice + extrasTotal;
  const payNowAmount = paymentOption === 'full' ? totalPrice : Math.round(totalPrice * 0.5);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toLowerCase() === 'sale10') {
      setPromoApplied(true);
    }
  };

  const handleProceedToPayment = () => {
    if (!agreeTerms) return;
    alert(`Переход к оплате картой на сумму ${payNowAmount.toLocaleString('ru-RU')} ₽`);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20 pt-6">
      <div className="container max-w-5xl px-4 sm:px-6 space-y-8">
        {/* TITLE */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Тур с перелётом в Турцию
        </h1>

        {/* HOTEL & TOUR COMPACT SUMMARY CARD */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-20 w-24 overflow-hidden rounded-2xl bg-slate-200 dark:bg-zinc-800 shrink-0">
                <img src={hotel.picturelink} alt={hotel.name} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-1">
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
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {hotel.name}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{hotel.region?.name || 'Сиде'}, {hotel.country?.name || 'Турция'} • Виза не нужна</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span>27 сен, вс - 4 окт, вс</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span>7 ночей</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span>2 взрослых</span>
            </div>
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-emerald-500" />
              <span>Всё включено</span>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Категория: {roomName}
            </span>
            <button
              type="button"
              onClick={() => setShowTourDetails(!showTourDetails)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Детали тура</span>
              {showTourDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {showTourDetails && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 text-xs text-slate-600 dark:text-slate-300 space-y-2 animate-in fade-in duration-200">
              <p>• Прямой авиаперелет Москва (DME) ⇄ Анталья (AYT), чартер Red Wings.</p>
              <p>• Включен багаж 10 кг + ручная кладь 10 кг на каждого пассажира.</p>
              <p>• Включен медицинский страховой полис и групповой трансфер аэропорт-отель-аэропорт.</p>
            </div>
          )}
        </div>

        {/* SECTION 1: CONTACT DATA */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Внесите контактные данные
            </h2>
            <p className="text-xs text-slate-500">
              Пришлём письмо и SMS после брони тура
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Фамилия кириллицей"
                  value={contactLastName}
                  onChange={(e) => setContactLastName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Имя кириллицей"
                  value={contactFirstName}
                  onChange={(e) => setContactFirstName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <input
                  type="tel"
                  placeholder="Телефон"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isBuyer}
                    onChange={(e) => setIsBuyer(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4"
                  />
                  <span>Я покупатель (еду в этом туре)</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: TOURISTS DATA */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Заполните данные туристов
            </h2>
            <p className="text-xs text-slate-500">
              Фамилию и имя укажите, как в загранпаспорте
            </p>
          </div>

          {/* WARNING BANNER */}
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-4 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-amber-900 dark:text-amber-100 mb-0.5">
                Обратите внимание
              </span>
              Убедитесь, что паспорт действителен не менее 120 дней с даты окончания поездки, чтобы пройти пограничный контроль.
            </div>
          </div>

          {/* TOURIST 1 */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Взрослый №1
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Фамилия латиницей"
                value={tourist1.lastName}
                onChange={(e) => setTourist1({ ...tourist1, lastName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <input
                type="text"
                placeholder="Имя латиницей"
                value={tourist1.firstName}
                onChange={(e) => setTourist1({ ...tourist1, firstName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <input
                type="text"
                placeholder="Дата рождения (ДД.ММ.ГГГГ)"
                value={tourist1.birthDate}
                onChange={(e) => setTourist1({ ...tourist1, birthDate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Серия и номер загранпаспорта"
                value={tourist1.passportNumber}
                onChange={(e) => setTourist1({ ...tourist1, passportNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <input
                type="text"
                placeholder="Окончание действия"
                value={tourist1.passportExpiry}
                onChange={(e) => setTourist1({ ...tourist1, passportExpiry: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <select
                value={tourist1.citizenship}
                onChange={(e) => setTourist1({ ...tourist1, citizenship: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="Россия">Россия</option>
                <option value="Беларусь">Беларусь</option>
                <option value="Казахстан">Казахстан</option>
              </select>
            </div>
          </div>

          {/* TOURIST 2 */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Взрослый №2
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Фамилия латиницей"
                value={tourist2.lastName}
                onChange={(e) => setTourist2({ ...tourist2, lastName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <input
                type="text"
                placeholder="Имя латиницей"
                value={tourist2.firstName}
                onChange={(e) => setTourist2({ ...tourist2, firstName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <input
                type="text"
                placeholder="Дата рождения (ДД.ММ.ГГГГ)"
                value={tourist2.birthDate}
                onChange={(e) => setTourist2({ ...tourist2, birthDate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Серия и номер загранпаспорта"
                value={tourist2.passportNumber}
                onChange={(e) => setTourist2({ ...tourist2, passportNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <input
                type="text"
                placeholder="Окончание действия"
                value={tourist2.passportExpiry}
                onChange={(e) => setTourist2({ ...tourist2, passportExpiry: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <select
                value={tourist2.citizenship}
                onChange={(e) => setTourist2({ ...tourist2, citizenship: e.target.value })}
                className="w-full bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="Россия">Россия</option>
                <option value="Беларусь">Беларусь</option>
                <option value="Казахстан">Казахстан</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION 3: ADD EXTRAS TO YOUR TOUR */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Добавьте в свой тур
          </h2>

          <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
            {/* EXTRA 1 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="space-y-1">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                  Индивидуальный трансфер из аэропорта в отель
                </span>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  Встреча в аэропорту и поездка в отель без других пассажиров и остановок. Это удобнее и быстрее, чем групповой трансфер.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTransferAirportToHotel(!transferAirportToHotel)}
                className={`px-5 py-2.5 rounded-2xl border font-bold text-xs transition shrink-0 ${
                  transferAirportToHotel
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-zinc-800 border-slate-900 dark:border-zinc-600 text-slate-900 dark:text-white hover:bg-slate-100'
                }`}
              >
                {transferAirportToHotel ? '✓ Добавлено (+5 600 ₽)' : 'Добавить в заказ +'}
              </button>
            </div>

            {/* EXTRA 2 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800">
              <div className="space-y-1">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                  Индивидуальный трансфер из отеля в аэропорт
                </span>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  Быстро доберитесь в аэропорт на индивидуальном транспорте: так поездка станет комфортнее, а рассчитать время в дороге будет проще.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTransferHotelToAirport(!transferHotelToAirport)}
                className={`px-5 py-2.5 rounded-2xl border font-bold text-xs transition shrink-0 ${
                  transferHotelToAirport
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-zinc-800 border-slate-900 dark:border-zinc-600 text-slate-900 dark:text-white hover:bg-slate-100'
                }`}
              >
                {transferHotelToAirport ? '✓ Добавлено (+5 600 ₽)' : 'Добавить в заказ +'}
              </button>
            </div>

            {/* EXTRA 3 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                  Расширенная страховка от невыезда
                </span>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                  Страховка от невыезда поможет вернуть потраченные деньги за вычетом стоимости полиса, если заболеет участник поездки или близкий родственник, откажут в визе или произойдет стихийное бедствие.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExtendedInsurance(!extendedInsurance)}
                className={`px-5 py-2.5 rounded-2xl border font-bold text-xs transition shrink-0 ${
                  extendedInsurance
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-zinc-800 border-slate-900 dark:border-zinc-600 text-slate-900 dark:text-white hover:bg-slate-100'
                }`}
              >
                {extendedInsurance ? '✓ Добавлено (+3 400 ₽)' : 'Добавить в заказ +'}
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 4: CHOOSE PAYMENT OPTION */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Выберите вариант оплаты
            </h2>
            <p className="text-xs text-slate-500">
              Оплачивайте как вам удобно, без дополнительных комиссий.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OPTION 1: 100% */}
            <div
              onClick={() => setPaymentOption('full')}
              className={`cursor-pointer rounded-3xl p-6 transition border-2 flex flex-col justify-between ${
                paymentOption === 'full'
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md'
                  : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-4 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                  100%
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      paymentOption === 'full'
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {paymentOption === 'full' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {totalPrice.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Оплатить всю стоимость сейчас и стать на шаг ближе к заветной поездке.
                </p>
              </div>
            </div>

            {/* OPTION 2: 50% */}
            <div
              onClick={() => setPaymentOption('half')}
              className={`cursor-pointer rounded-3xl p-6 transition border-2 flex flex-col justify-between ${
                paymentOption === 'half'
                  ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md'
                  : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="inline-block rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-4 py-1 text-xs font-black text-indigo-700 dark:text-indigo-300">
                  50%
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      paymentOption === 'half'
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {paymentOption === 'half' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {Math.round(totalPrice * 0.5).toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Часть сейчас, а остальное в течение 3 дней после подтверждения тура.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: COST & ORDER BREAKDOWN */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Стоимость и состав заказа
          </h2>

          <div className="space-y-4">
            <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded text-orange-500 focus:ring-orange-500 h-4 w-4"
              />
              <span>
                Я согласен с{' '}
                <a href="/terms" target="_blank" className="underline hover:text-orange-600">
                  правилами компании
                </a>{' '}
                и{' '}
                <a href="/terms" target="_blank" className="underline hover:text-orange-600">
                  договором-офертой
                </a>
              </span>
            </label>

            {/* WHITE CARD ORDER SUMMARY */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-md space-y-6">
              {/* PRICE HEADER & PAYMENT BUTTON */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-zinc-800">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Обновление цены через 27 мин</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-500 font-bold">К оплате:</span>
                    <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {payNowAmount.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Чаще всего подтверждается ⚡
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={!agreeTerms}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-black rounded-2xl shadow-lg shadow-orange-500/25 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Перейти к оплате
                </button>
              </div>

              {/* BONUS MILES BANNER */}
              <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 p-4 text-white flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-lg font-extrabold block">
                    + 2 000 миль
                  </span>
                  <span className="text-xs opacity-90 font-medium">
                    Начислим после возвращения
                  </span>
                </div>
                <Sparkles className="h-8 w-8 text-amber-200 shrink-0" />
              </div>

              {/* PROMOCODE FIELD */}
              <form onSubmit={handleApplyPromo} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-zinc-800 text-sm px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl transition text-sm shrink-0"
                >
                  →
                </button>
              </form>

              {appliedPromo && (
                <div className="text-xs font-semibold text-emerald-600">
                  Промокод SALE10 применён!
                </div>
              )}

              {/* LINE ITEMS BREAKDOWN */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800 text-sm font-medium">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Тур с перелётом на двоих</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {(basePrice - 28896).toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Топливный сбор</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    +28 896 ₽
                  </span>
                </div>

                {extrasTotal > 0 && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Дополнительные услуги</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      +{extrasTotal.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-900 dark:border-zinc-100 flex items-center justify-between text-lg font-black text-slate-900 dark:text-white">
                  <span>Итого</span>
                  <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
