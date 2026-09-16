import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Star,
  Heart,
  MapPin,
  Compass,
  ChevronRight,
  ChevronDown,
  Loader2,
  Plane,
  Wifi,
  Umbrella,
  CheckCircle2,
} from 'lucide-react';
import { tourSearchApi } from '../lib/api';
import { TourSearchBar } from '../components/TourSearchBar';
import { useTourSearchForm } from '../lib/useTourSearchForm';
import type { TourSearchForm, TourSearchResult, TourSearchStatus } from '../types';

const PAGE_SIZE = 18;

// Sletat returns one row per offer (hotel + room + meal + operator + flight combination).
function getHotelGroupKey(result: TourSearchResult): string {
  return result.hotelcode
    ? `code:${result.hotelcode}`
    : `name:${(result.name || '').trim().toLowerCase()}|${(result.region?.name || '').trim().toLowerCase()}|${(result.country?.name || '').trim().toLowerCase()}`;
}

// Group all offers by hotel and keep only the cheapest one so the grid shows one card per hotel.
function groupResultsByHotel(results: TourSearchResult[]): TourSearchResult[] {
  const groups = new Map<string, TourSearchResult>();
  const offersCount = new Map<string, number>();

  for (const result of results) {
    const key = getHotelGroupKey(result);
    offersCount.set(key, (offersCount.get(key) || 0) + 1);

    const existing = groups.get(key);
    if (!existing || (result.price > 0 && (existing.price <= 0 || result.price < existing.price))) {
      groups.set(key, result);
    }
  }

  return Array.from(groups.entries()).map(([key, result]) => ({
    ...result,
    offersCount: offersCount.get(key),
  }));
}

// Build a map from hotel group key to every raw offer, so the hotel page can show all room/price variants.
function groupOffersByHotel(results: TourSearchResult[]): Map<string, TourSearchResult[]> {
  const offersByKey = new Map<string, TourSearchResult[]>();
  for (const result of results) {
    const key = getHotelGroupKey(result);
    const list = offersByKey.get(key);
    if (list) list.push(result);
    else offersByKey.set(key, [result]);
  }
  return offersByKey;
}

function SearchProgressBar({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function HotelTourCard({ result, offers, form }: { result: TourSearchResult; offers: TourSearchResult[]; form: TourSearchForm }) {
  const imageUrl = result.picturelink || result.picture || result.images?.[0];
  const hotelName = result.name || 'Отель';
  const location = [result.region?.name, result.country?.name].filter(Boolean).join(', ');
  const starsCount = Math.max(0, Math.min(5, Math.round(result.category || result.stars || 0)));
  const rating = typeof result.rating === 'number' && result.rating > 0 ? result.rating.toFixed(1) : null;
  const priceFormatted = result.price ? `${result.price.toLocaleString('ru-RU')} ₽` : 'по запросу';
  const totalGuests = form.adults + form.childs.length;
  const nightsLabel = result.nights ? `${result.nights} ${result.nights === 1 ? 'ночь' : result.nights < 5 ? 'ночи' : 'ночей'}` : null;
  const beachDetails = [result.hotel?.beachLine, result.hotel?.beachType].filter(Boolean).join(' • ');
  const discount = typeof result.discountPercent === 'number' && result.discountPercent > 0 ? Math.round(result.discountPercent) : null;
  const benefits = result.benefits?.filter(Boolean).slice(0, 4) || [];

  return (
    <article className="group relative flex h-full min-h-[620px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:hover:shadow-zinc-900/50">
      {/* CARD IMAGE HEADER */}
      <div className="relative h-52 min-h-52 w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-zinc-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={hotelName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Compass className="h-10 w-10 opacity-40" />
          </div>
        )}

        {/* OVERLAY GRADIENT */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* FAVORITE BUTTON */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-800 transition"
            title="Добавить в подборку"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        {/* BOTTOM BADGE OVER IMAGE */}
        {location && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1 text-xs font-medium text-white/90 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-400" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {rating && <span className="rounded-full bg-lime-600 px-2.5 py-1 font-bold text-white">{rating}</span>}
            <span className="text-slate-400">
              {result.reviewsCount !== undefined && result.reviewsCount > 0
                ? `${result.reviewsCount} ${result.reviewsCount === 1 ? 'отзыв' : 'отзывов'}`
                : 'Нет отзывов'}
            </span>
            {starsCount > 0 && (
              <span className="ml-auto flex items-center gap-0.5" aria-label={`${starsCount} звезд`}>
                {Array.from({ length: starsCount }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-amber-500 text-amber-500" />
                ))}
              </span>
            )}
          </div>

          <Link
            to={`/tour-search/hotel/${result.id}`}
            state={{ hotel: result, offers, form }}
            className="block"
          >
            <h3 className="line-clamp-2 min-h-[3.25rem] text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
              {hotelName}
            </h3>
          </Link>

          <div className="flex flex-wrap gap-2 text-sm text-slate-700 dark:text-slate-300">
            {result.meal?.name && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {result.meal.name}
              </span>
            )}
            {result.roomType && (
              <span className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-zinc-800 dark:text-slate-300">
                {result.roomType}
              </span>
            )}
          </div>

          {(beachDetails || result.hotel?.airportDistance || result.hotel?.wifi) && (
            <div className="flex flex-wrap gap-2 text-sm text-slate-700 dark:text-slate-300">
              {beachDetails && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 dark:bg-zinc-800"><Umbrella className="h-4 w-4 text-sky-600" />{beachDetails}</span>}
              {result.hotel?.airportDistance && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 dark:bg-zinc-800"><Plane className="h-4 w-4 text-sky-600" />{result.hotel.airportDistance}</span>}
              {result.hotel?.wifi && <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-2 dark:bg-zinc-800"><Wifi className="h-4 w-4 text-sky-600" />{result.hotel.wifi}</span>}
            </div>
          )}

          {benefits.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              {benefits.map((benefit) => <span key={benefit} className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{benefit}</span>)}
            </div>
          )}
        </div>

        {/* CARD FOOTER */}
          <div className="flex min-h-[92px] flex-col justify-end space-y-3 border-t border-slate-100 pt-3 dark:border-zinc-800/80">
          <div className="flex items-end justify-between gap-3">
            <span className="text-xs text-slate-400 font-medium">
              1 номер, {totalGuests} {totalGuests === 1 ? 'гость' : 'гостей'}
              {result.offersCount && result.offersCount > 1 && (
                <span className="ml-1.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-zinc-800 dark:text-slate-400">
                  {result.offersCount} предложений
                </span>
              )}
            </span>
            <div className="text-right">
              {nightsLabel && <span className="mb-1 block text-xs text-slate-400">{nightsLabel}</span>}
              <span className="text-xs text-slate-400 block font-normal">от</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {priceFormatted}
              </span>
              {discount && <span className="ml-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">-{discount}%</span>}
            </div>
          </div>

          <Link
            to={`/tour-search/hotel/${result.id}`}
            state={{ hotel: result, offers, form }}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              localStorage.setItem(`tour-search-hotel-${result.id}`, JSON.stringify({ hotel: result, offers, form }));
            }}
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-bold rounded-2xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>Показать туры</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function TourSearchPage() {
  const location = useLocation();
  const initialFormFromNavigation = location.state?.form as TourSearchForm | undefined;
  const searchForm = useTourSearchForm(initialFormFromNavigation);
  const { form } = searchForm;
  const autoSubmitHandled = useRef(false);
  const [searchId, setSearchId] = useState<number | null>(null);
  const [status, setStatus] = useState<TourSearchStatus | null>(null);
  const [results, setResults] = useState<TourSearchResult[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const searchMutation = useMutation({
    mutationFn: tourSearchApi.startSearch,
    onSuccess: (data) => {
      setSearchId(data.searchId);
      setStatus(null);
      setResults([]);
      setVisibleCount(PAGE_SIZE);
      setErrorMessage('');
    },
    onError: () => setErrorMessage('Не удалось запустить поиск. Проверьте параметры и попробуйте еще раз.'),
  });

  useEffect(() => {
    if (!searchId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const fetchLimit = Math.max(visibleCount + PAGE_SIZE, 100);
        const [nextStatus, nextResults] = await Promise.all([
          tourSearchApi.getStatus(searchId),
          tourSearchApi.getResults(searchId, fetchLimit),
        ]);
        if (cancelled) return;
        setStatus(nextStatus);
        setResults(Array.isArray(nextResults) ? nextResults : []);
        const isCompleted = ['done', 'complete', 'finished', 'completed', 'timeout'].includes(nextStatus.status.toLowerCase());
        if (!isCompleted) {
          timer = setTimeout(poll, 3000);
        }
      } catch {
        if (!cancelled) setErrorMessage('Не удалось получить результаты поиска. Попробуйте обновить страницу.');
      }
    };

    timer = setTimeout(poll, 3500);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [searchId, visibleCount]);

  const updateSearchState = () => {
    setSearchId(null);
    setStatus(null);
    setResults([]);
    setVisibleCount(PAGE_SIZE);
  };

  const updateForm = <K extends keyof TourSearchForm>(key: K, value: TourSearchForm[K]) => {
    updateSearchState();
    searchForm.updateForm(key, value);
  };

  const changeDeparture = (departureId: number | null) => {
    updateSearchState();
    searchForm.changeDeparture(departureId);
  };

  const submit = () => {
    if (searchForm.validate()) searchMutation.mutate(form);
  };

  useEffect(() => {
    if (!location.state?.autoSubmit || autoSubmitHandled.current) return;
    autoSubmitHandled.current = true;
    if (initialFormFromNavigation) {
      searchMutation.mutate(initialFormFromNavigation);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [initialFormFromNavigation, location.pathname, location.state, searchMutation]);

  const handleLoadMore = async () => {
    if (!searchId) return;
    setIsLoadingMore(true);
    const nextCount = visibleCount + PAGE_SIZE;
    try {
      if (nextCount > results.length) {
        const freshResults = await tourSearchApi.getResults(searchId, Math.max(nextCount, 100));
        setResults(Array.isArray(freshResults) ? freshResults : []);
      }
      setVisibleCount(nextCount);
    } catch {
      // Keep current count on error
    } finally {
      setIsLoadingMore(false);
    }
  };

  const isSearching = searchMutation.isPending || (searchId !== null && (!status || status.progress < 100) && results.length === 0);
  const isFinished = status ? ['done', 'complete', 'finished', 'completed', 'timeout'].includes(status.status.toLowerCase()) : false;
  const filteredResults = groupResultsByHotel(results);
  const offersByHotelKey = groupOffersByHotel(results);

  const displayedResults = filteredResults.slice(0, visibleCount);

  // Show "Load More" button if there are more results available in array or if search is still ongoing
  const hasMore = visibleCount < filteredResults.length || (!isFinished && results.length > 0);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-indigo-100 via-background to-background px-4 py-10 sm:py-16" aria-label="Поиск туров">
      <div className="container max-w-7xl">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Путешествия без лишнего поиска</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Найдите свой тур</h1>
          <p className="mt-4 text-muted-foreground">Сравним предложения туроператоров по вашим датам и направлению.</p>
        </header>

        <section aria-label="Параметры поиска туров">
          <TourSearchBar
            form={form}
            departures={searchForm.departures}
            countries={searchForm.countries}
            regions={searchForm.regions}
            meals={searchForm.meals}
            hotels={searchForm.hotels}
            isHotelsLoading={searchForm.isHotelsLoading}
            hotelSearch={searchForm.hotelSearch}
            onHotelSearchChange={searchForm.setHotelSearch}
            availableDates={searchForm.availableDates}
            isDeparturesLoading={searchForm.isDeparturesLoading}
            isCountriesLoading={searchForm.isCountriesLoading}
            isSearching={isSearching}
            onUpdateForm={updateForm}
            onChangeDeparture={changeDeparture}
            onSubmit={submit}
            invalidField={searchForm.invalidField}
            validationNonce={searchForm.validationNonce}
            advancedOpen={isSearching || Boolean(searchId)}
          />

          {errorMessage && (
            <p className="px-3 pt-3 text-sm text-destructive font-medium" role="alert">
              {errorMessage}
            </p>
          )}
        </section>

        {searchId && (
          <section className="mt-10" aria-live="polite">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Результаты поиска
                {results.length > 0 && (
                  <span className="ml-3 text-sm font-normal text-slate-500 dark:text-slate-400">
                    (найдено {filteredResults.length} {filteredResults.length === 1 ? 'отель' : 'отелей'}, {results.length} {results.length === 1 ? 'предложение' : 'предложений'})
                  </span>
                )}
              </h2>
              {status && !isFinished && (
                <div className="flex shrink-0 items-center gap-2 text-sm text-orange-600 dark:text-orange-400 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{status.progress}%</span>
                </div>
              )}
            </div>

            {status && !isFinished && results.length > 0 && (
              <div className="mb-6">
                <SearchProgressBar progress={status.progress} />
              </div>
            )}

            {results.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                {status && (
                  <div className="w-full max-w-xs">
                    <SearchProgressBar progress={status.progress} />
                    <p className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400">{status.progress}%</p>
                  </div>
                )}
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">Ищем подходящие предложения туроператоров...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-slate-500 shadow-sm">
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">По выбранным фильтрам туры не найдены.</p>
              </div>
            ) : (
              <>
                {/* 3 CARDS PER ROW GRID */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {displayedResults.map((result, index) => (
                    <div key={`${result.id}-${index}`} className="animate-in fade-in slide-in-from-bottom-3 duration-300">
                      <HotelTourCard result={result} offers={offersByHotelKey.get(getHotelGroupKey(result)) ?? [result]} form={form} />
                    </div>
                  ))}
                </div>

                {/* LOAD MORE BUTTON */}
                {hasMore && (
                  <div className="mt-12 flex flex-col items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-orange-500/80 hover:border-orange-500 px-8 py-3.5 text-base font-bold text-orange-600 dark:text-orange-400 shadow-md shadow-orange-500/10 hover:bg-orange-500 hover:text-white transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoadingMore ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                      )}
                      <span>
                        {isLoadingMore
                          ? 'Загрузка туров...'
                          : `Показать еще ${Math.min(PAGE_SIZE, Math.max(0, filteredResults.length - visibleCount) || PAGE_SIZE)} туров`}
                      </span>
                    </button>
                    <span className="text-xs text-slate-400 font-medium">
                      Показано {displayedResults.length} из {filteredResults.length} найденных туров
                    </span>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
