import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { guidePagesApi } from '../lib/api';
import type { GuidePage } from '../lib/api/guide-pages';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { RichEditor } from '../components/RichEditor';

const EMPTY: Partial<GuidePage> = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  headPhotoUrl: '',
  isPublished: false,
  sortOrder: 0,
};

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[а-яёА-ЯЁ]/g, (c) => {
      const map: Record<string, string> = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
        н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',
        ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
      };
      return map[c] ?? c;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminGuidePageFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Partial<GuidePage>>(EMPTY);
  const [error, setError] = useState('');
  const [slugManual, setSlugManual] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['admin-guide-page', id],
    queryFn: () => guidePagesApi.adminGet(id!),
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing) {
      setForm(existing);
      setSlugManual(true);
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<GuidePage>) =>
      isNew ? guidePagesApi.create(data) : guidePagesApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-guide-pages'] });
      navigate('/admin/guide-pages');
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Ошибка сохранения'),
  });

  function set(field: keyof GuidePage, val: unknown) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  function handleTitleChange(title: string) {
    set('title', title);
    if (!slugManual) set('slug', toSlug(title));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.title?.trim()) return setError('Заголовок обязателен');
    if (!form.slug?.trim()) return setError('Slug обязателен');
    saveMutation.mutate(form);
  }

  if (!isNew && isLoading) {
    return <div className="container py-8"><div className="animate-pulse h-8 w-48 bg-stone-100 rounded" /></div>;
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/guide-pages')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold">{isNew ? 'Новая страница' : 'Редактировать страницу'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Заголовок *</label>
          <Input
            value={form.title ?? ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Весна на Красной Поляне"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium mb-1">
            URL (slug) *
            <span className="text-muted-foreground font-normal ml-2 text-xs">
              /guides/<strong>{form.slug || '...'}</strong>
            </span>
          </label>
          <Input
            value={form.slug ?? ''}
            onChange={(e) => {
              setSlugManual(true);
              set('slug', e.target.value);
            }}
            placeholder="spring-krasnaya-polyana"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium mb-1">Краткое описание (excerpt)</label>
          <Input
            value={form.excerpt ?? ''}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="Краткое описание для списка и SEO..."
          />
        </div>

        {/* Head photo URL */}
        <div>
          <label className="block text-sm font-medium mb-1">URL обложки</label>
          <Input
            value={form.headPhotoUrl ?? ''}
            onChange={(e) => set('headPhotoUrl', e.target.value)}
            placeholder="/img/photo-xxx.jpg"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-1">Содержимое *</label>
          <RichEditor
            value={form.content ?? ''}
            onChange={(html) => set('content', html)}
          />
        </div>

        {/* Options row */}
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isPublished ?? false}
              onChange={(e) => set('isPublished', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Опубликовать</span>
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Порядок сортировки</label>
            <Input
              type="number"
              className="w-20"
              value={form.sortOrder ?? 0}
              onChange={(e) => set('sortOrder', Number(e.target.value))}
            />
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/guide-pages')}>
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
