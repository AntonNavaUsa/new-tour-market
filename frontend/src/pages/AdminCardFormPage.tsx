import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Image as ImageIcon,
  MoveUp,
  MoveDown,
  Upload,
  GripVertical,
} from 'lucide-react';
import { cardsApi, metaApi, ticketsApi, schedulesApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { CoverCropModal } from '../components/CoverCropModal';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RichTextEditor } from '../components/RichTextEditor';
import type { CardStatus, CreateCardRequest, UpdateCardRequest, SlideshowPhoto, Ticket, Price, GroupTier } from '../types';
import { PricingType } from '../types';
import { formatTierLabel } from '../lib/utils';
import type { WeeklySchedulePayload } from '../lib/api/schedules';

const formSchema = z.object({
  userId: z.string().optional(),
  locationId: z.string().min(1, 'Выберите локацию'),
  cardTypeId: z.string().min(1, 'Выберите тип карточки'),
  title: z.string().min(3, 'Название должно быть не короче 3 символов'),
  shortDescription: z.string().optional(),
  tags: z.string().optional(),
  durationFrom: z.string().optional(),
  durationTo: z.string().optional(),
  distanceKm: z.string().optional(),
  elevationGain: z.string().optional(),
  difficulty: z.string().optional(),
  placeHistory: z.string().optional(),
  childFriendly: z.string().optional(),
  meetingPoint: z.string().optional(),
  minParticipants: z.string().optional(),
  maxParticipants: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

type FormValues = z.infer<typeof formSchema>;

function toOptionalNumber(value?: string) {
  if (!value || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

// ─────────────────────────────────────────────────────────────
// TourProgramSection — program by days (only for cardType slug='tour')
// ─────────────────────────────────────────────────────────────
interface TourDay {
  title: string;
  description: string;
}

function TourProgramSection({
  days,
  onChange,
}: {
  days: TourDay[];
  onChange: (days: TourDay[]) => void;
}) {
  const updateDay = (index: number, field: keyof TourDay, value: string) => {
    onChange(days.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const removeDay = (index: number) => {
    onChange(days.filter((_, i) => i !== index));
  };

  const addDay = () => {
    onChange([...days, { title: `День ${days.length + 1}`, description: '' }]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Программа по дням</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {days.map((day, index) => (
          <div key={index} className="rounded-md border border-input bg-background p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <GripVertical className="h-4 w-4" />
                День {index + 1}
              </div>
              {days.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  onClick={() => removeDay(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Заголовок дня</Label>
              <Input
                value={day.title}
                onChange={(e) => updateDay(index, 'title', e.target.value)}
                placeholder="Например: Заезд и знакомство"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Описание</Label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                value={day.description}
                onChange={(e) => updateDay(index, 'description', e.target.value)}
                placeholder="Что запланировано на этот день..."
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addDay}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Добавить день
        </Button>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// EditableList
// ─────────────────────────────────────────────────────────────
function EditableList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [newItem, setNewItem] = useState('');

  const add = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setNewItem('');
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>{title}</Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
              {item}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-destructive hover:text-destructive"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Добавить пункт..."
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PhotosTab
// ─────────────────────────────────────────────────────────────
function PhotosTab({ cardId, headPhotoUrl }: { cardId: string; headPhotoUrl?: string | null }) {
  const queryClient = useQueryClient();
  const mainPhotoInputRef = useRef<HTMLInputElement>(null);
  const slideshowInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState('');
  const [cropFile, setCropFile] = useState<File | null>(null);

  const { data: card, isLoading } = useQuery({
    queryKey: ['admin-card', cardId],
    queryFn: () => cardsApi.getCard(cardId),
  });

  const uploadMainMutation = useMutation({
    mutationFn: (file: File) => cardsApi.uploadMainPhoto(cardId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-card', cardId] });
      setPhotoError('');
    },
    onError: (err) => setPhotoError(handleApiError(err)),
  });

  const uploadSlideshowMutation = useMutation({
    mutationFn: (files: File[]) => cardsApi.uploadSlideshowPhotos(cardId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-card', cardId] });
      setPhotoError('');
    },
    onError: (err) => setPhotoError(handleApiError(err)),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => cardsApi.deleteSlideshowPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-card', cardId] });
    },
    onError: (err) => setPhotoError(handleApiError(err)),
  });

  const reorderMutation = useMutation({
    mutationFn: (photos: Array<{ id: string; sortOrder: number }>) =>
      cardsApi.reorderSlideshowPhotos(cardId, photos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-card', cardId] });
    },
  });

  const currentHeadPhoto = card?.headPhotoUrl ?? headPhotoUrl;
  const slideshowPhotos: SlideshowPhoto[] = card?.slideshowPhotos ?? [];

  const handleCoverFileSelected = (file: File) => {
    setCropFile(file);
  };

  const handleCropConfirm = (croppedFile: File) => {
    setCropFile(null);
    uploadMainMutation.mutate(croppedFile);
  };

  const handleCropCancel = () => {
    setCropFile(null);
    if (mainPhotoInputRef.current) mainPhotoInputRef.current.value = '';
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const photos = [...slideshowPhotos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;
    [photos[index], photos[targetIndex]] = [photos[targetIndex], photos[index]];
    reorderMutation.mutate(photos.map((p, i) => ({ id: p.id, sortOrder: i })));
  };

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <>
    {cropFile && (
      <CoverCropModal
        file={cropFile}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    )}
    <div className="space-y-8">
      {photoError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{photoError}</div>
      )}

      {/* Cover photo */}
      <div>
        <h3 className="mb-1 text-lg font-semibold">Обложка тура</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Главное фото, отображаемое в шапке страницы тура. После выбора файла откроется редактор кадрирования.
        </p>

        {/* Preview area */}
        <div
          className="relative mb-4 w-full overflow-hidden rounded-xl border border-input bg-muted"
          style={{ aspectRatio: '16/9', maxWidth: 640 }}
        >
          {uploadMainMutation.isPending ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : currentHeadPhoto ? (
            <img
              src={currentHeadPhoto}
              alt="Обложка тура"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
              <span className="text-sm">Обложка не загружена</span>
            </div>
          )}

          {/* Overlay change button */}
          {currentHeadPhoto && !uploadMainMutation.isPending && (
            <button
              type="button"
              onClick={() => mainPhotoInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition group"
            >
              <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-800 shadow">
                <Upload className="h-4 w-4" />
                Изменить обложку
              </span>
            </button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={uploadMainMutation.isPending}
          onClick={() => mainPhotoInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploadMainMutation.isPending ? 'Загрузка...' : currentHeadPhoto ? 'Заменить обложку' : 'Загрузить обложку'}
        </Button>
        <input
          ref={mainPhotoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCoverFileSelected(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Slideshow */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Фотоальбом{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({slideshowPhotos.length} фото)
            </span>
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadSlideshowMutation.isPending}
            onClick={() => slideshowInputRef.current?.click()}
          >
            <Plus className="mr-2 h-4 w-4" />
            {uploadSlideshowMutation.isPending ? 'Загрузка...' : 'Добавить фото'}
          </Button>
          <input
            ref={slideshowInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              if (files.length) uploadSlideshowMutation.mutate(files);
              e.target.value = '';
            }}
          />
        </div>

        {slideshowPhotos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-input p-12 text-center text-muted-foreground">
            Фото в альбоме нет. Нажмите «Добавить фото».
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slideshowPhotos.map((photo, index) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-input">
                <img
                  src={photo.url}
                  alt={photo.caption ?? `Фото ${index + 1}`}
                  className="h-48 w-full object-cover"
                />
                <div className="absolute inset-0 flex items-end justify-between bg-black/40 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      disabled={index === 0}
                      onClick={() => movePhoto(index, 'up')}
                      title="Влево"
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      disabled={index === slideshowPhotos.length - 1}
                      onClick={() => movePhoto(index, 'down')}
                      title="Вправо"
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    disabled={deletePhotoMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Удалить это фото?')) deletePhotoMutation.mutate(photo.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="px-2 py-1 text-xs text-muted-foreground">#{index + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PriceForm — modal-less inline form for creating/editing a price
// ─────────────────────────────────────────────────────────────
interface PriceFormState {
  dateFrom: string;
  dateTo: string;
  adultPrice: string;
  minPrice: string;
  availableSlots: string;
  pricingMode: 'simple' | 'group';
  groupTiers: GroupTier[];
}

const emptyTier = (): GroupTier => ({ minPeople: 1, maxPeople: null, price: 0, priceType: 'per_person' });

const emptyPriceForm = (): PriceFormState => ({
  dateFrom: '',
  dateTo: '',
  adultPrice: '',
  minPrice: '',
  availableSlots: '',
  pricingMode: 'simple',
  groupTiers: [],
});

function TierEditor({
  tiers,
  onChange,
}: {
  tiers: GroupTier[];
  onChange: (tiers: GroupTier[]) => void;
}) {
  const update = (i: number, field: keyof GroupTier, value: any) => {
    const next = tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {tiers.map((tier, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_1.5fr_1.5fr_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Мин. чел.</Label>
            <Input
              type="number" min="1" value={tier.minPeople}
              onChange={(e) => update(i, 'minPeople', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Макс. чел.</Label>
            <Input
              type="number" min="1" placeholder="∞"
              value={tier.maxPeople ?? ''}
              onChange={(e) => update(i, 'maxPeople', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Цена (₽)</Label>
            <Input
              type="number" min="0" value={tier.price || ''}
              onChange={(e) => update(i, 'price', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Тип цены</Label>
            <select
              value={tier.priceType}
              onChange={(e) => update(i, 'priceType', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="per_person">за чел. (цена × кол-во)</option>
              <option value="fixed">за группу (фиксированно)</option>
            </select>
          </div>
          <Button
            type="button" variant="ghost" size="sm" className="h-9 px-2 text-destructive hover:text-destructive"
            onClick={() => onChange(tiers.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        type="button" variant="outline" size="sm"
        onClick={() => onChange([...tiers, emptyTier()])}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Добавить тариф
      </Button>
    </div>
  );
}

function PriceRowEditor({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: PriceFormState;
  onSave: (values: PriceFormState) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [values, setValues] = useState<PriceFormState>(initial ?? emptyPriceForm());

  const set = (field: keyof PriceFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const isValid =
    values.dateFrom &&
    values.dateTo &&
    (values.pricingMode === 'simple'
      ? !!values.adultPrice
      : values.groupTiers.length > 0 && values.groupTiers.every((t) => t.price > 0));

  return (
    <div className="rounded-md border border-primary/40 bg-muted/30 p-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Дата с *</Label>
          <Input type="date" value={values.dateFrom} onChange={set('dateFrom')} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Дата по *</Label>
          <Input type="date" value={values.dateTo} onChange={set('dateTo')} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Мест (макс.)</Label>
          <Input type="number" min="1" placeholder="20" value={values.availableSlots} onChange={set('availableSlots')} />
        </div>
      </div>

      {/* Pricing mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setValues((v) => ({ ...v, pricingMode: 'simple' }))}
          className={`px-3 py-1 rounded-full text-xs border transition ${values.pricingMode === 'simple' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:border-primary/50'}`}
        >
          Простая цена
        </button>
        <button
          type="button"
          onClick={() => setValues((v) => ({ ...v, pricingMode: 'group', groupTiers: v.groupTiers.length ? v.groupTiers : [emptyTier()] }))}
          className={`px-3 py-1 rounded-full text-xs border transition ${values.pricingMode === 'group' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:border-primary/50'}`}
        >
          Групповые тарифы
        </button>
      </div>

      {values.pricingMode === 'simple' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Цена за чел. (₽) *</Label>
            <Input type="number" min="0" step="0.01" placeholder="2500" value={values.adultPrice} onChange={set('adultPrice')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Минимальная цена (₽)</Label>
            <Input type="number" min="0" step="0.01" placeholder="1500" value={values.minPrice} onChange={set('minPrice')} />
          </div>
        </div>
      ) : (
        <TierEditor
          tiers={values.groupTiers}
          onChange={(tiers) => setValues((v) => ({ ...v, groupTiers: tiers }))}
        />
      )}

      <div className="flex gap-2">
        <Button
          type="button" size="sm"
          disabled={isSaving || !isValid}
          onClick={() => onSave(values)}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

function priceToFormState(price: Price): PriceFormState {
  const hasGroupTiers = price.groupTiers && price.groupTiers.length > 0;
  return {
    dateFrom: price.dateFrom.slice(0, 10),
    dateTo: price.dateTo.slice(0, 10),
    adultPrice: price.adultPrice,
    minPrice: price.minPrice ?? '',
    availableSlots: price.availableSlots?.toString() ?? '',
    pricingMode: hasGroupTiers ? 'group' : 'simple',
    groupTiers: price.groupTiers ?? [],
  };
}

// ─────────────────────────────────────────────────────────────
// TicketPricesBlock — manage prices for a single ticket
// ─────────────────────────────────────────────────────────────
function TicketPricesBlock({ ticket, cardId }: { ticket: Ticket; cardId: string }) {
  const queryClient = useQueryClient();
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [blockError, setBlockError] = useState('');

  const { data: prices = [], isLoading } = useQuery({
    queryKey: ['ticket-prices', ticket.id],
    queryFn: () => ticketsApi.getPrices(ticket.id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ticket-prices', ticket.id] });
    queryClient.invalidateQueries({ queryKey: ['card-tickets', cardId] });
  };

  const createMutation = useMutation({
    mutationFn: (v: PriceFormState) =>
      ticketsApi.createPrice(ticket.id, {
        dateFrom: v.dateFrom,
        dateTo: v.dateTo,
        adultPrice: v.pricingMode === 'simple' ? parseFloat(v.adultPrice) : 0,
        minPrice: v.pricingMode === 'simple' && v.minPrice ? parseFloat(v.minPrice) : undefined,
        availableSlots: v.availableSlots ? parseInt(v.availableSlots) : undefined,
        groupTiers: v.pricingMode === 'group' ? v.groupTiers : undefined,
      }),
    onSuccess: () => { invalidate(); setAddingNew(false); setBlockError(''); },
    onError: (err) => setBlockError(handleApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, v }: { id: string; v: PriceFormState }) =>
      ticketsApi.updatePrice(id, {
        dateFrom: v.dateFrom,
        dateTo: v.dateTo,
        adultPrice: v.pricingMode === 'simple' ? parseFloat(v.adultPrice) : 0,
        minPrice: v.pricingMode === 'simple' && v.minPrice ? parseFloat(v.minPrice) : undefined,
        availableSlots: v.availableSlots ? parseInt(v.availableSlots) : undefined,
        groupTiers: v.pricingMode === 'group' ? v.groupTiers : [],
      }),
    onSuccess: () => { invalidate(); setEditingId(null); setBlockError(''); },
    onError: (err) => setBlockError(handleApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (priceId: string) => ticketsApi.deletePrice(priceId),
    onSuccess: () => { invalidate(); setBlockError(''); },
    onError: (err) => setBlockError(handleApiError(err)),
  });

  const unarchiveMutation = useMutation({
    mutationFn: (priceId: string) => ticketsApi.unarchivePrice(priceId),
    onSuccess: () => { invalidate(); setBlockError(''); },
    onError: (err) => setBlockError(handleApiError(err)),
  });

  const activePrices = prices.filter((p) => !p.isArchived);
  const archivedPrices = prices.filter((p) => p.isArchived);

  return (
    <div className="space-y-3">
      {blockError && (
        <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{blockError}</div>
      )}

      {isLoading ? (
        <div className="h-10 animate-pulse rounded bg-muted" />
      ) : activePrices.length === 0 && !addingNew ? (
        <p className="text-sm text-muted-foreground">Ценовых периодов нет. Добавьте первый.</p>
      ) : (
        <div className="space-y-2">
          {activePrices.map((price) =>
            editingId === price.id ? (
              <PriceRowEditor
                key={price.id}
                initial={priceToFormState(price)}
                isSaving={updateMutation.isPending}
                onSave={(v) => updateMutation.mutate({ id: price.id, v })}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={price.id} className="flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="font-medium">
                    {new Date(price.dateFrom).toLocaleDateString('ru-RU')} — {new Date(price.dateTo).toLocaleDateString('ru-RU')}
                  </span>
                  {price.groupTiers && price.groupTiers.length > 0 ? (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {price.groupTiers.map((t, i) => (
                        <div key={i}>{formatTierLabel(t)}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{parseFloat(price.adultPrice).toLocaleString('ru-RU')} ₽/чел.</span>
                      {price.minPrice && <span>мин. {parseFloat(price.minPrice).toLocaleString('ru-RU')} ₽</span>}
                    </div>
                  )}
                  {price.availableSlots != null && (
                    <span className="text-xs text-muted-foreground">мест: {price.availableSlots}</span>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditingId(price.id)}>
                    Изм.
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm('Удалить ценовой период?')) deleteMutation.mutate(price.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {archivedPrices.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pt-1">Архив (использовались в заказах)</p>
          {archivedPrices.map((price) => (
            <div key={price.id} className="flex items-center justify-between gap-2 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm opacity-60">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span className="font-medium line-through">
                  {new Date(price.dateFrom).toLocaleDateString('ru-RU')} — {new Date(price.dateTo).toLocaleDateString('ru-RU')}
                </span>
                <span>{parseFloat(price.adultPrice).toLocaleString('ru-RU')} ₽</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 shrink-0"
                title="Восстановить"
                disabled={unarchiveMutation.isPending}
                onClick={() => unarchiveMutation.mutate(price.id)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {addingNew && (
        <PriceRowEditor
          isSaving={createMutation.isPending}
          onSave={(v) => createMutation.mutate(v)}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {!addingNew && (
        <Button type="button" variant="outline" size="sm" onClick={() => setAddingNew(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Добавить период
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PricingTab — two sub-tabs: За всё / За человека
// ─────────────────────────────────────────────────────────────
function PricingTab({ cardId }: { cardId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['card-tickets', cardId],
    queryFn: () => ticketsApi.getCardTickets(cardId),
  });

  const { data: tariffTypes = [] } = useQuery({
    queryKey: ['tariff-types'],
    queryFn: () => metaApi.getTariffTypes(),
  });

  const groupTicket = tickets.find((t) => t.pricingType === PricingType.PER_GROUP);
  const personTickets = tickets.filter((t) => t.pricingType === PricingType.PER_PERSON);
  const usedTariffIds = new Set(personTickets.map((t) => t.tariffTypeId).filter(Boolean));
  const availableTariffs = tariffTypes.filter((tt) => !usedTariffIds.has(tt.id));

  const createTicketMutation = useMutation({
    mutationFn: (payload: Parameters<typeof ticketsApi.createTicket>[1]) =>
      ticketsApi.createTicket(cardId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-tickets', cardId] });
      setError('');
    },
    onError: (err) => setError(handleApiError(err)),
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsApi.deleteTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-tickets', cardId] });
      setError('');
    },
    onError: (err) => setError(handleApiError(err)),
  });

  const handleAddGroupTicket = () => {
    createTicketMutation.mutate({ title: 'Группа', pricingType: PricingType.PER_GROUP, isMain: true });
  };

  const handleAddPersonTicket = (tariffTypeId: string) => {
    const tariff = tariffTypes.find((t) => t.id === tariffTypeId);
    if (!tariff) return;
    createTicketMutation.mutate({ title: tariff.name, pricingType: PricingType.PER_PERSON, tariffTypeId });
  };

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Tabs defaultValue="per-group">
        <TabsList>
          <TabsTrigger value="per-group">За всё (группа)</TabsTrigger>
          <TabsTrigger value="per-person">За человека (тариф)</TabsTrigger>
        </TabsList>

        {/* ── За всё ── */}
        <TabsContent value="per-group" className="mt-4">
          {groupTicket ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Цена за всю группу</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive hover:text-destructive"
                  disabled={deleteTicketMutation.isPending}
                  onClick={() => {
                    if (confirm('Удалить тип цены «За всё» и все её периоды?'))
                      deleteTicketMutation.mutate(groupTicket.id);
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Удалить
                </Button>
              </CardHeader>
              <CardContent>
                <TicketPricesBlock ticket={groupTicket} cardId={cardId} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Ценообразование «За всё» не настроено. Фиксированная цена за группу или тур.
                </p>
                <Button
                  type="button"
                  onClick={handleAddGroupTicket}
                  disabled={createTicketMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить цену за группу
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── За человека ── */}
        <TabsContent value="per-person" className="mt-4 space-y-4">
          {personTickets.length === 0 && (
            <p className="text-sm text-muted-foreground">Тарифные типы не добавлены.</p>
          )}

          {personTickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{ticket.title}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive hover:text-destructive"
                  disabled={deleteTicketMutation.isPending}
                  onClick={() => {
                    if (confirm(`Удалить тариф «${ticket.title}» и все его периоды?`))
                      deleteTicketMutation.mutate(ticket.id);
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Удалить тариф
                </Button>
              </CardHeader>
              <CardContent>
                {ticket.tariffType && (ticket.tariffType.ageFrom != null || ticket.tariffType.ageTo != null) && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    Возраст:{' '}
                    {ticket.tariffType.ageFrom != null && ticket.tariffType.ageTo != null
                      ? `${ticket.tariffType.ageFrom}–${ticket.tariffType.ageTo} лет`
                      : ticket.tariffType.ageFrom != null
                      ? `от ${ticket.tariffType.ageFrom} лет`
                      : `до ${ticket.tariffType.ageTo} лет`}
                  </p>
                )}
                <TicketPricesBlock ticket={ticket} cardId={cardId} />
              </CardContent>
            </Card>
          ))}

          {availableTariffs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTariffs.map((tt) => (
                <Button
                  key={tt.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={createTicketMutation.isPending}
                  onClick={() => handleAddPersonTicket(tt.id)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {tt.name}
                </Button>
              ))}
            </div>
          )}

          {availableTariffs.length === 0 && personTickets.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Все доступные тарифы добавлены.{' '}
              <Link to="/admin/tariff-types" className="underline">Управление тарифами</Link>
            </p>
          )}

          {tariffTypes.length === 0 && (
            <div className="rounded-md border border-dashed border-input p-4 text-center text-sm text-muted-foreground">
              Тарифы не настроены.{' '}
              <Link to="/admin/tariff-types/new" className="underline">
                Создайте тарифы
              </Link>{' '}
              (Взрослый, Детский и т.д.)
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ScheduleTab — weekly schedule + special dates
// ─────────────────────────────────────────────────────────────

const DAYS: { key: keyof WeeklySchedulePayload; label: string }[] = [
  { key: 'monday', label: 'Понедельник' },
  { key: 'tuesday', label: 'Вторник' },
  { key: 'wednesday', label: 'Среда' },
  { key: 'thursday', label: 'Четверг' },
  { key: 'friday', label: 'Пятница' },
  { key: 'saturday', label: 'Суббота' },
  { key: 'sunday', label: 'Воскресенье' },
];

const DEFAULT_WEEKLY: WeeklySchedulePayload = {
  monday: { active: false, times: [] },
  tuesday: { active: false, times: [] },
  wednesday: { active: false, times: [] },
  thursday: { active: false, times: [] },
  friday: { active: false, times: [] },
  saturday: { active: false, times: [] },
  sunday: { active: false, times: [] },
};

function ScheduleTab({ cardId }: { cardId: string }) {
  const queryClient = useQueryClient();
  const [scheduleError, setScheduleError] = useState('');
  const [weeklyDirty, setWeeklyDirty] = useState(false);
  const [weeklyTimeInputs, setWeeklyTimeInputs] = useState<{ [dayKey: string]: string }>({});

  // New special date form state
  const [newDate, setNewDate] = useState('');
  const [newDateTo, setNewDateTo] = useState('');
  const [newTimes, setNewTimes] = useState<string[]>([]);
  const [newTimeInput, setNewTimeInput] = useState('');
  const [newClosed, setNewClosed] = useState(false);
  const [newReason, setNewReason] = useState('');

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['card-schedule', cardId],
    queryFn: () => schedulesApi.getSchedule(cardId),
  });

  // Local weekly state for editing
  const [weekly, setWeekly] = useState<WeeklySchedulePayload>(DEFAULT_WEEKLY);

  useEffect(() => {
    if (schedule?.weeklySchedule) {
      setWeekly({
        ...DEFAULT_WEEKLY,
        ...schedule.weeklySchedule,
      });
    }
  }, [schedule]);

  const saveWeeklyMutation = useMutation({
    mutationFn: () => schedulesApi.updateWeeklySchedule(cardId, weekly),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-schedule', cardId] });
      setWeeklyDirty(false);
      setScheduleError('');
    },
    onError: (err) => setScheduleError(handleApiError(err)),
  });

  const addSpecialMutation = useMutation({
    mutationFn: () =>
      schedulesApi.addSpecialDate(cardId, {
        dateFrom: newDate,
        dateTo: newDateTo || newDate,
        times: newClosed ? [] : newTimes,
        isClosed: newClosed,
        reason: newReason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-schedule', cardId] });
      setNewDate('');
      setNewDateTo('');
      setNewTimes([]);
      setNewTimeInput('');
      setNewClosed(false);
      setNewReason('');
      setScheduleError('');
    },
    onError: (err) => setScheduleError(handleApiError(err)),
  });

  const removeSpecialMutation = useMutation({
    mutationFn: (index: number) => schedulesApi.removeSpecialDate(cardId, index),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-schedule', cardId] });
      setScheduleError('');
    },
    onError: (err) => setScheduleError(handleApiError(err)),
  });

  const updateDay = (
    key: keyof WeeklySchedulePayload,
    field: 'active' | 'times',
    value: string | boolean | string[],
  ) => {
    setWeekly((prev) => {
      const day = { ...prev[key] };
      if (field === 'active') {
        day.active = value as boolean;
      } else if (field === 'times') {
        day.times = value as string[];
      }
      return { ...prev, [key]: day };
    });
    setWeeklyDirty(true);
  };

  const specialDates = (schedule?.specialDates ?? []) as Array<{
    dateFrom: string;
    dateTo: string;
    times: string[];
    isClosed: boolean;
    reason?: string;
  }>;

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="space-y-6">
      {scheduleError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{scheduleError}</div>
      )}

      {/* Weekly schedule */}
      <Card>
        <CardHeader>
          <CardTitle>📆 Регулярное недельное расписание</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const day = weekly[key];
            
            return (
              <div key={key} className="rounded-md border border-input bg-background p-3">
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-2 w-36 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.active}
                      onChange={(e) => updateDay(key, 'active', e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <span className={day.active ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
                  </label>
                </div>
                
                {day.active && (
                  <div className="ml-9 space-y-2">
                    {day.times && day.times.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {day.times.map((time, idx) => (
                          <div key={idx} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            <span>{time}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newTimes = day.times.filter((_, i) => i !== idx);
                                updateDay(key, 'times', newTimes);
                              }}
                              className="ml-1 text-primary/60 hover:text-primary"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={weeklyTimeInputs[key] || ''}
                        onChange={(e) => setWeeklyTimeInputs({ ...weeklyTimeInputs, [key]: e.target.value })}
                        placeholder="HH:MM"
                        className="w-32"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!weeklyTimeInputs[key]}
                        onClick={() => {
                          const newTime = weeklyTimeInputs[key];
                          const currentTimes = day.times || [];
                          if (newTime && !currentTimes.includes(newTime)) {
                            updateDay(key, 'times', [...currentTimes, newTime].sort());
                            setWeeklyTimeInputs({ ...weeklyTimeInputs, [key]: '' });
                          }
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Добавить
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              disabled={!weeklyDirty || saveWeeklyMutation.isPending}
              onClick={() => saveWeeklyMutation.mutate()}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveWeeklyMutation.isPending ? 'Сохранение...' : 'Сохранить расписание'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Special dates */}
      <Card>
        <CardHeader>
          <CardTitle>📆 Расписание по отдельным датам</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing special dates */}
          {specialDates.length > 0 ? (
            <div className="space-y-2">
              {specialDates.map((sd, index) => (
                <div key={index} className="rounded-md border border-input bg-background">
                  <div className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="font-medium">
                          {new Date(sd.dateFrom).toLocaleDateString('ru-RU')}
                          {sd.dateTo && sd.dateTo !== sd.dateFrom && (
                            <> — {new Date(sd.dateTo).toLocaleDateString('ru-RU')}</>
                          )}
                        </span>
                        {sd.isClosed && (
                          <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive font-medium">Закрыто</span>
                        )}
                        {sd.reason && <span className="text-muted-foreground italic">{sd.reason}</span>}
                      </div>
                      {!sd.isClosed && sd.times.length > 0 && (
                        <div className="pl-4 space-y-0.5">
                          <div className="text-xs text-muted-foreground mb-1">Время начала:</div>
                          <div className="flex flex-wrap gap-2">
                            {sd.times.map((time, timeIndex) => (
                              <span key={timeIndex} className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-destructive hover:text-destructive"
                      disabled={removeSpecialMutation.isPending}
                      onClick={() => {
                        if (confirm('Удалить эту запись?')) removeSpecialMutation.mutate(index);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Особых дат не добавлено.</p>
          )}

          {/* Add new special date */}
          <div className="rounded-md border border-dashed border-input p-4 space-y-3">
            <p className="text-sm font-medium">Добавить дату</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Дата (с) *</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Дата (по)</Label>
                <Input
                  type="date"
                  value={newDateTo}
                  min={newDate}
                  onChange={(e) => setNewDateTo(e.target.value)}
                  placeholder="Оставьте пустым для одной даты"
                />
              </div>
            </div>
            
            {/* Time slots */}
            {!newClosed && (
              <div className="space-y-2">
                <Label className="text-xs">Варианты времени начала</Label>
                {newTimes.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 rounded-md bg-muted/50">
                    {newTimes.map((time, idx) => (
                      <div key={idx} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <span>{time}</span>
                        <button
                          type="button"
                          onClick={() => setNewTimes(newTimes.filter((_, i) => i !== idx))}
                          className="ml-1 text-primary/60 hover:text-primary"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={newTimeInput}
                    onChange={(e) => setNewTimeInput(e.target.value)}
                    placeholder="HH:MM"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!newTimeInput}
                    onClick={() => {
                      if (newTimeInput && !newTimes.includes(newTimeInput)) {
                        setNewTimes([...newTimes, newTimeInput].sort());
                        setNewTimeInput('');
                      }
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Добавить
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Причина / комментарий</Label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Например: Праздничный день"
              />
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newClosed}
                onChange={(e) => {
                  setNewClosed(e.target.checked);
                  if (e.target.checked) {
                    setNewTimes([]);
                    setNewTimeInput('');
                  }
                }}
                className="h-4 w-4 rounded border-input accent-destructive"
              />
              <span className="text-sm font-medium text-destructive">Закрыта (день недоступен)</span>
            </label>
            <Button
              type="button"
              size="sm"
              disabled={!newDate || (!newClosed && newTimes.length === 0) || addSpecialMutation.isPending}
              onClick={() => addSpecialMutation.mutate()}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              {addSpecialMutation.isPending ? 'Добавление...' : 'Добавить дату'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────
export function AdminCardFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState('');

  const [description, setDescription] = useState('');
  const [noCover, setNoCover] = useState(false);
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [notIncludedItems, setNotIncludedItems] = useState<string[]>([]);
  const [forWhom, setForWhom] = useState<string[]>([]);
  const [tourProgram, setTourProgram] = useState<Array<{ title: string; description: string }>>([
    { title: 'День 1', description: '' },
  ]);

  const { data: locations = [] } = useQuery({
    queryKey: ['meta-locations'],
    queryFn: metaApi.getLocations,
  });
  const { data: cardTypes = [] } = useQuery({
    queryKey: ['meta-card-types'],
    queryFn: metaApi.getCardTypes,
  });
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: metaApi.getAdminUsers,
  });
  const { data: card, isLoading: isCardLoading } = useQuery({
    queryKey: ['admin-card', id],
    queryFn: () => cardsApi.getCard(id!),
    enabled: isEditMode,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      locationId: '',
      cardTypeId: '',
      title: '',
      shortDescription: '',
      tags: '',
      durationFrom: '',
      durationTo: '',
      distanceKm: '',
      elevationGain: '',
      difficulty: '',
      placeHistory: '',
      childFriendly: '',
      meetingPoint: '',
      minParticipants: '',
      maxParticipants: '',
      position: '0',
      status: 'DRAFT',
    },
  });

  useEffect(() => {
    if (!card) return;
    reset({
      userId: card.userId,
      locationId: card.locationId,
      cardTypeId: card.cardTypeId,
      title: card.title,
      shortDescription: card.shortDescription || '',
      tags: (card.tags || []).join(', '),
      durationFrom: card.durationFrom?.toString() || '',
      durationTo: card.durationTo?.toString() || '',
      distanceKm: card.distanceKm?.toString() || '',
      elevationGain: card.elevationGain?.toString() || '',
      difficulty: card.difficulty || '',
      placeHistory: card.placeHistory || '',
      childFriendly: card.childFriendly === true ? 'yes' : card.childFriendly === false ? 'no' : '',
      meetingPoint: card.meetingPoint || '',
      minParticipants: card.minParticipants?.toString() || '',
      maxParticipants: card.maxParticipants?.toString() || '',
      position: card.position.toString(),
      status: card.status,
    });
    setDescription(card.description || '');
    setNoCover(card.noCover ?? false);
    setIncludedItems((card.includedItems as string[] | null) || []);
    setNotIncludedItems((card.notIncludedItems as string[] | null) || []);
    setForWhom((card.forWhom as string[] | null) || []);
    const loadedProgram = card.tourProgram as Array<{ title: string; description: string }> | null;
    setTourProgram(
      loadedProgram && loadedProgram.length > 0
        ? loadedProgram
        : [{ title: 'День 1', description: '' }]
    );
  }, [card, reset]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateCardRequest) => cardsApi.createCard(payload),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      navigate(`/admin/cards/${created.id}/edit`);
    },
    onError: (err) => setFormError(handleApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ cardId, payload }: { cardId: string; payload: UpdateCardRequest }) =>
      cardsApi.updateCard(cardId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-cards'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-card', id] });
    },
    onError: (err) => setFormError(handleApiError(err)),
  });

  const onSubmit = async (values: FormValues) => {
    setFormError('');
    const payloadBase: CreateCardRequest = {
      userId: values.userId || undefined,
      locationId: values.locationId,
      cardTypeId: values.cardTypeId,
      title: values.title,
      description,
      shortDescription: values.shortDescription || undefined,
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      durationFrom: toOptionalNumber(values.durationFrom),
      durationTo: toOptionalNumber(values.durationTo),
      distanceKm: toOptionalNumber(values.distanceKm),
      elevationGain: toOptionalNumber(values.elevationGain),
      difficulty: values.difficulty || undefined,
      placeHistory: values.placeHistory || undefined,
      childFriendly: values.childFriendly === 'yes' ? true : values.childFriendly === 'no' ? false : undefined,
      meetingPoint: values.meetingPoint || undefined,
      minParticipants: toOptionalNumber(values.minParticipants),
      maxParticipants: toOptionalNumber(values.maxParticipants),
      position: toOptionalNumber(values.position) ?? 0,
      includedItems,
      notIncludedItems,
      forWhom,
      noCover,
      tourProgram,
    };
    if (isEditMode && id) {
      await updateMutation.mutateAsync({ cardId: id, payload: { ...payloadBase, status: values.status } });
    } else {
      await createMutation.mutateAsync(payloadBase);
    }
  };

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

  // Determine if selected card type is 'tour'
  const watchedCardTypeId = watch('cardTypeId');
  const isTourType = cardTypes.some((ct) => ct.id === watchedCardTypeId && ct.slug === 'tour');

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Редактирование карточки' : 'Создание карточки'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? 'Измените данные и сохраните. Фото — на вкладке «Фото».'
              : 'После создания откроется режим редактирования с вкладкой «Фото».'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку
          </Link>
        </Button>
      </div>

      {formError && (
        <div className="mb-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
      )}

      {isEditMode && isCardLoading ? (
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      ) : (
        <Tabs defaultValue="main">
          <TabsList className="mb-6">
            <TabsTrigger value="main">Основное</TabsTrigger>
            <TabsTrigger value="photos" disabled={!isEditMode}>
              Фото{!isEditMode ? ' (после сохранения)' : ''}
            </TabsTrigger>
            <TabsTrigger value="pricing" disabled={!isEditMode}>
              Цены{!isEditMode ? ' (после сохранения)' : ''}
            </TabsTrigger>
            <TabsTrigger value="schedule" disabled={!isEditMode}>
              Расписание{!isEditMode ? ' (после сохранения)' : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Основные параметры</CardTitle></CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Автор карточки</Label>
                    <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('userId')}>
                      <option value="">Выберите пользователя</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Статус</Label>
                    <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('status')} disabled={!isEditMode}>
                      <option value="DRAFT">Черновик</option>
                      <option value="PUBLISHED">Опубликовано</option>
                      <option value="ARCHIVED">Архив</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Название *</Label>
                    <Input id="title" {...register('title')} />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="shortDescription">Краткое описание</Label>
                    <Input id="shortDescription" {...register('shortDescription')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Локация *</Label>
                    <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('locationId')}>
                      <option value="">Выберите локацию</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {[loc.city, loc.region, loc.country].filter(Boolean).join(', ')}
                        </option>
                      ))}
                    </select>
                    {errors.locationId && <p className="text-sm text-destructive">{errors.locationId.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Тип карточки *</Label>
                    <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('cardTypeId')}>
                      <option value="">Выберите тип</option>
                      {cardTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                      ))}
                    </select>
                    {errors.cardTypeId && <p className="text-sm text-destructive">{errors.cardTypeId.message}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="tags">Теги</Label>
                    <Input id="tags" placeholder="природа, семья, активный отдых" {...register('tags')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Позиция (сортировка)</Label>
                    <Input id="position" type="number" min="0" {...register('position')} />
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      id="noCover"
                      type="checkbox"
                      checked={noCover}
                      onChange={(e) => setNoCover(e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor="noCover" className="cursor-pointer font-normal">
                      Без обложки (скрыть hero-секцию на странице тура)
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minParticipants">Мин. участников</Label>
                    <Input id="minParticipants" type="number" min="1" {...register('minParticipants')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Макс. участников</Label>
                    <Input id="maxParticipants" type="number" min="1" {...register('maxParticipants')} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Параметры маршрута</CardTitle></CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Длительность, часов</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" min="0" placeholder="от" {...register('durationFrom')} />
                      <span className="text-muted-foreground shrink-0">—</span>
                      <Input type="number" min="0" placeholder="до" {...register('durationTo')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distanceKm">Длина маршрута, км</Label>
                    <Input id="distanceKm" type="number" min="0" step="0.1" placeholder="12.5" {...register('distanceKm')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elevationGain">Набор высоты, м</Label>
                    <Input id="elevationGain" type="number" min="0" placeholder="350" {...register('elevationGain')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Сложность</Label>
                    <select id="difficulty" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('difficulty')}>
                      <option value="">Не указано</option>
                      <option value="EASY">Простая</option>
                      <option value="MEDIUM">Средняя</option>
                      <option value="ABOVE_MEDIUM">Выше средней</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="childFriendly">Можно с детьми</Label>
                    <select id="childFriendly" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('childFriendly')}>
                      <option value="">Не указано</option>
                      <option value="yes">Да</option>
                      <option value="no">Нет</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="meetingPoint">Место встречи</Label>
                    <Input id="meetingPoint" placeholder="Например: парковка у входа в нацпарк" {...register('meetingPoint')} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Полное описание *</CardTitle></CardHeader>
                <CardContent>
                  <RichTextEditor value={description} onChange={setDescription} />
                  {description.replace(/<[^>]+>/g, '').trim().length < 20 && (
                    <p className="mt-1 text-sm text-destructive">
                      Описание должно содержать не менее 20 символов
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>История места</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">Необязательный блок — выводится как pull-quote после второго абзаца описания на странице тура.</p>
                  <textarea
                    id="placeHistory"
                    rows={5}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                    placeholder="Расскажите историю этого места..."
                    {...register('placeHistory')}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Включено / Не включено</CardTitle></CardHeader>
                <CardContent className="grid gap-8 md:grid-cols-2">
                  <EditableList title="👥 Для кого" items={forWhom} onChange={setForWhom} />
                  <EditableList title="✅ Включено в стоимость" items={includedItems} onChange={setIncludedItems} />
                  <EditableList title="❌ Не включено" items={notIncludedItems} onChange={setNotIncludedItems} />
                </CardContent>
              </Card>

              {isTourType && (
                <TourProgramSection days={tourProgram} onChange={setTourProgram} />
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving} size="lg">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать карточку'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="photos">
            {isEditMode && id ? (
              <Card>
                <CardContent className="pt-6">
                  <PhotosTab cardId={id} headPhotoUrl={card?.headPhotoUrl} />
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="pricing">
            {isEditMode && id ? (
              <PricingTab cardId={id} />
            ) : null}
          </TabsContent>

          <TabsContent value="schedule">
            {isEditMode && id ? (
              <ScheduleTab cardId={id} />
            ) : null}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
