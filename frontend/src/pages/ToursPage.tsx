import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cardsApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { formatPrice, formatDuration, getMinPriceFromTiers } from '../lib/utils';
import { Search, MapPin, Clock, Users } from 'lucide-react';
import type { CardFilterParams, Card as CardType } from '../types';

// Найти минимальную цену среди всех тикетов карточки
function getMinPrice(card: CardType): number | null {
  if (!card.tickets || card.tickets.length === 0) {
    return null;
  }

  let minPrice: number | null = null;

  for (const ticket of card.tickets) {
    if (!ticket.prices || ticket.prices.length === 0) {
      continue;
    }

    for (const price of ticket.prices) {
      if ((price as any).isArchived) continue;

      const rawTiers = (price as any).groupTiers;
      const tiers = typeof rawTiers === 'string' ? JSON.parse(rawTiers) : Array.isArray(rawTiers) ? rawTiers : null;
      if (tiers && tiers.length > 0) {
        const tierMin = getMinPriceFromTiers(tiers);
        if (minPrice === null || tierMin < minPrice) minPrice = tierMin;
        continue;
      }

      const adultPrice = parseFloat(price.adultPrice);
      if (!isNaN(adultPrice) && adultPrice > 0 && (minPrice === null || adultPrice < minPrice)) {
        minPrice = adultPrice;
      }
    }
  }

  return minPrice;
}

export function ToursPage() {
  const [filters, setFilters] = useState<CardFilterParams>({
    skip: 0,
    take: 12,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cards', filters],
    queryFn: () => cardsApi.getCards(filters),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchQuery, skip: 0 }));
  };

  if (error) {
    return (
      <div className="container py-12 text-center">
        <p className="text-destructive">Ошибка загрузки туров. Попробуйте позже.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Каталог туров</h1>
        <p className="text-muted-foreground">
          Выберите незабываемое приключение из нашего каталога
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск туров..."
              className="pl-10"
            />
          </div>
          <Button type="submit">Найти</Button>
        </div>
      </form>

      {/* Tours Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((card) => (
              <Link key={card.id} to={`/tours/${card.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  {card.headPhotoUrl ? (
                    <div className="h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={card.headPhotoUrl}
                        alt={card.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-muted rounded-t-lg flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{card.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {card.shortDescription || card.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {card.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{card.location.city || card.location.country}</span>
                        </div>
                      )}
                      {card.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(card.duration)}</span>
                        </div>
                      )}
                      {card.maxParticipants && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>до {card.maxParticipants}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between items-center">
                    {(() => {
                      const minPrice = getMinPrice(card);
                      return minPrice !== null ? (
                        <div>
                          <p className="text-sm text-muted-foreground">от</p>
                          <p className="text-2xl font-bold">
                            {formatPrice(minPrice.toString())}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground">Цена</p>
                          <p className="font-semibold">Уточняйте</p>
                        </div>
                      );
                    })()}
                    <Button variant="outline">Подробнее</Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data.meta.hasMore && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => setFilters((prev) => ({ ...prev, skip: (prev.skip || 0) + (prev.take || 12) }))}
              >
                Загрузить еще
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Туры не найдены. Попробуйте изменить параметры поиска.</p>
        </div>
      )}
    </div>
  );
}
