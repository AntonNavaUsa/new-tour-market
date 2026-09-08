import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { buildLocationTree } from '../lib/locationTree';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const locationSchema = z.object({
  country: z.string().optional(),
  city: z.string().min(1, 'Город обязателен'),
  region: z.string().optional(),
  urlSlug: z.string().min(1, 'URL slug обязателен').regex(/^[a-z0-9-]+$/, 'Только латинские буквы, цифры и дефисы'),
  language: z.string().default('ru'),
  parentId: z.string().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;

export function AdminLocationFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const { data: location } = useQuery({
    queryKey: ['location', id],
    queryFn: async () => {
      if (!id) return null;
      const locations = await metaApi.getLocations();
      return locations.find((loc) => loc.id === id);
    },
    enabled: isEditMode,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: '',
      city: '',
      region: '',
      urlSlug: '',
      language: 'ru',
      parentId: '',
    },
  });

  const { data: allLocations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: metaApi.getLocations,
  });

  useEffect(() => {
    if (location && isEditMode) {
      reset({
        country: location.country ?? '',
        city: location.city ?? '',
        region: (location.region ?? '') as string | undefined,
        urlSlug: location.urlSlug ?? '',
        language: location.language ?? 'ru',
        parentId: location.parentId ?? '',
      });
    }
  }, [location, isEditMode, reset]);

  const createMutation = useMutation({
    mutationFn: (data: LocationFormData) => metaApi.createLocation(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      navigate('/admin/locations');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: LocationFormData) => metaApi.updateLocation(id!, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      await queryClient.invalidateQueries({ queryKey: ['locations'] });
      navigate('/admin/locations');
    },
  });

  const onSubmit = (data: LocationFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;
  const parentId = watch('parentId');
  const locationTree = buildLocationTree(allLocations);
  const availableParents = locationTree.filter(({ item }) => item.id !== id);

  return (
    <div className="container max-w-2xl py-10">
      <Button variant="ghost" onClick={() => navigate('/admin/locations')} className="mb-6">
        ← Вернуться к локациям
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Редактировать локацию' : 'Новая локация'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {handleApiError(error)}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="parentId">Родительская локация</Label>
                <select
                  id="parentId"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('parentId')}
                  disabled={isLoading}
                >
                  <option value="">Верхний уровень</option>
                  {availableParents.map(({ item: parent, depth }) => (
                    <option key={parent.id} value={parent.id}>
                      {`${'  '.repeat(depth)}${depth > 0 ? '↳ ' : ''}${parent.city ?? 'Без названия'}${parent.region ? `, ${parent.region}` : ''}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Для вложенной локации регион и страна будут унаследованы от родителя.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Страна</Label>
                <Input
                  id="country"
                  placeholder="Например: Россия"
                  {...register('country')}
                  disabled={isLoading || Boolean(parentId)}
                />
                {errors.country && (
                  <p className="text-sm text-destructive">{errors.country.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Город *</Label>
                <Input
                  id="city"
                  placeholder="Например: Москва"
                  {...register('city')}
                  disabled={isLoading}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Регион</Label>
                <Input
                  id="region"
                  placeholder="Например: Московская область"
                  {...register('region')}
                  disabled={isLoading || Boolean(parentId)}
                />
                {errors.region && (
                  <p className="text-sm text-destructive">{errors.region.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="urlSlug">URL Slug *</Label>
                <Input
                  id="urlSlug"
                  placeholder="Например: moscow-russia"
                  {...register('urlSlug')}
                  disabled={isLoading}
                />
                {errors.urlSlug && (
                  <p className="text-sm text-destructive">{errors.urlSlug.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Язык</Label>
                <select
                  id="language"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('language')}
                  disabled={isLoading || Boolean(parentId)}
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Сохранение...' : isEditMode ? 'Обновить локацию' : 'Создать локацию'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/locations')}
                disabled={isLoading}
              >
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
