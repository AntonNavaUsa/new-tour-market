import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import type { TariffType } from '../types';

export function AdminTariffTypesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tariff-types'],
    queryFn: () => metaApi.getTariffTypes(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => metaApi.deleteTariffType(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-tariff-types'] });
      await queryClient.invalidateQueries({ queryKey: ['tariff-types'] });
      setError('');
    },
    onError: (mutationError) => {
      setError(handleApiError(mutationError));
    },
  });

  const tariffTypes: TariffType[] = (data ?? []).filter(
    (t) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление тарифами</h1>
          <p className="text-muted-foreground">
            Создание, редактирование и удаление типов тарифов (Взрослый, Детский и т.д.).
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/tariff-types/new">
            <Plus className="mr-2 h-4 w-4" />
            Новый тариф
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : tariffTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">
              {search ? 'Тарифы не найдены' : 'Тарифы пока не созданы'}
            </p>
            {!search && (
              <Button asChild>
                <Link to="/admin/tariff-types/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать первый тариф
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tariffTypes.map((tariff) => (
            <Card key={tariff.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{tariff.name}</span>
                    {(tariff.ageFrom != null || tariff.ageTo != null) && (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {tariff.ageFrom != null && tariff.ageTo != null
                          ? `${tariff.ageFrom}–${tariff.ageTo} лет`
                          : tariff.ageFrom != null
                          ? `от ${tariff.ageFrom} лет`
                          : `до ${tariff.ageTo} лет`}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Порядок: {tariff.sortOrder}
                    </span>
                  </div>
                  {tariff.description && (
                    <p className="mt-1 truncate text-sm text-muted-foreground">{tariff.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/tariff-types/${tariff.id}/edit`}>
                      <Edit className="mr-1 h-3.5 w-3.5" />
                      Изменить
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Удалить тариф «${tariff.name}»?`)) {
                        deleteMutation.mutate(tariff.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Удалить
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
