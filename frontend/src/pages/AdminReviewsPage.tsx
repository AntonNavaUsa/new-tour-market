import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit2, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import { cardsApi, reviewsApi } from '../lib/api';
import type { Review } from '../lib/api/reviews';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const EMPTY_FORM = {
  cardIds: [] as string[],
  authorName: '',
  title: '',
  text: '',
  rating: 5,
  isVisible: true,
  sortOrder: 0,
};

export function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<Review | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => reviewsApi.findAll(),
  });

  const { data: cardsData } = useQuery({
    queryKey: ['admin-cards-list'],
    queryFn: () => cardsApi.getCards({ includeNonPublished: true, take: 200 }),
  });
  const allCards = cardsData?.data ?? [];
  const selectedCards = form.cardIds
    .map((cardId) => allCards.find((card) => card.id === cardId))
    .filter((card): card is NonNullable<typeof card> => Boolean(card));

  const toggleCardId = (cardId: string) => {
    setForm((current) => ({
      ...current,
      cardIds: current.cardIds.includes(cardId)
        ? current.cardIds.filter((item) => item !== cardId)
        : [...current.cardIds, cardId],
    }));
  };

  const removeCardId = (cardId: string) => {
    setForm((current) => ({
      ...current,
      cardIds: current.cardIds.filter((item) => item !== cardId),
    }));
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      reviewsApi.create({ ...data, cardIds: data.cardIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setCreating(false);
      setForm(EMPTY_FORM);
      setError('');
    },
    onError: (e) => setError(handleApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_FORM }) =>
      reviewsApi.update(id, { ...data, cardIds: data.cardIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setEditing(null);
      setError('');
    },
    onError: (e) => setError(handleApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
    onError: (e) => setError(handleApiError(e)),
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => reviewsApi.uploadPhoto(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
    onError: (e) => setError(handleApiError(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setCreating(true);
  };

  const openEdit = (r: Review) => {
    setCreating(false);
    setError('');
    setForm({
      cardIds: r.reviewCards?.length
        ? r.reviewCards.map((item) => item.cardId)
        : r.cardId
          ? [r.cardId]
          : [],
      authorName: r.authorName,
      title: r.title ?? '',
      text: r.text,
      rating: r.rating,
      isVisible: r.isVisible,
      sortOrder: r.sortOrder,
    });
    setEditing(r);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handlePhotoChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadPhotoMutation.mutate({ id, file });
    e.target.value = '';
  };

  const isFormOpen = creating || !!editing;

  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Отзывы</h1>
          <p className="text-muted-foreground">Управление отзывами на туры</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить отзыв
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border bg-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editing ? 'Редактировать отзыв' : 'Новый отзыв'}</h2>
            <button type="button" onClick={() => { setCreating(false); setEditing(null); }}>
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>

          {/* Card select */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium block">Карточка тура</label>
              {form.cardIds.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setForm({ ...form, cardIds: [] })}
                >
                  Очистить выбор
                </Button>
              )}
            </div>
            <div className="mt-2 rounded-xl border border-input bg-background p-3">
              {allCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">Карточки тура пока не загружены.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {allCards.map((card) => {
                    const checked = form.cardIds.includes(card.id);

                    return (
                      <label
                        key={card.id}
                        className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          checked
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-border hover:border-primary/30 hover:bg-muted/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCardId(card.id)}
                          className="mt-1 h-4 w-4 shrink-0"
                        />
                        <span className="leading-5">{card.title}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCards.length > 0 ? (
                selectedCards.map((card) => (
                  <span
                    key={card.id}
                    className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs"
                  >
                    <span className="max-w-[220px] truncate">{card.title}</span>
                    <button
                      type="button"
                      onClick={() => removeCardId(card.id)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Удалить ${card.title}`}
                      title="Удалить"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  Если ничего не выбрано, отзыв будет общим для всех карточек.
                </p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Имя автора *</label>
              <Input
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                required
                placeholder="Иван Иванов"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Заголовок</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Отличный тур!"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Текст отзыва *</label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              required
              placeholder="Текст отзыва..."
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Рейтинг</label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, rating: n })}
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        n <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30 hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Порядок</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Отображать</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setCreating(false); setEditing(null); }}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Отзывов пока нет</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-4 rounded-2xl border bg-card p-5">
              {/* Photo */}
              <div className="relative shrink-0">
                <div className="h-14 w-14 rounded-full overflow-hidden bg-muted border flex items-center justify-center">
                  {review.authorPhoto ? (
                    <img src={review.authorPhoto} alt={review.authorName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">
                      {review.authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  title="Загрузить фото"
                  onClick={() => {
                    const input = document.getElementById(`photo-${review.id}`) as HTMLInputElement;
                    input?.click();
                  }}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:opacity-90"
                >
                  <Upload className="h-3 w-3" />
                </button>
                <input
                  id={`photo-${review.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(review.id, e)}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{review.authorName}</p>
                    {review.card && (
                      <p className="text-xs text-muted-foreground">{review.card.title}</p>
                    )}
                    {(review.reviewCards?.length ?? 0) > 0 ? (
                      <p className="text-xs text-muted-foreground">Карточек тура: {review.reviewCards?.length}</p>
                    ) : !review.cardId && (
                      <p className="text-xs text-muted-foreground italic">Все карточки</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    {!review.isVisible && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">скрыт</span>
                    )}
                    <button type="button" onClick={() => openEdit(review)} className="p-1.5 rounded-md hover:bg-muted transition">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (confirm('Удалить отзыв?')) deleteMutation.mutate(review.id); }}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {review.title && <p className="font-medium text-sm mt-1">{review.title}</p>}
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{review.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
