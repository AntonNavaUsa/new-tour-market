import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const formSchema = z.object({
  name: z.string().min(1, 'Введите название тарифа'),
  description: z.string().optional(),
  ageFrom: z.string().optional(),
  ageTo: z.string().optional(),
  sortOrder: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function toOptionalInt(value?: string): number | undefined {
  if (!value || value.trim() === '') return undefined;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function AdminTariffTypeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', ageFrom: '', ageTo: '', sortOrder: '0' },
  });

  const [formError, setFormError] = useState('');

  const { data: tariff, isLoading } = useQuery({
    queryKey: ['tariff-type', id],
    queryFn: () => metaApi.getTariffTypes().then((list) => list.find((t) => t.id === id)),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (tariff) {
      reset({
        name: tariff.name,
        description: tariff.description ?? '',
        ageFrom: tariff.ageFrom?.toString() ?? '',
        ageTo: tariff.ageTo?.toString() ?? '',
        sortOrder: tariff.sortOrder.toString(),
      });
    }
  }, [tariff, reset]);

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof metaApi.createTariffType>[0]) =>
      metaApi.createTariffType(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-tariff-types'] });
      await queryClient.invalidateQueries({ queryKey: ['tariff-types'] });
      navigate('/admin/tariff-types');
    },
    onError: (err) => setFormError(handleApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof metaApi.updateTariffType>[1]) =>
      metaApi.updateTariffType(id!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-tariff-types'] });
      await queryClient.invalidateQueries({ queryKey: ['tariff-types'] });
      await queryClient.invalidateQueries({ queryKey: ['tariff-type', id] });
      navigate('/admin/tariff-types');
    },
    onError: (err) => setFormError(handleApiError(err)),
  });

  const onSubmit = async (values: FormValues) => {
    setFormError('');
    const payload = {
      name: values.name,
      description: values.description || undefined,
      ageFrom: toOptionalInt(values.ageFrom),
      ageTo: toOptionalInt(values.ageTo),
      sortOrder: toOptionalInt(values.sortOrder) ?? 0,
    };
    if (isEditMode) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoading) {
    return <div className="container py-10"><div className="h-96 animate-pulse rounded-lg bg-muted" /></div>;
  }

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Редактирование тарифа' : 'Новый тариф'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Измените параметры тарифа.' : 'Создайте новый тип тарифа для ценообразования.'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/tariff-types">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку
          </Link>
        </Button>
      </div>

      {formError && (
        <div className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        <Card>
          <CardHeader><CardTitle>Параметры тарифа</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input id="name" placeholder="Взрослый" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Input id="description" placeholder="Для лиц старше 12 лет" {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageFrom">Возраст от</Label>
                <Input id="ageFrom" type="number" min="0" max="120" placeholder="12" {...register('ageFrom')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageTo">Возраст до</Label>
                <Input id="ageTo" type="number" min="0" max="120" placeholder="99" {...register('ageTo')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Порядок сортировки</Label>
              <Input id="sortOrder" type="number" min="0" {...register('sortOrder')} />
              <p className="text-xs text-muted-foreground">Меньшее число = выше в списке</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Сохранение...' : isEditMode ? 'Сохранить' : 'Создать тариф'}
          </Button>
        </div>
      </form>
    </div>
  );
}
