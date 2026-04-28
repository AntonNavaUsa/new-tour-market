import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import CardTypeIcon from '../components/CardTypeIcon';
import type { CardType } from '../types';

export function AdminCardTypesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-card-types', search],
    queryFn: async () => {
      const cardTypes = await metaApi.getCardTypes();
      if (search) {
        return cardTypes.filter(
          (type) =>
            type.name.toLowerCase().includes(search.toLowerCase()) ||
            type.slug.toLowerCase().includes(search.toLowerCase())
        );
      }
      return cardTypes;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => metaApi.deleteCardType(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-card-types'] });
      await queryClient.invalidateQueries({ queryKey: ['card-types'] });
      setError('');
    },
    onError: (mutationError) => {
      setError(handleApiError(mutationError));
    },
  });

  const cardTypes = data ?? [];

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление типами карточек</h1>
          <p className="text-muted-foreground">
            Создание, редактирование и удаление типов карточек.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/card-types/new">
            <Plus className="mr-2 h-4 w-4" />
            Новый тип
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              placeholder="Поиск по названию или slug"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : cardTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Типы карточек не найдены.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {cardTypes.map((type: CardType) => (
            <Card key={type.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                    <CardTypeIcon icon={type.icon} className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{type.name}</h3>
                    <div className="text-sm text-muted-foreground">
                      slug: <code>{type.slug}</code>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/card-types/${type.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Изменить
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Удалить тип "${type.name}"?`)) {
                        deleteMutation.mutate(type.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
