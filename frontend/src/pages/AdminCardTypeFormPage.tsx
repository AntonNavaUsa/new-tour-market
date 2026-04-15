import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const cardTypeSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Только латинские буквы, цифры и дефисы'),
});

type CardTypeFormData = z.infer<typeof cardTypeSchema>;

export function AdminCardTypeFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const { data: cardType } = useQuery({
    queryKey: ['card-type', id],
    queryFn: async () => {
      if (!id) return null;
      const cardTypes = await metaApi.getCardTypes();
      return cardTypes.find((ct) => ct.id === id);
    },
    enabled: isEditMode,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CardTypeFormData>({
    resolver: zodResolver(cardTypeSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  });

  useEffect(() => {
    if (cardType && isEditMode) {
      reset({
        name: cardType.name,
        slug: cardType.slug,
      });
    }
  }, [cardType, isEditMode, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CardTypeFormData) => metaApi.createCardType(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-card-types'] });
      await queryClient.invalidateQueries({ queryKey: ['card-types'] });
      navigate('/admin/card-types');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CardTypeFormData) => metaApi.updateCardType(id!, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-card-types'] });
      await queryClient.invalidateQueries({ queryKey: ['card-types'] });
      navigate('/admin/card-types');
    },
  });

  const onSubmit = (data: CardTypeFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  return (
    <div className="container max-w-2xl py-10">
      <Button variant="ghost" onClick={() => navigate('/admin/card-types')} className="mb-6">
        ← Вернуться к типам
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Редактировать тип карточки' : 'Новый тип карточки'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {handleApiError(error)}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Название типа *</Label>
              <Input
                id="name"
                placeholder="Например: Экскурсия, Тур, Маршрут"
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (для URL) *</Label>
              <Input
                id="slug"
                placeholder="Например: excursion, tour, route"
                {...register('slug')}
                disabled={isLoading}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Только латинские буквы, цифры и дефисы
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Сохранение...' : isEditMode ? 'Обновить тип' : 'Создать тип'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/card-types')}
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
