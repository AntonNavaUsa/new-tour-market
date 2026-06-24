import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Copy, Check, Edit2, X, ExternalLink } from 'lucide-react';
import { gpxApi, GpxFile } from '../lib/api/gpx';
import { Button } from '../components/ui/button';
import { handleApiError } from '../lib/axios';

const API_URL = import.meta.env.VITE_API_URL ?? '';

function clientLink(slug: string) {
  return `${API_URL}/gpx/${slug}`;
}

function UploadForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (fd: FormData) => gpxApi.create(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gpx-files'] });
      onClose();
    },
    onError: (e) => setError(handleApiError(e)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Выберите GPX файл'); return; }
    if (!name.trim()) { setError('Введите название'); return; }
    if (!slug.trim()) { setError('Введите слаг'); return; }
    const fd = new FormData();
    fd.append('name', name.trim());
    fd.append('slug', slug.trim().toLowerCase());
    if (description.trim()) fd.append('description', description.trim());
    fd.append('file', file);
    createMutation.mutate(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-5 bg-stone-50 mb-6 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-sm">Загрузить новый трек</h2>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Название</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Кейва — горный маршрут"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Слаг <span className="text-muted-foreground">(для URL)</span>
          </label>
          <input
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono"
            placeholder="keiva"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">
          Описание <span className="text-muted-foreground">(необязательно)</span>
        </label>
        <textarea
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          rows={2}
          placeholder="Маршрут через перевал Кейва, 18 км"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">GPX-файл</label>
        <input
          ref={fileRef}
          type="file"
          accept=".gpx,application/gpx+xml"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:cursor-pointer"
        />
      </div>
      <Button type="submit" disabled={createMutation.isPending} size="sm">
        {createMutation.isPending ? 'Загрузка...' : 'Загрузить'}
      </Button>
    </form>
  );
}

function EditForm({ file, onClose }: { file: GpxFile; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(file.name);
  const [slug, setSlug] = useState(file.slug);
  const [description, setDescription] = useState(file.description ?? '');
  const [error, setError] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; slug?: string; description?: string }) =>
      gpxApi.update(file.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gpx-files'] });
      onClose();
    },
    onError: (e) => setError(handleApiError(e)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 space-y-2">
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <input
          className="border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название"
        />
        <input
          className="border rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug"
        />
      </div>
      <textarea
        className="w-full border rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Описание (необязательно)"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
          Сохранить
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      title="Скопировать ссылку"
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function AdminGpxFilesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['admin-gpx-files'],
    queryFn: gpxApi.findAll,
  });

  const deleteMutation = useMutation({
    mutationFn: gpxApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-gpx-files'] }),
    onError: (e) => setError(handleApiError(e)),
  });

  return (
    <div className="container py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">GPX-треки</h1>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Загрузить трек
          </Button>
        )}
      </div>

      {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

      {showForm && <UploadForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-stone-100 rounded-lg" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          GPX-треков пока нет. Загрузите первый.
        </div>
      ) : (
        <div className="divide-y border rounded-lg bg-white">
          {files.map((file) => (
            <div key={file.id} className="px-4 py-3">
              {editingId === file.id ? (
                <EditForm file={file} onClose={() => setEditingId(null)} />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{file.name}</p>
                    {file.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{file.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {clientLink(file.slug)}
                      </span>
                      <CopyButton text={clientLink(file.slug)} />
                      <a
                        href={clientLink(file.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Открыть страницу"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(file.id)}
                      title="Редактировать"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      title="Удалить"
                      onClick={() => {
                        if (confirm(`Удалить трек "${file.name}"?`)) {
                          deleteMutation.mutate(file.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
