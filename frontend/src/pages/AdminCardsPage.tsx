import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { cardsApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { formatPrice } from '../lib/utils';
import type { CardStatus } from '../types';

export function AdminCardsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | CardStatus>('ALL');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cards', search, status],
    queryFn: () =>
      cardsApi.getCards({
        includeNonPublished: true,
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        take: 100,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cardsApi.deleteCard(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      setError('');
    },
    onError: (mutationError) => {
      setError(handleApiError(mutationError));
    },
  });

  const cards = data?.data ?? [];

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление карточками</h1>
          <p className="text-muted-foreground">
            Создание, редактирование и удаление туров из админки.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/cards/new">
            <Plus className="mr-2 h-4 w-4" />
            Новая карточка
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              placeholder="Поиск по названию или описанию"
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'ALL' | CardStatus)}
          >
            <option value="ALL">Все статусы</option>
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликовано</option>
            <option value="ARCHIVED">Архив</option>
          </select>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Карточки не найдены.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((cardItem) => {
            const firstPrice = cardItem.tickets?.[0]?.prices?.[0]?.adultPrice;
            const locationLabel = cardItem.location
              ? [cardItem.location.city, cardItem.location.country].filter(Boolean).join(', ')
              : 'Локация не указана';

            return (
              <Card key={cardItem.id} className="flex h-full flex-col">
                {cardItem.headPhotoUrl ? (
                  <div className="h-44 overflow-hidden rounded-t-lg">
                    <img
                      src={cardItem.headPhotoUrl}
                      alt={cardItem.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="line-clamp-2">{cardItem.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {cardItem.shortDescription || cardItem.description}
                      </CardDescription>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                      {cardItem.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>{locationLabel}</div>
                    <div>{cardItem.cardType?.name || 'Тип не указан'}</div>
                    <div>{cardItem.user?.name || 'Автор не указан'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Цена от</div>
                      <div className="text-lg font-semibold">
                        {firstPrice ? formatPrice(firstPrice) : 'Уточняется'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/cards/${cardItem.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Изменить
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Удалить карточку "${cardItem.title}"?`)) {
                            deleteMutation.mutate(cardItem.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}