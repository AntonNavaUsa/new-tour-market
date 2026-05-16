import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import CardTypeIcon, { ICON_OPTIONS } from '../components/CardTypeIcon';
import { cn } from '../lib/utils';

const cardTypeSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Только латинские буквы, цифры и дефисы'),
  icon: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0, 'Порядок не может быть отрицательным').default(0),
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
    control,
    watch,
  } = useForm<CardTypeFormData>({
    resolver: zodResolver(cardTypeSchema),
    defaultValues: {
      name: '',
      slug: '',
      icon: null,
      sortOrder: 0,
    },
  });

  const selectedIcon = watch('icon');

  useEffect(() => {
    if (cardType && isEditMode) {
      reset({
        name: cardType.name,
        slug: cardType.slug,
        icon: cardType.icon,
        sortOrder: cardType.sortOrder ?? 0,
      });
    }
  }, [cardType, isEditMode, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CardTypeFormData) => metaApi.createCardType({ ...data, icon: data.icon ?? null, sortOrder: data.sortOrder ?? 0 }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-card-types'] });
      await queryClient.invalidateQueries({ queryKey: ['card-types'] });
      navigate('/admin/card-types');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CardTypeFormData) => metaApi.updateCardType(id!, { ...data, icon: data.icon ?? null, sortOrder: data.sortOrder ?? 0 }),
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
                placeholder="Например: Хайкинг, Джип-тур, Поход"
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
                placeholder="Например: hiking, jeep-tour, trekking"
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

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Порядок отображения</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                placeholder="0"
                {...register('sortOrder')}
                disabled={isLoading}
              />
              {errors.sortOrder && (
                <p className="text-sm text-destructive">{errors.sortOrder.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Меньшее значение — выше в списке. Типы с одинаковым порядком сортируются по названию.
              </p>
            </div>

            {/* Icon picker */}
            <div className="space-y-3">
              <Label>Иконка типа тура</Label>
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-5 gap-2">
                    {/* No icon option */}
                    <button
                      type="button"
                      onClick={() => field.onChange(null)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors hover:bg-muted',
                        !field.value && 'border-primary bg-primary/5 text-primary'
                      )}
                    >
                      <span className="text-lg">—</span>
                      <span className="leading-tight text-center">Без иконки</span>
                    </button>

                    {ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => field.onChange(opt.key)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors hover:bg-muted',
                          field.value === opt.key && 'border-primary bg-primary/5 text-primary'
                        )}
                      >
                        <CardTypeIcon icon={opt.key} className="h-6 w-6 shrink-0" />
                        <span className="leading-tight text-center">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              />
              {selectedIcon && (
                <p className="text-xs text-muted-foreground">
                  Выбрано: <strong>{ICON_OPTIONS.find((o) => o.key === selectedIcon)?.label ?? selectedIcon}</strong>
                </p>
              )}
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
