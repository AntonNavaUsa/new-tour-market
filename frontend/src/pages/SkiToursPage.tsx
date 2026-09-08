import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Search, SlidersHorizontal, Snowflake, Star } from 'lucide-react';
import { accommodationsApi } from '../lib/api/accommodationsApi';
import { metaApi } from '../lib/api/meta';
import { buildLocationTree, getDescendantIds } from '../lib/locationTree';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

const STAR_OPTIONS = [3, 4, 5];

function locationLabel(location: { city: string | null; region: string | null; parentId?: string | null }) {
  return location.region ? `${location.city}, ${location.region}` : location.city;
}

export function SkiToursPage() {
  const [search, setSearch] = useState('');
  const [skiInSkiOut, setSkiInSkiOut] = useState(false);
  const [stars, setStars] = useState<number | undefined>();
  const [locationIds, setLocationIds] = useState<string[]>([]);

  const { data: locations = [] } = useQuery({
    queryKey: ['ski-tour-locations'],
    queryFn: metaApi.getLocations,
    staleTime: 60000,
  });

  const locationTree = buildLocationTree(locations);
  const selectedLocationIds = locationIds.flatMap((locationId) => [locationId, ...getDescendantIds(locations, locationId)]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ski-hotels', search, skiInSkiOut, stars, locationIds],
    queryFn: () => accommodationsApi.getSkiHotels({
      search: search.trim() || undefined,
      skiInSkiOut: skiInSkiOut || undefined,
      stars,
      locationIds: selectedLocationIds.length ? selectedLocationIds : undefined,
      take: 100,
    }),
  });

  const hotels = data?.data ?? [];
  const hasFilters = Boolean(search || skiInSkiOut || stars || locationIds.length);

  const clearFilters = () => {
    setSearch('');
    setSkiInSkiOut(false);
    setStars(undefined);
    setLocationIds([]);
  };

  return (
    <main className="min-h-screen bg-stone-50/70">
      <section className="border-b bg-emerald-950 text-white">
        <div className="container py-12 sm:py-16">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-amber-300">
              <Snowflake className="h-4 w-4" />
              Зимний отдых в горах
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Горнолыжные туры</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50/80 sm:text-lg">
              Подберите отель рядом со склоном и курортом. Выберите подходящую локацию и формат размещения.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-lg border bg-white p-5 lg:sticky lg:top-20">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
                Фильтры
              </h2>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-emerald-700 hover:underline">
                  Сбросить
                </button>
              )}
            </div>

            <label className="mb-5 block">
              <span className="mb-2 block text-sm font-medium">Поиск по названию</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Например, Поляна"
                  className="pl-9"
                />
              </div>
            </label>

            <label className="mb-6 flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={skiInSkiOut}
                onChange={(event) => setSkiInSkiOut(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-emerald-700"
              />
              <span>
                <span className="block font-medium">Ski-in / ski-out</span>
                <span className="mt-1 block text-xs text-muted-foreground">Выход прямо к склону или подъёмнику</span>
              </span>
            </label>

            <fieldset className="mb-6">
              <legend className="mb-2 text-sm font-medium">Звездность</legend>
              <div className="flex flex-wrap gap-2">
                {STAR_OPTIONS.map((value) => (
                  <button
                    key={value}
                    onClick={() => setStars(stars === value ? undefined : value)}
                    className={`flex items-center gap-1 rounded border px-3 py-1.5 text-sm transition-colors ${
                      stars === value ? 'border-emerald-700 bg-emerald-50 text-emerald-800' : 'bg-white hover:border-emerald-400'
                    }`}
                  >
                    {value} <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium">Локации</legend>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {locationTree.map(({ item: location, depth, hasChildren }) => (
                  <label
                    key={location.id}
                    className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-emerald-50/50 ${
                      depth > 0 ? 'border-l-2 border-emerald-200' : ''
                    }`}
                    style={{ marginLeft: `${depth * 0.55}rem` }}
                  >
                    <input
                      type="checkbox"
                      checked={locationIds.includes(location.id)}
                      onChange={(event) => setLocationIds((current) => event.target.checked
                        ? [...current, location.id]
                        : current.filter((id) => id !== location.id))}
                      className="mt-0.5 h-4 w-4 accent-emerald-700"
                    />
                    <span className="flex items-center gap-2">
                      {depth > 0 && <span className="text-xs text-emerald-700">↳</span>}
                      <span>{depth === 0 ? locationLabel(location) : location.city}</span>
                      {hasChildren && <span className="text-[11px] text-emerald-700/80">включает курорты</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </aside>

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Отели для отдыха на склонах</h2>
                {!isLoading && !isError && (
                  <p className="mt-1 text-sm text-muted-foreground">Найдено: {data?.meta.total ?? 0}</p>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-96 animate-pulse rounded-lg bg-white" />)}
              </div>
            ) : isError ? (
              <div className="rounded-lg border bg-white p-10 text-center">
                <p className="text-muted-foreground">Не удалось загрузить список отелей.</p>
                <Button className="mt-4" onClick={() => window.location.reload()}>Повторить</Button>
              </div>
            ) : hotels.length === 0 ? (
              <div className="rounded-lg border bg-white p-12 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <h3 className="mt-4 font-semibold">По вашему запросу ничего не найдено</h3>
                <p className="mt-2 text-sm text-muted-foreground">Попробуйте изменить локацию или сбросить фильтры.</p>
                {hasFilters && <Button variant="outline" className="mt-5" onClick={clearFilters}>Сбросить фильтры</Button>}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {hotels.map((hotel) => (
                  <Card key={hotel.id} className="overflow-hidden bg-white transition-shadow hover:shadow-md">
                    <Link to={`/accommodations/${hotel.id}`} className="block">
                      {hotel.photos?.[0]?.thumbUrl || hotel.photos?.[0]?.url ? (
                        <img
                          src={hotel.photos[0].thumbUrl || hotel.photos[0].url}
                          alt={hotel.name}
                          className="h-52 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-52 items-center justify-center bg-emerald-50">
                          <Building2 className="h-14 w-14 text-emerald-900/20" />
                        </div>
                      )}
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold leading-tight">{hotel.name}</h3>
                          {hotel.stars != null && (
                            <span className="flex shrink-0 items-center gap-0.5 text-amber-500" aria-label={`${hotel.stars} звезд`}>
                              {Array.from({ length: hotel.stars }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}
                            </span>
                          )}
                        </div>
                        {hotel.locations && hotel.locations.length > 0 && (
                          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {hotel.locations.map((item) => locationLabel(item.location)).join(' · ')}
                          </p>
                        )}
                        {hotel.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-foreground/75">{hotel.description}</p>}
                        {hotel.skiInSkiOut && (
                          <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                            Ski-in / ski-out
                          </span>
                        )}
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
