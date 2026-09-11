import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, Loader2, Search, Users } from 'lucide-react';
import { tourSearchApi } from '../lib/api';
import type { TourSearchForm, TourSearchResult, TourSearchStatus } from '../types';

const initialForm: TourSearchForm = {
  departureId: null,
  countryId: null,
  dateFrom: '',
  dateTo: '',
  nightsFrom: 7,
  nightsTo: 10,
  adults: 2,
  childs: [],
  currency: 'RUB',
  onlyCharter: false,
  onlyDirect: false,
};


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="relative flex min-h-[86px] min-w-0 flex-col justify-center bg-[#edf4f2] px-5 py-3 hover:bg-[#e5efec]">
      <span className="mb-1 block truncate text-sm leading-5 text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function TourSearchPage() {
  const [form, setForm] = useState<TourSearchForm>(initialForm);
  const [searchId, setSearchId] = useState<number | null>(null);
  const [status, setStatus] = useState<TourSearchStatus | null>(null);
  const [results, setResults] = useState<TourSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const departuresQuery = useQuery({
    queryKey: ['tour-search', 'departures'],
    queryFn: tourSearchApi.getDepartures,
  });
  const countriesQuery = useQuery({
    queryKey: ['tour-search', 'countries', form.departureId],
    queryFn: () => tourSearchApi.getCountries(form.departureId!),
    enabled: form.departureId !== null,
  });
  const datesQuery = useQuery({
    queryKey: ['tour-search', 'dates', form.departureId, form.countryId],
    queryFn: () => tourSearchApi.getDates(form.departureId!, form.countryId!),
    enabled: form.departureId !== null && form.countryId !== null,
  });

  const searchMutation = useMutation({
    mutationFn: tourSearchApi.startSearch,
    onSuccess: (data) => {
      setSearchId(data.searchId);
      setStatus(null);
      setResults([]);
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
        const [nextStatus, nextResults] = await Promise.all([
          tourSearchApi.getStatus(searchId),
          tourSearchApi.getResults(searchId),
        ]);
        if (cancelled) return;
        setStatus(nextStatus);
        setResults(nextResults);
        if (!['done', 'complete', 'finished', 'completed'].includes(nextStatus.status.toLowerCase())) {
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
  }, [searchId]);

  const updateForm = <K extends keyof TourSearchForm>(key: K, value: TourSearchForm[K]) => {
    setSearchId(null);
    setStatus(null);
    setResults([]);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const changeDeparture = (departureId: number | null) => {
    setSearchId(null);
    setStatus(null);
    setResults([]);
    setForm({ ...initialForm, departureId });
  };

  const submit = () => {
    if (!form.departureId || !form.countryId || !form.dateFrom || !form.dateTo) {
      setErrorMessage('Выберите город вылета, страну и диапазон дат.');
      return;
    }
    if (form.nightsFrom > form.nightsTo || form.nightsTo - form.nightsFrom > 10) {
      setErrorMessage('Диапазон ночей должен быть от 1 до 10 ночей.');
      return;
    }
    searchMutation.mutate(form);
  };

  const departureName = departuresQuery.data?.find((item) => item.id === form.departureId)?.name || 'Выберите город';
  const countryName = countriesQuery.data?.find((item) => item.id === form.countryId)?.name || 'Выберите страну';
  const isSearching = searchMutation.isPending || searchId !== null;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-indigo-100 via-background to-background px-4 py-10 sm:py-16" aria-label="Поиск туров">
      <div className="container max-w-7xl">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Путешествия без лишнего поиска</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Найдите свой тур</h1>
          <p className="mt-4 text-muted-foreground">Сравним предложения туроператоров по вашим датам и направлению.</p>
        </header>

        <section className="rounded-[28px] bg-white p-3 shadow-xl shadow-indigo-200/40 sm:p-4" aria-label="Параметры поиска туров">
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white md:grid-cols-[minmax(150px,1.1fr)_minmax(150px,1.1fr)_minmax(235px,1.45fr)_minmax(155px,1fr)_minmax(150px,1fr)_minmax(165px,auto)]">
            <Field label="Откуда">
              <select
                className="w-full min-w-0 appearance-none truncate bg-transparent pr-6 text-lg font-medium outline-none"
                value={form.departureId ?? ''}
                onChange={(event) => changeDeparture(Number(event.target.value) || null)}
              >
                <option value="">{departuresQuery.isLoading ? 'Загрузка...' : departureName}</option>
                {departuresQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute ml-[calc(100%-2rem)] mt-7 h-4 w-4 text-foreground" aria-hidden="true" />
            </Field>
            <Field label="Куда">
              <select
                className="w-full min-w-0 appearance-none truncate bg-transparent pr-6 text-lg font-medium outline-none disabled:text-muted-foreground"
                value={form.countryId ?? ''}
                disabled={!form.departureId}
                onChange={(event) => updateForm('countryId', Number(event.target.value) || null)}
              >
                <option value="">{countryName}</option>
                {countriesQuery.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute ml-[calc(100%-2rem)] mt-7 h-4 w-4 text-foreground" aria-hidden="true" />
            </Field>
            <Field label="Дата вылета">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-base font-medium">
                <div className="relative min-w-0">
                  <input aria-label="Дата от" type="date" min={datesQuery.data?.[0]} value={form.dateFrom} onChange={(event) => updateForm('dateFrom', event.target.value)} className="block w-full min-w-0 bg-transparent pr-5 text-sm outline-none" />
                  <CalendarDays className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="relative min-w-0">
                  <input aria-label="Дата до" type="date" max={datesQuery.data?.at(-1)} value={form.dateTo} onChange={(event) => updateForm('dateTo', event.target.value)} className="block w-full min-w-0 bg-transparent pr-5 text-sm outline-none" />
                  <CalendarDays className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
                </div>
              </div>
            </Field>
            <Field label="На сколько">
              <div className="flex min-w-0 items-center gap-2 text-lg font-medium">
                <input aria-label="Ночей от" type="number" min="1" max="28" value={form.nightsFrom} onChange={(event) => updateForm('nightsFrom', Number(event.target.value))} className="w-12 min-w-0 bg-transparent outline-none" />
                <span className="text-muted-foreground">-</span>
                <input aria-label="Ночей до" type="number" min="1" max="28" value={form.nightsTo} onChange={(event) => updateForm('nightsTo', Number(event.target.value))} className="w-12 min-w-0 bg-transparent outline-none" />
                <span className="truncate">ночей</span>
              </div>
            </Field>
            <Field label="Кто едет">
              <div className="flex min-w-0 items-center gap-2 text-lg font-medium">
                <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input aria-label="Взрослых" type="number" min="1" max="6" value={form.adults} onChange={(event) => updateForm('adults', Number(event.target.value))} className="w-10 min-w-0 bg-transparent outline-none" />
                <span className="truncate">взрослых</span>
              </div>
            </Field>
            <button type="button" onClick={submit} disabled={isSearching} className="flex min-h-[86px] items-center justify-center gap-2 bg-orange-500 px-5 text-lg font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70">
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              {searchMutation.isPending ? 'Ищем...' : searchId ? 'Идет поиск' : 'Найти тур'}
            </button>
          </div>

          {errorMessage && <p className="px-3 pt-3 text-sm text-destructive" role="alert">{errorMessage}</p>}
        </section>

        {searchId && (
          <section className="mt-8" aria-live="polite">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Результаты поиска</h2>
              {status && <span className="text-sm text-muted-foreground">Готово: {status.progress}%</span>}
            </div>
            {results.length === 0 ? (
              <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">Ищем подходящие предложения...</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {results.map((result) => (
                  <article key={result.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                    {result.picturelink ? <img src={result.picturelink} alt={result.name} className="h-44 w-full object-cover" /> : <div className="h-44 bg-muted" />}
                    <div className="p-5">
                      <h3 className="font-semibold">{result.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{result.country?.name}{result.region?.name ? `, ${result.region.name}` : ''}</p>
                      <p className="mt-4 text-xl font-bold">от {result.price.toLocaleString('ru-RU')} {result.currency}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
