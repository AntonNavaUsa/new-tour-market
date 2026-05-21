import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Edit, Plus, Search, Trash2, Calendar } from 'lucide-react';
import { accommodationsApi } from '../lib/api/accommodationsApi';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { AccommodationType } from '../types';

const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Отель',
  HOSTEL: 'Хостел',
  GUESTHOUSE: 'Гостевой дом',
  APARTMENT: 'Апартаменты',
  CAMPING: 'Кемпинг',
  OTHER: 'Другое',
};

export function AdminAccommodationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-accommodations', search],
    queryFn: () => accommodationsApi.getAll({ search: search || undefined, take: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accommodationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-accommodations'] });
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
      setError('');
    },
    onError: (err) => setError(handleApiError(err)),
  });

  const accommodations = data?.data ?? [];

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Объекты размещения</h1>
          <p className="text-muted-foreground">Управление объектами: отели, хостелы, гостевые дома.</p>
        </div>
        <Button asChild>
          <Link to="/admin/accommodations/new">
            <Plus className="mr-2 h-4 w-4" />
            Новый объект
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              placeholder="Поиск по названию или адресу"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Загрузка...</div>
      ) : accommodations.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Building2 className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>Объекты размещения не найдены</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accommodations.map((acc) => (
            <Card key={acc.id} className="overflow-hidden">
              {acc.photos?.[0]?.thumbUrl ? (
                <img
                  src={acc.photos[0].thumbUrl}
                  alt={acc.name}
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-gray-300" />
                </div>
              )}
              <CardContent className="p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 line-clamp-1">{acc.name}</h3>
                  <span className="flex-shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {TYPE_LABELS[acc.type] ?? acc.type}
                  </span>
                </div>
                {acc.address && (
                  <p className="mb-2 text-sm text-muted-foreground line-clamp-1">{acc.address}</p>
                )}
                <p className="mb-3 text-xs text-muted-foreground">
                  Отзывов: {(acc as any)._count?.reviews ?? 0}
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to={`/admin/accommodations/${acc.id}`}>
                      <Edit className="mr-1 h-3 w-3" />
                      Редактировать
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/accommodations/${acc.id}/calendar`}>
                      <Calendar className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive hover:text-white"
                    onClick={() => {
                      if (confirm(`Удалить "${acc.name}"?`)) deleteMutation.mutate(acc.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
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
