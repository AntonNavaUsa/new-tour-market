import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Users,
  Plus,
  Minus,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import type { TourSearchForm, TourSearchReference } from '../types';

interface TourSearchBarProps {
  form: TourSearchForm;
  departures: TourSearchReference[] | undefined;
  countries: TourSearchReference[] | undefined;
  availableDates: string[] | undefined;
  isDeparturesLoading: boolean;
  isCountriesLoading: boolean;
  isSearching: boolean;
  onUpdateForm: <K extends keyof TourSearchForm>(key: K, value: TourSearchForm[K]) => void;
  onChangeDeparture: (departureId: number | null) => void;
  onSubmit: () => void;
}

type PopoverType = 'departure' | 'country' | 'dates' | 'nights' | 'guests' | null;

function pluralizeRu(n: number, one: string, few: string, many: string): string {
  const absN = Math.abs(n) % 100;
  const n1 = absN % 10;
  if (absN > 10 && absN < 20) return `${n} ${many}`;
  if (n1 > 1 && n1 < 5) return `${n} ${few}`;
  if (n1 === 1) return `${n} ${one}`;
  return `${n} ${many}`;
}

function getChildAgeLabel(age: number): string {
  if (age === 0) return 'до 1 года';
  if (age === 1) return '1 год';
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

export function TourSearchBar({
  form,
  departures,
  countries,
  availableDates,
  isDeparturesLoading,
  isCountriesLoading,
  isSearching,
  onUpdateForm,
  onChangeDeparture,
  onSubmit,
}: TourSearchBarProps) {
  const [activePopover, setActivePopover] = useState<PopoverType>(null);

  // Search filter states inside dropdowns
  const [departureSearch, setDepartureSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');

  const availableDatesSet = useMemo(() => {
    if (!availableDates || availableDates.length === 0) return null;
    return new Set(availableDates);
  }, [availableDates]);

  // Calendar State
  const [flexDays, setFlexDays] = useState<0 | 1 | 2 | 3>(3);
  const [selectedBaseDate, setSelectedBaseDate] = useState<Date | null>(() => {
    if (form.dateFrom) {
      try {
        return parseISO(form.dateFrom);
      } catch {
        return null;
      }
    }
    return addDays(new Date(), 7); // Default to 7 days from today
  });

  const [viewMonth, setViewMonth] = useState<Date>(() => selectedBaseDate || new Date());

  const barRef = useRef<HTMLDivElement>(null);

  // Close active popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActivePopover(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Synchronize form dateFrom and dateTo when baseDate or flexDays change
  const handleSelectBaseDate = (date: Date) => {
    setSelectedBaseDate(date);
    const dFrom = subDays(date, flexDays);
    const dTo = addDays(date, flexDays);
    const today = startOfDay(new Date());
    const finalFrom = isBefore(dFrom, today) ? today : dFrom;
    onUpdateForm('dateFrom', format(finalFrom, 'yyyy-MM-dd'));
    onUpdateForm('dateTo', format(dTo, 'yyyy-MM-dd'));
  };

  const handleSelectFlexDays = (days: 0 | 1 | 2 | 3) => {
    setFlexDays(days);
    if (selectedBaseDate) {
      const dFrom = subDays(selectedBaseDate, days);
      const dTo = addDays(selectedBaseDate, days);
      const today = startOfDay(new Date());
      const finalFrom = isBefore(dFrom, today) ? today : dFrom;
      onUpdateForm('dateFrom', format(finalFrom, 'yyyy-MM-dd'));
      onUpdateForm('dateTo', format(dTo, 'yyyy-MM-dd'));
    }
  };

  // Format labels for summary bar
  const selectedDepartureName = useMemo(() => {
    if (!form.departureId) return 'Выберите город';
    return departures?.find((item) => item.id === form.departureId)?.name || 'Выберите город';
  }, [form.departureId, departures]);

  const selectedCountryName = useMemo(() => {
    if (!form.countryId) return 'Выберите страну';
    return countries?.find((item) => item.id === form.countryId)?.name || 'Выберите страну';
  }, [form.countryId, countries]);

  const dateSummaryLabel = useMemo(() => {
    if (!selectedBaseDate) return 'Выберите дату';
    const dateFormatted = format(selectedBaseDate, 'dd.MM');
    if (flexDays === 0) {
      return format(selectedBaseDate, 'dd.MM.yyyy');
    }
    return `с ${dateFormatted} ± ${flexDays} ${flexDays === 1 ? 'день' : flexDays === 2 || flexDays === 3 ? 'дня' : 'дней'}`;
  }, [selectedBaseDate, flexDays]);

  const nightsSummaryLabel = useMemo(() => {
    if (form.nightsFrom === form.nightsTo) {
      return `на ${pluralizeRu(form.nightsFrom, 'ночь', 'ночи', 'ночей')}`;
    }
    return `на ${form.nightsFrom}–${form.nightsTo} ночей`;
  }, [form.nightsFrom, form.nightsTo]);

  const guestsSummaryLabel = useMemo(() => {
    const total = form.adults + form.childs.length;
    return `1 номер для ${pluralizeRu(total, 'туриста', 'туристов', 'туристов')}`;
  }, [form.adults, form.childs.length]);

  // Filter lists
  const filteredDepartures = useMemo(() => {
    if (!departures) return [];
    if (!departureSearch.trim()) return departures;
    return departures.filter((item) =>
      item.name.toLowerCase().includes(departureSearch.toLowerCase())
    );
  }, [departures, departureSearch]);

  const filteredCountries = useMemo(() => {
    if (!countries) return [];
    if (!countrySearch.trim()) return countries;
    return countries.filter((item) =>
      item.name.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countries, countrySearch]);

  // Calendar Months calculation
  const month1 = viewMonth;
  const month2 = addMonths(viewMonth, 1);

  const renderMonthDays = (monthDate: Date) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start, end });
    const startDayOfWeek = (getDay(start) + 6) % 7; // Monday = 0
    const emptySlots = Array.from({ length: startDayOfWeek });

    const today = startOfDay(new Date());

    return (
      <div className="space-y-2">
        <div className="text-center font-bold text-sm text-slate-800 dark:text-slate-100 capitalize">
          {format(monthDate, 'LLLL yyyy', { locale: ru })}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
          <div>ПН</div>
          <div>ВТ</div>
          <div>СР</div>
          <div>ЧТ</div>
          <div>ПТ</div>
          <div className="text-red-500">СБ</div>
          <div className="text-red-500">ВС</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {emptySlots.map((_, i) => (
            <div key={`empty-${i}`} className="h-8 w-8" />
          ))}
          {days.map((day) => {
            const isPast = isBefore(day, today);
            const isBase = selectedBaseDate && isSameDay(day, selectedBaseDate);
            const dateStr = format(day, 'yyyy-MM-dd');
            const isAvailableInTourvisor = availableDatesSet ? availableDatesSet.has(dateStr) : false;

            // Check if day falls in flex range
            let isInRange = false;
            if (selectedBaseDate && flexDays > 0) {
              const rangeStart = subDays(selectedBaseDate, flexDays);
              const rangeEnd = addDays(selectedBaseDate, flexDays);
              isInRange = !isBefore(day, rangeStart) && !isBefore(rangeEnd, day);
            }

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={isPast}
                onClick={() => handleSelectBaseDate(day)}
                className={`relative h-8 w-8 rounded-xl text-xs font-medium transition flex items-center justify-center ${
                  isPast
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : isBase
                    ? 'bg-orange-500 text-white font-bold shadow-sm'
                    : isInRange
                    ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 font-semibold'
                    : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                {format(day, 'd')}
                {isAvailableInTourvisor && !isBase && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={barRef} className="relative rounded-[28px] bg-white dark:bg-zinc-900 p-2 sm:p-3 shadow-xl shadow-indigo-200/40 dark:shadow-none border border-slate-100 dark:border-zinc-800">
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.1fr_1.1fr_1.35fr_1fr_1fr_auto]">
        {/* FIELD 1: ОТКУДА */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'departure' ? null : 'departure')}
            className={`w-full min-h-[72px] flex flex-col justify-center px-4 py-2.5 rounded-2xl transition text-left ${
              activePopover === 'departure'
                ? 'bg-[#e2ede9] dark:bg-zinc-800'
                : 'bg-[#edf4f2] dark:bg-zinc-800/60 hover:bg-[#e5efec] dark:hover:bg-zinc-800'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Откуда
            </span>
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {isDeparturesLoading ? 'Загрузка...' : selectedDepartureName}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${activePopover === 'departure' ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* DROPDOWN: ОТКУДА */}
          {activePopover === 'departure' && (
            <div className="absolute top-full mt-2 left-0 w-full min-w-[260px] z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-2.5 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск города..."
                  value={departureSearch}
                  onChange={(e) => setDepartureSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 text-sm pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                {filteredDepartures.length === 0 ? (
                  <p className="p-3 text-center text-xs text-slate-400">Город не найден</p>
                ) : (
                  filteredDepartures.map((item) => {
                    const isSelected = item.id === form.departureId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onChangeDeparture(item.id);
                          setActivePopover(null);
                          setDepartureSearch('');
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-xl transition flex items-center justify-between font-medium ${
                          isSelected
                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        {isSelected && <Check className="h-4 w-4 shrink-0 text-orange-500" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* FIELD 2: КУДА */}
        <div className="relative">
          <button
            type="button"
            disabled={!form.departureId}
            onClick={() => setActivePopover(activePopover === 'country' ? null : 'country')}
            className={`w-full min-h-[72px] flex flex-col justify-center px-4 py-2.5 rounded-2xl transition text-left disabled:opacity-60 disabled:cursor-not-allowed ${
              activePopover === 'country'
                ? 'bg-[#e2ede9] dark:bg-zinc-800'
                : 'bg-[#edf4f2] dark:bg-zinc-800/60 hover:bg-[#e5efec] dark:hover:bg-zinc-800'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Куда
            </span>
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {!form.departureId ? 'Сначала выберите город' : isCountriesLoading ? 'Загрузка...' : selectedCountryName}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${activePopover === 'country' ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* DROPDOWN: КУДА */}
          {activePopover === 'country' && form.departureId && (
            <div className="absolute top-full mt-2 left-0 w-full min-w-[260px] z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-2.5 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск страны..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-800 text-sm pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                {filteredCountries.length === 0 ? (
                  <p className="p-3 text-center text-xs text-slate-400">Страна не найдена</p>
                ) : (
                  filteredCountries.map((item) => {
                    const isSelected = item.id === form.countryId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onUpdateForm('countryId', item.id);
                          setActivePopover(null);
                          setCountrySearch('');
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-xl transition flex items-center justify-between font-medium ${
                          isSelected
                            ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        {isSelected && <Check className="h-4 w-4 shrink-0 text-orange-500" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* FIELD 3: ДАТА ВЫЛЕТА */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
            className={`w-full min-h-[72px] flex flex-col justify-center px-4 py-2.5 rounded-2xl transition text-left ${
              activePopover === 'dates'
                ? 'bg-[#e2ede9] dark:bg-zinc-800'
                : 'bg-[#edf4f2] dark:bg-zinc-800/60 hover:bg-[#e5efec] dark:hover:bg-zinc-800'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-slate-400" />
              Дата вылета
            </span>
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {dateSummaryLabel}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${activePopover === 'dates' ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* DROPDOWN: ДАТА ВЫЛЕТА (CALENDAR) */}
          {activePopover === 'dates' && (
            <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl p-4 sm:p-5 w-[calc(100vw-2rem)] max-w-[620px]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Выберите дату вылета
                </span>
                <button
                  type="button"
                  onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              {/* CALENDAR MONTHS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {renderMonthDays(month1)}
                <div className="hidden sm:block">
                  {renderMonthDays(month2)}
                </div>
              </div>

              {/* FLEXIBILITY SELECTOR BUTTONS */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-400 mr-1">Гибкость:</span>
                <button
                  type="button"
                  onClick={() => handleSelectFlexDays(0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    flexDays === 0
                      ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300'
                  }`}
                >
                  Точная дата
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFlexDays(1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    flexDays === 1
                      ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300'
                  }`}
                >
                  ±1 день
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFlexDays(2)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    flexDays === 2
                      ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300'
                  }`}
                >
                  ±2 дня
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectFlexDays(3)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    flexDays === 3
                      ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-slate-300'
                  }`}
                >
                  ±3 дня
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FIELD 4: КОЛ-ВО НОЧЕЙ */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'nights' ? null : 'nights')}
            className={`w-full min-h-[72px] flex flex-col justify-center px-4 py-2.5 rounded-2xl transition text-left ${
              activePopover === 'nights'
                ? 'bg-[#e2ede9] dark:bg-zinc-800'
                : 'bg-[#edf4f2] dark:bg-zinc-800/60 hover:bg-[#e5efec] dark:hover:bg-zinc-800'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Кол-во ночей
            </span>
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {nightsSummaryLabel}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${activePopover === 'nights' ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* DROPDOWN: КОЛ-ВО НОЧЕЙ */}
          {activePopover === 'nights' && (
            <div className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 min-w-[280px]">
              <div className="space-y-4">
                {/* ROW: ОТ */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">От</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={form.nightsFrom <= 1}
                      onClick={() => {
                        const nextVal = Math.max(1, form.nightsFrom - 1);
                        onUpdateForm('nightsFrom', nextVal);
                        if (nextVal > form.nightsTo) {
                          onUpdateForm('nightsTo', nextVal);
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-lg flex items-center justify-center transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-base text-slate-900 dark:text-white">
                      {form.nightsFrom}
                    </span>
                    <button
                      type="button"
                      disabled={form.nightsFrom >= 28}
                      onClick={() => {
                        const nextVal = Math.min(28, form.nightsFrom + 1);
                        onUpdateForm('nightsFrom', nextVal);
                        if (nextVal > form.nightsTo) {
                          onUpdateForm('nightsTo', Math.min(28, nextVal + 2));
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-lg flex items-center justify-center transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* ROW: ДО */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">До</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={form.nightsTo <= form.nightsFrom}
                      onClick={() => {
                        const nextVal = Math.max(form.nightsFrom, form.nightsTo - 1);
                        onUpdateForm('nightsTo', nextVal);
                      }}
                      className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-lg flex items-center justify-center transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-base text-slate-900 dark:text-white">
                      {form.nightsTo}
                    </span>
                    <button
                      type="button"
                      disabled={form.nightsTo >= 28 || form.nightsTo - form.nightsFrom >= 10}
                      onClick={() => {
                        const nextVal = Math.min(28, Math.min(form.nightsFrom + 10, form.nightsTo + 1));
                        onUpdateForm('nightsTo', nextVal);
                      }}
                      className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-lg flex items-center justify-center transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs text-slate-500">
                  Выбраны туры {selectedBaseDate ? `с ${format(selectedBaseDate, 'dd.MM')}` : ''} на {form.nightsFrom}–{form.nightsTo} ночей
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FIELD 5: КТО ЕДЕТ */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'guests' ? null : 'guests')}
            className={`w-full min-h-[72px] flex flex-col justify-center px-4 py-2.5 rounded-2xl transition text-left ${
              activePopover === 'guests'
                ? 'bg-[#e2ede9] dark:bg-zinc-800'
                : 'bg-[#edf4f2] dark:bg-zinc-800/60 hover:bg-[#e5efec] dark:hover:bg-zinc-800'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Users className="h-3 w-3 text-slate-400" />
              1 номер для
            </span>
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {guestsSummaryLabel}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${activePopover === 'guests' ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* DROPDOWN: КТО ЕДЕТ */}
          {activePopover === 'guests' && (
            <div className="absolute top-full mt-2 left-0 md:left-0 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-5 min-w-[320px] max-w-[360px]">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                1 номер
              </h3>

              <div className="space-y-4">
                {/* ADULTS */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">Взрослые</div>
                    <div className="text-xs text-slate-500">От 18 и старше</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={form.adults <= 1}
                      onClick={() => onUpdateForm('adults', Math.max(1, form.adults - 1))}
                      className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-lg flex items-center justify-center transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-base text-slate-900 dark:text-white">
                      {form.adults}
                    </span>
                    <button
                      type="button"
                      disabled={form.adults >= 6}
                      onClick={() => onUpdateForm('adults', Math.min(6, form.adults + 1))}
                      className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold text-lg flex items-center justify-center transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* CHILDREN LIST */}
                {form.childs.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    {form.childs.map((age, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        <span>Ребёнок: {getChildAgeLabel(age)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextChilds = [...form.childs];
                            nextChilds.splice(index, 1);
                            onUpdateForm('childs', nextChilds);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ADD CHILD SELECTOR */}
                {form.childs.length < 4 && (
                  <div className="relative">
                    <select
                      className="w-full bg-slate-50 dark:bg-zinc-800 text-sm font-medium text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 outline-none appearance-none cursor-pointer pr-8"
                      value=""
                      onChange={(e) => {
                        if (e.target.value !== '') {
                          const age = Number(e.target.value);
                          onUpdateForm('childs', [...form.childs, age]);
                        }
                      }}
                    >
                      <option value="" disabled>
                        Добавить ребёнка
                      </option>
                      <option value="0">До 1 года</option>
                      <option value="1">1 год</option>
                      <option value="2">2 года</option>
                      <option value="3">3 года</option>
                      <option value="4">4 года</option>
                      <option value="5">5 лет</option>
                      <option value="6">6 лет</option>
                      <option value="7">7 лет</option>
                      <option value="8">8 лет</option>
                      <option value="9">9 лет</option>
                      <option value="10">10 лет</option>
                      <option value="11">11 лет</option>
                      <option value="12">12 лет</option>
                      <option value="13">13 лет</option>
                      <option value="14">14 лет</option>
                      <option value="15">15 лет</option>
                      <option value="16">16 лет</option>
                      <option value="17">17 лет</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                )}

                {/* ADD ROOM BUTTON */}
                <button
                  type="button"
                  onClick={() => setActivePopover(null)}
                  className="w-full mt-2 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Добавить номер
                </button>

                <div className="pt-2 text-[11px] text-slate-400 text-center">
                  Можно бронировать <span className="font-semibold text-slate-600 dark:text-slate-300">только одинаковые номера</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="button"
          onClick={() => {
            setActivePopover(null);
            onSubmit();
          }}
          disabled={isSearching}
          className="min-h-[72px] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white font-bold rounded-2xl px-6 py-3 shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 text-base shrink-0 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          <span className="whitespace-nowrap">
            {isSearching ? 'Ищем...' : 'Найти туры'}
          </span>
        </button>
      </div>
    </div>
  );
}
