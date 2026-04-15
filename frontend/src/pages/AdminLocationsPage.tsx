import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import type { Location } from '../types';

export function AdminLocationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-locations', search],
    queryFn: async () => {
      const locations = await metaApi.getLocations();
      if (search) {
        return locations.filter(
          (loc) =>
            (loc.country ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (loc.city ?? '').toLowerCase().includes(search.toLowerCase()) ||
            ((loc.region ?? '').toLowerCase().includes(search.toLowerCase()))
        );
      }
      return locations;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => metaApi.deleteLocation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      setError('');
    },
    onError: (mutationError) => {
      setError(handleApiError(mutationError));
    },
  });

  const locations = data ?? [];

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление локациями</h1>
          <p className="text-muted-foreground">
            Создание, редактирование и удаление локаций.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/locations/new">
            <Plus className="mr-2 h-4 w-4" />
            Новая локация
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
              placeholder="Поиск по стране, городу или региону"
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
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Локации не найдены.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {locations.map((location: Location) => (
            <Card key={location.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {location.city}, {location.country}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {location.region && <span>{location.region} · </span>}
                    <span>{location.urlSlug}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/locations/${location.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Изменить
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Удалить локацию "${location.city}, ${location.country}"?`)) {
                        deleteMutation.mutate(location.id);
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
