import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cardsApi } from '../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { formatPrice, formatDuration, getMinPriceFromTiers } from '../lib/utils';
import { MapPin, Clock, Users } from 'lucide-react';
import type { CardFilterParams, Card as TourCard } from '../types';

// Найти минимальную цену среди всех тикетов карточки
function getMinPrice(card: TourCard): number | null {
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

function groupByType(cards: TourCard[]): Map<string, TourCard[]> {
  const groups = new Map<string, TourCard[]>();
  for (const card of cards) {
    const key = card.cardType?.name ?? 'Другие';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(card);
  }
  return new Map(
    [...groups.entries()].sort(([, a], [, b]) => {
      const orderA = a[0]?.cardType?.sortOrder ?? 999;
      const orderB = b[0]?.cardType?.sortOrder ?? 999;
      return orderA - orderB;
    })
  );
}

export function ToursPage() {
  const [filters] = useState<CardFilterParams>({
    skip: 0,
    take: 100,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['cards', filters],
    queryFn: () => cardsApi.getCards(filters),
  });

  if (error) {
    return (
      <div className="container py-12 text-center">
        <p className="text-destructive">Ошибка загрузки туров. Попробуйте позже.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">

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
        <div className="space-y-12">
          {Array.from(groupByType(data.data)).map(([typeName, cards]) => (
            <section key={typeName}>
              <h2 className="text-2xl font-bold mb-6 pb-2 border-b">{typeName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
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
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Туры не найдены.</p>
        </div>
      )}
    </div>
  );
}
