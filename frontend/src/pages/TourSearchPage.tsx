import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { tourSearchApi } from '../lib/api';
import { TourSearchBar } from '../components/TourSearchBar';
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

  const isSearching = searchMutation.isPending || searchId !== null;

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
            departures={departuresQuery.data}
            countries={countriesQuery.data}
            availableDates={datesQuery.data}
            isDeparturesLoading={departuresQuery.isLoading}
            isCountriesLoading={countriesQuery.isLoading}
            isSearching={isSearching}
            onUpdateForm={updateForm}
            onChangeDeparture={changeDeparture}
            onSubmit={submit}
          />

          {errorMessage && (
            <p className="px-3 pt-3 text-sm text-destructive font-medium" role="alert">
              {errorMessage}
            </p>
          )}
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
