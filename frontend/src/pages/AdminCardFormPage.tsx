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
  Image as ImageIcon,
  MoveUp,
  MoveDown,
  Upload,
} from 'lucide-react';
import { cardsApi, metaApi, ticketsApi, schedulesApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { RichTextEditor } from '../components/RichTextEditor';
import type { CardStatus, CreateCardRequest, UpdateCardRequest, SlideshowPhoto, Ticket, Price } from '../types';
import { PricingType } from '../types';
import type { WeeklySchedulePayload } from '../lib/api/schedules';

const formSchema = z.object({
  userId: z.string().optional(),
  locationId: z.string().min(1, 'Выберите локацию'),
  cardTypeId: z.string().min(1, 'Выберите тип карточки'),
  title: z.string().min(3, 'Название должно быть не короче 3 символов'),
  shortDescription: z.string().optional(),
  tags: z.string().optional(),
  duration: z.string().optional(),
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
    <div className="space-y-8">
      {photoError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{photoError}</div>
      )}

      {/* Main photo */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Заголовочное фото</h3>
        <div className="flex items-start gap-6">
          <div className="h-40 w-64 flex-none overflow-hidden rounded-lg border border-input bg-muted">
            {currentHeadPhoto ? (
              <img src={currentHeadPhoto} alt="Заголовочное фото" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Рекомендуемый размер: 1280×720 px. Форматы: JPG, PNG, WebP.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={uploadMainMutation.isPending}
              onClick={() => mainPhotoInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadMainMutation.isPending ? 'Загрузка...' : 'Загрузить фото'}
            </Button>
            <input
              ref={mainPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMainMutation.mutate(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
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
}

const emptyPriceForm = (): PriceFormState => ({
  dateFrom: '',
  dateTo: '',
  adultPrice: '',
  minPrice: '',
  availableSlots: '',
});

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

  return (
    <div className="rounded-md border border-primary/40 bg-muted/30 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">Дата с *</Label>
          <Input type="date" value={values.dateFrom} onChange={set('dateFrom')} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Дата по *</Label>
          <Input type="date" value={values.dateTo} onChange={set('dateTo')} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Цена (₽) *</Label>
          <Input type="number" min="0" step="0.01" placeholder="2500" value={values.adultPrice} onChange={set('adultPrice')} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Минимальная цена (₽)</Label>
          <Input type="number" min="0" step="0.01" placeholder="1500" value={values.minPrice} onChange={set('minPrice')} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Мест (макс.)</Label>
          <Input type="number" min="1" placeholder="20" value={values.availableSlots} onChange={set('availableSlots')} />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isSaving || !values.dateFrom || !values.dateTo || !values.adultPrice}
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
  return {
    dateFrom: price.dateFrom.slice(0, 10),
    dateTo: price.dateTo.slice(0, 10),
    adultPrice: price.adultPrice,
    minPrice: price.minPrice ?? '',
    availableSlots: price.availableSlots?.toString() ?? '',
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
        adultPrice: parseFloat(v.adultPrice),
        minPrice: v.minPrice ? parseFloat(v.minPrice) : undefined,
        availableSlots: v.availableSlots ? parseInt(v.availableSlots) : undefined,
      }),
    onSuccess: () => { invalidate(); setAddingNew(false); setBlockError(''); },
    onError: (err) => setBlockError(handleApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, v }: { id: string; v: PriceFormState }) =>
      ticketsApi.updatePrice(id, {
        dateFrom: v.dateFrom,
        dateTo: v.dateTo,
        adultPrice: parseFloat(v.adultPrice),
        minPrice: v.minPrice ? parseFloat(v.minPrice) : undefined,
        availableSlots: v.availableSlots ? parseInt(v.availableSlots) : undefined,
      }),
    onSuccess: () => { invalidate(); setEditingId(null); setBlockError(''); },
    onError: (err) => setBlockError(handleApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (priceId: string) => ticketsApi.deletePrice(priceId),
    onSuccess: () => { invalidate(); setBlockError(''); },
    onError: (err) => setBlockError(handleApiError(err)),
  });

  return (
    <div className="space-y-3">
      {blockError && (
        <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{blockError}</div>
      )}

      {isLoading ? (
        <div className="h-10 animate-pulse rounded bg-muted" />
      ) : prices.length === 0 && !addingNew ? (
        <p className="text-sm text-muted-foreground">Ценовых периодов нет. Добавьте первый.</p>
      ) : (
        <div className="space-y-2">
          {prices.map((price) =>
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
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="font-medium">
                    {new Date(price.dateFrom).toLocaleDateString('ru-RU')} — {new Date(price.dateTo).toLocaleDateString('ru-RU')}
                  </span>
                  <span>{parseFloat(price.adultPrice).toLocaleString('ru-RU')} ₽</span>
                  {price.minPrice && (
                    <span className="text-muted-foreground">мин. {parseFloat(price.minPrice).toLocaleString('ru-RU')} ₽</span>
                  )}
                  {price.availableSlots != null && (
                    <span className="text-muted-foreground">мест: {price.availableSlots}</span>
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
  monday: { active: false, times: ['09:00', '18:00'] },
  tuesday: { active: false, times: ['09:00', '18:00'] },
  wednesday: { active: false, times: ['09:00', '18:00'] },
  thursday: { active: false, times: ['09:00', '18:00'] },
  friday: { active: false, times: ['09:00', '18:00'] },
  saturday: { active: false, times: ['09:00', '18:00'] },
  sunday: { active: false, times: ['09:00', '18:00'] },
};

function ScheduleTab({ cardId }: { cardId: string }) {
  const queryClient = useQueryClient();
  const [scheduleError, setScheduleError] = useState('');
  const [weeklyDirty, setWeeklyDirty] = useState(false);

  // New special date form state
  const [newDate, setNewDate] = useState('');
  const [newDateTo, setNewDateTo] = useState('');
  const [newTimeFrom, setNewTimeFrom] = useState('');
  const [newTimeTo, setNewTimeTo] = useState('');
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
        times: newClosed ? [] : [newTimeFrom, newTimeTo].filter(Boolean),
        isClosed: newClosed,
        reason: newReason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-schedule', cardId] });
      setNewDate('');
      setNewDateTo('');
      setNewTimeFrom('');
      setNewTimeTo('');
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
    field: 'active' | 'from' | 'to',
    value: string | boolean,
  ) => {
    setWeekly((prev) => {
      const day = { ...prev[key] };
      const times = [...(day.times ?? ['09:00', '18:00'])];
      if (field === 'active') day.active = value as boolean;
      else if (field === 'from') times[0] = value as string;
      else times[1] = value as string;
      day.times = times;
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
            const timeFrom = day.times?.[0] ?? '09:00';
            const timeTo = day.times?.[1] ?? '18:00';
            return (
              <div key={key} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-36 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.active}
                    onChange={(e) => updateDay(key, 'active', e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className={day.active ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
                </label>
                <span className="text-sm text-muted-foreground shrink-0">с</span>
                <Input
                  type="time"
                  value={timeFrom}
                  disabled={!day.active}
                  onChange={(e) => updateDay(key, 'from', e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground shrink-0">до</span>
                <Input
                  type="time"
                  value={timeTo}
                  disabled={!day.active}
                  onChange={(e) => updateDay(key, 'to', e.target.value)}
                  className="w-32"
                />
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
                <div key={index} className="flex items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
                    <span className="font-medium">
                      {new Date(sd.dateFrom).toLocaleDateString('ru-RU')}
                      {sd.dateTo && sd.dateTo !== sd.dateFrom && (
                        <> — {new Date(sd.dateTo).toLocaleDateString('ru-RU')}</>
                      )}
                    </span>
                    {sd.isClosed ? (
                      <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive font-medium">Закрыто</span>
                    ) : sd.times.length >= 2 ? (
                      <span className="text-muted-foreground">с {sd.times[0]} до {sd.times[1]}</span>
                    ) : sd.times.length === 1 ? (
                      <span className="text-muted-foreground">{sd.times[0]}</span>
                    ) : null}
                    {sd.reason && <span className="text-muted-foreground italic">{sd.reason}</span>}
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
              <div className="space-y-1">
                <Label className="text-xs">Время с</Label>
                <Input
                  type="time"
                  value={newTimeFrom}
                  disabled={newClosed}
                  onChange={(e) => setNewTimeFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Время до</Label>
                <Input
                  type="time"
                  value={newTimeTo}
                  disabled={newClosed}
                  onChange={(e) => setNewTimeTo(e.target.value)}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Причина / комментарий</Label>
                <Input
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Например: Праздничный день"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newClosed}
                onChange={(e) => setNewClosed(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-destructive"
              />
              <span className="text-sm font-medium text-destructive">Закрыта (день недоступен)</span>
            </label>
            <Button
              type="button"
              size="sm"
              disabled={!newDate || addSpecialMutation.isPending}
              onClick={() => addSpecialMutation.mutate()}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              {addSpecialMutation.isPending ? 'Добавление...' : 'Добавить'}
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
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [notIncludedItems, setNotIncludedItems] = useState<string[]>([]);

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
      duration: '',
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
      duration: card.duration?.toString() || '',
      minParticipants: card.minParticipants?.toString() || '',
      maxParticipants: card.maxParticipants?.toString() || '',
      position: card.position.toString(),
      status: card.status,
    });
    setDescription(card.description || '');
    setIncludedItems((card.includedItems as string[] | null) || []);
    setNotIncludedItems((card.notIncludedItems as string[] | null) || []);
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
      duration: toOptionalNumber(values.duration),
      minParticipants: toOptionalNumber(values.minParticipants),
      maxParticipants: toOptionalNumber(values.maxParticipants),
      position: toOptionalNumber(values.position) ?? 0,
      includedItems,
      notIncludedItems,
    };
    if (isEditMode && id) {
      await updateMutation.mutateAsync({ cardId: id, payload: { ...payloadBase, status: values.status } });
    } else {
      await createMutation.mutateAsync(payloadBase);
    }
  };

  const isSaving = isSubmitting || createMutation.isPending || updateMutation.isPending;

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
                    <Label htmlFor="duration">Длительность, мин</Label>
                    <Input id="duration" type="number" min="0" {...register('duration')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Позиция (сортировка)</Label>
                    <Input id="position" type="number" min="0" {...register('position')} />
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
                <CardHeader><CardTitle>Включено / Не включено</CardTitle></CardHeader>
                <CardContent className="grid gap-8 md:grid-cols-2">
                  <EditableList title="✅ Включено в стоимость" items={includedItems} onChange={setIncludedItems} />
                  <EditableList title="❌ Не включено" items={notIncludedItems} onChange={setNotIncludedItems} />
                </CardContent>
              </Card>

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
