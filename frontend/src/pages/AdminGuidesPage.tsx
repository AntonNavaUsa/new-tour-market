import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Camera, Check, Pencil, Plus, Trash2, User, X } from 'lucide-react';
import { guidesApi } from '../lib/api/guides';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import type { Guide } from '../types';

// ── GuideRow ────────────────────────────────────────────────────────────────
function GuideRow({ guide, onSaved, onDeleted }: { guide: Guide; onSaved: () => void; onDeleted: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(guide.name);
  const [description, setDescription] = useState(guide.description ?? '');
  const [location, setLocation] = useState(guide.location ?? '');
  const [certifications, setCertifications] = useState(guide.certifications ?? '');
  const [registryUrl, setRegistryUrl] = useState(guide.registryUrl ?? '');
  const [registryLabel, setRegistryLabel] = useState(guide.registryLabel ?? '');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () =>
      guidesApi.updateGuide(guide.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        certifications: certifications.trim() || undefined,
        registryUrl: registryUrl.trim() || undefined,
        registryLabel: registryLabel.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-guides'] });
      setEditing(false);
      setError('');
      onSaved();
    },
    onError: (e) => setError(handleApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => guidesApi.deleteGuide(guide.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-guides'] });
      onDeleted();
    },
    onError: (e) => setError(handleApiError(e)),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => guidesApi.uploadPhoto(guide.id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-guides'] }),
    onError: (e) => setError(handleApiError(e)),
  });

  return (
    <div className="flex gap-4 rounded-xl border p-4">
      {/* Photo */}
      <div className="relative shrink-0">
        <div
          className="h-20 w-20 rounded-full overflow-hidden border-2 border-muted bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition"
          onClick={() => fileRef.current?.click()}
          title="Нажмите для смены фото"
        >
          {guide.photoUrl ? (
            <img src={guide.photoUrl} alt={guide.name} className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition">
            <Camera className="h-5 w-5 text-white" />
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) photoMutation.mutate(file);
            e.target.value = '';
          }}
        />
        {photoMutation.isPending && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40">
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя гида" className="h-8 text-sm" autoFocus />
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Откуда гид / где живёт, напр: Красная Поляна" className="h-8 text-sm" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание, опыт, специализация..."
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="Квалификации, напр: Удостоверение МЧС · Спасатель" className="h-8 text-sm" />
            <Input value={registryUrl} onChange={(e) => setRegistryUrl(e.target.value)} placeholder="Ссылка на реестр (https://...)" className="h-8 text-sm" type="url" />
            <Input value={registryLabel} onChange={(e) => setRegistryLabel(e.target.value)} placeholder="Текст ссылки (необязательно)" className="h-8 text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !name.trim()}>
                <Check className="h-3 w-3 mr-1" />Сохранить
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setEditing(false);
                setName(guide.name);
                setDescription(guide.description ?? '');
                setLocation(guide.location ?? '');
                setCertifications(guide.certifications ?? '');
                setRegistryUrl(guide.registryUrl ?? '');
                setRegistryLabel(guide.registryLabel ?? '');
                setError('');
              }}>
                <X className="h-3 w-3 mr-1" />Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="font-semibold">{guide.name}</div>
            {guide.location && <p className="text-xs text-muted-foreground mt-0.5">{guide.location}</p>}
            {guide.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{guide.description}</p>}
            {guide.certifications && (
              <p className="text-xs text-muted-foreground mt-1">{guide.certifications}</p>
            )}
            <div className="flex gap-1 mt-2">
              <Button asChild size="sm" variant="outline">
                <Link to={`/admin/guides/${guide.id}/calendar`}>
                  <Calendar className="h-3 w-3 mr-1" />Занятость
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!editing && (
        <div className="flex shrink-0 flex-col gap-1">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(`Удалить гида "${guide.name}"?`)) deleteMutation.mutate();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── AddGuideForm ─────────────────────────────────────────────────────────────
function AddGuideForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const guide = await guidesApi.createGuide({ name: name.trim(), description: description.trim() || undefined, location: location.trim() || undefined });
      if (photoFile) await guidesApi.uploadPhoto(guide.id, photoFile);
      return guide;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-guides'] });
      setName(''); setDescription(''); setLocation(''); setPhotoFile(null); setPhotoPreview(null); setError('');
      onAdded();
    },
    onError: (e) => setError(handleApiError(e)),
  });

  return (
    <div className="rounded-xl border border-dashed p-4 space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Новый гид</p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Photo */}
      <div className="flex items-center gap-4">
        <div
          className="h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-muted bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition relative"
          onClick={() => fileRef.current?.click()}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <User className="h-7 w-7 text-muted-foreground" />
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition">
            <Camera className="h-4 w-4 text-white" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPhotoFile(file);
          setPhotoPreview(URL.createObjectURL(file));
          e.target.value = '';
        }} />
        <div className="text-xs text-muted-foreground">
          {photoFile ? (
            <span className="flex items-center gap-1 text-primary"><Check className="h-3 w-3" /> {photoFile.name}</span>
          ) : (
            <button type="button" className="underline hover:no-underline" onClick={() => fileRef.current?.click()}>Выбрать фото</button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ag-name" className="text-xs">Имя *</Label>
        <Input id="ag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя и фамилия" className="h-8 text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ag-location" className="text-xs">Откуда гид / где живёт</Label>
        <Input id="ag-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="напр: Красная Поляна, Сочи" className="h-8 text-sm" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ag-desc" className="text-xs">Описание</Label>
        <textarea
          id="ag-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Опыт, специализация, интересные факты..."
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending || !name.trim()}>
        {mutation.isPending ? 'Добавление...' : 'Добавить гида'}
      </Button>
    </div>
  );
}

// ── AdminGuidesPage ──────────────────────────────────────────────────────────
export function AdminGuidesPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: guides = [], isLoading } = useQuery({
    queryKey: ['admin-guides'],
    queryFn: () => guidesApi.getAllGuides(),
  });

  return (
    <div className="container py-10 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Гиды</h1>
          <p className="text-muted-foreground mt-1">Управление всеми гидами платформы</p>
        </div>
        <Button onClick={() => setShowAddForm((v) => !v)} variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-6">
          <AddGuideForm onAdded={() => setShowAddForm(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">Загрузка...</div>
      ) : guides.length === 0 && !showAddForm ? (
        <div className="py-16 text-center text-muted-foreground">
          <User className="mx-auto mb-3 h-12 w-12 opacity-30" />
          <p>Гидов нет. Нажмите «Добавить» для создания.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {guides.map((guide) => (
            <GuideRow key={guide.id} guide={guide} onSaved={() => {}} onDeleted={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}
