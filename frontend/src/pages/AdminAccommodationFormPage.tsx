import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, Trash2, GripVertical, Star } from 'lucide-react';
import { accommodationsApi } from '../lib/api/accommodationsApi';
import { handleApiError } from '../lib/axios';
import { api } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { OccupancyCalendar } from '../components/OccupancyCalendar';
import type { AccommodationPhoto, Review } from '../types';

const TYPE_OPTIONS = [
  { value: 'HOTEL', label: 'Отель' },
  { value: 'HOSTEL', label: 'Хостел' },
  { value: 'GUESTHOUSE', label: 'Гостевой дом' },
  { value: 'APARTMENT', label: 'Апартаменты' },
  { value: 'CAMPING', label: 'Кемпинг' },
  { value: 'OTHER', label: 'Другое' },
];

type Tab = 'main' | 'photos' | 'reviews' | 'calendar';

export function AdminAccommodationFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('main');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('OTHER');

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  const { data: accommodation, isLoading } = useQuery({
    queryKey: ['accommodation', id],
    queryFn: () => accommodationsApi.getOne(id!),
    enabled: isEdit,
  });

  const { data: calendarData, isLoading: calLoading, refetch: refetchCal } = useQuery({
    queryKey: ['accommodation-calendar', id, calYear, calMonth],
    queryFn: () => accommodationsApi.getCalendar(id!, calYear, calMonth),
    enabled: isEdit && tab === 'calendar',
  });

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ['accommodation-reviews', id],
    queryFn: () => accommodationsApi.getReviews(id!),
    enabled: isEdit && tab === 'reviews',
  });

  useEffect(() => {
    if (accommodation) {
      setName(accommodation.name);
      setDescription(accommodation.description ?? '');
      setAddress(accommodation.address ?? '');
      setType(accommodation.type ?? 'OTHER');
    }
  }, [accommodation]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const data = { name, description: description || undefined, address: address || undefined, type };
      return isEdit ? accommodationsApi.update(id!, data) : accommodationsApi.create(data);
    },
    onSuccess: (result) => {
      setSuccess('Сохранено');
      queryClient.invalidateQueries({ queryKey: ['admin-accommodations'] });
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
      if (!isEdit) navigate(`/admin/accommodations/${result.id}`);
    },
    onError: (err) => setError(handleApiError(err)),
  });

  // Photos
  const photos: AccommodationPhoto[] = accommodation?.photos ?? [];

  const uploadPhotosMutation = useMutation({
    mutationFn: (files: File[]) => accommodationsApi.uploadPhotos(id!, files),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accommodation', id] }),
    onError: (err) => setError(handleApiError(err)),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => accommodationsApi.deletePhoto(photoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accommodation', id] }),
    onError: (err) => setError(handleApiError(err)),
  });

  // Reviews (admin create)
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const createReviewMutation = useMutation({
    mutationFn: () =>
      api.post('/api/reviews', {
        accommodationId: id,
        authorName: reviewAuthor,
        text: reviewText,
        rating: reviewRating,
        isVisible: true,
      }).then((r) => r.data),
    onSuccess: () => {
      setReviewAuthor('');
      setReviewText('');
      setReviewRating(5);
      refetchReviews();
    },
    onError: (err) => setError(handleApiError(err)),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => api.delete(`/api/reviews/${reviewId}`).then((r) => r.data),
    onSuccess: () => refetchReviews(),
    onError: (err) => setError(handleApiError(err)),
  });

  // Calendar blocks
  const createBlockMutation = useMutation({
    mutationFn: ({ dateFrom, dateTo, reason }: { dateFrom: string; dateTo: string; reason?: string }) =>
      accommodationsApi.createBlock(id!, { dateFrom, dateTo, reason }),
    onSuccess: () => refetchCal(),
    onError: (err) => setError(handleApiError(err)),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId: string) => accommodationsApi.deleteBlock(id!, blockId),
    onSuccess: () => refetchCal(),
    onError: (err) => setError(handleApiError(err)),
  });

  if (isEdit && isLoading) {
    return <div className="container py-16 text-center text-muted-foreground">Загрузка...</div>;
  }

  return (
    <div className="container py-8 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/accommodations')}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Объекты размещения
      </button>

      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? 'Редактировать объект' : 'Новый объект размещения'}
      </h1>

      {/* Tabs */}
      {isEdit && (
        <div className="flex gap-1 mb-6 border-b">
          {(['main', 'photos', 'reviews', 'calendar'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ main: 'Основное', photos: 'Фотографии', reviews: 'Отзывы', calendar: 'Занятость' }[t]}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      {/* Main tab */}
      {(tab === 'main' || !isEdit) && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название объекта" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Тип</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Адрес</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Адрес объекта" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full border rounded px-3 py-2 text-sm resize-y"
                placeholder="Описание объекта размещения"
              />
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !name.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Photos tab */}
      {tab === 'photos' && isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Фотографии ({photos.length}/10)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {photos.length < 10 && (
              <label className="flex items-center gap-2 cursor-pointer px-4 py-3 border-2 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Загрузить фотографии</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length) uploadPhotosMutation.mutate(files);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group aspect-video bg-gray-100 rounded overflow-hidden">
                  <img src={photo.thumbUrl ?? photo.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => deletePhotoMutation.mutate(photo.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews tab */}
      {tab === 'reviews' && isEdit && (
        <div className="space-y-4">
          {/* Add review */}
          <Card>
            <CardHeader><CardTitle>Добавить отзыв</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={reviewAuthor} onChange={(e) => setReviewAuthor(e.target.value)} placeholder="Имя автора" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setReviewRating(n)}>
                    <Star
                      className={`h-5 w-5 ${n <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Текст отзыва"
              />
              <Button
                onClick={() => createReviewMutation.mutate()}
                disabled={createReviewMutation.isPending || !reviewAuthor || !reviewText}
                size="sm"
              >
                Добавить
              </Button>
            </CardContent>
          </Card>

          {/* Reviews list */}
          {(reviews ?? []).map((r: Review) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-sm">{r.authorName}</div>
                  <div className="flex gap-0.5 my-1">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`h-3 w-3 ${n <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{r.text}</p>
                </div>
                <button
                  onClick={() => deleteReviewMutation.mutate(r.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar tab */}
      {tab === 'calendar' && isEdit && (
        <Card>
          <CardHeader><CardTitle>Занятость объекта</CardTitle></CardHeader>
          <CardContent>
            <OccupancyCalendar
              blocks={(calendarData?.blocks ?? []).map((b) => ({
                ...b,
                dateFrom: typeof b.dateFrom === 'string' ? b.dateFrom : new Date(b.dateFrom).toISOString(),
                dateTo: typeof b.dateTo === 'string' ? b.dateTo : new Date(b.dateTo).toISOString(),
              }))}
              orders={calendarData?.orders ?? []}
              year={calYear}
              month={calMonth}
              onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
              onAddBlock={async (dateFrom, dateTo, reason) => {
                await createBlockMutation.mutateAsync({ dateFrom, dateTo, reason });
              }}
              onDeleteBlock={async (blockId) => {
                await deleteBlockMutation.mutateAsync(blockId);
              }}
              isLoading={calLoading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
