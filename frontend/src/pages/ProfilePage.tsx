import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User as UserIcon, Mail, Phone, Shield, Plus, Pencil, Trash2, Camera, Check, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi, guidesApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { formatDateTime } from '../lib/utils';
import { handleApiError } from '../lib/axios';
import type { Guide } from '../types';

const roleNames: Record<string, string> = {
  USER: 'Пользователь',
  PARTNER: 'Партнёр',
  ADMIN: 'Администратор',
};

// ---- Guide row: view / edit in-place ----
function GuideRow({
  guide,
  onSaved,
  onDeleted,
}: {
  guide: Guide;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(guide.name);
  const [description, setDescription] = useState(guide.description ?? '');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () => guidesApi.updateGuide(guide.id, { name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guides'] });
      setEditing(false);
      setError('');
      onSaved();
    },
    onError: (e) => setError(handleApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => guidesApi.deleteGuide(guide.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guides'] });
      onDeleted();
    },
    onError: (e) => setError(handleApiError(e)),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => guidesApi.uploadPhoto(guide.id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-guides'] }),
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
            <UserIcon className="h-8 w-8 text-muted-foreground" />
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
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя гида"
              className="h-8 text-sm"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание, опыт, специализация..."
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !name.trim()}
              >
                <Check className="h-3 w-3 mr-1" />
                Сохранить
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setName(guide.name);
                  setDescription(guide.description ?? '');
                  setError('');
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="font-semibold">{guide.name}</div>
            {guide.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-3">{guide.description}</p>
            )}
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
              if (window.confirm(`Удалить гида "${guide.name}"?`)) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---- Add guide form ----
function AddGuideForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    e.target.value = '';
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const guide = await guidesApi.createGuide({ name: name.trim(), description: description.trim() || undefined });
      if (photoFile) {
        await guidesApi.uploadPhoto(guide.id, photoFile);
      }
      return guide;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guides'] });
      setName('');
      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setError('');
      onAdded();
    },
    onError: (e) => setError(handleApiError(e)),
  });

  return (
    <div className="rounded-xl border border-dashed p-4 space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Новый гид</p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Photo picker */}
      <div className="flex items-center gap-4">
        <div
          className="h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-muted bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 transition relative"
          onClick={() => fileRef.current?.click()}
          title="Выбрать фото"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-7 w-7 text-muted-foreground" />
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition">
            <Camera className="h-4 w-4 text-white" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <div className="text-xs text-muted-foreground">
          {photoFile ? (
            <span className="flex items-center gap-1 text-primary">
              <Check className="h-3 w-3" /> {photoFile.name}
            </span>
          ) : (
            <button type="button" className="underline hover:no-underline" onClick={() => fileRef.current?.click()}>
              Выбрать фото
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="guide-name" className="text-xs">Имя *</Label>
        <Input
          id="guide-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя и фамилия"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="guide-desc" className="text-xs">Описание</Label>
        <textarea
          id="guide-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Опыт, специализация, интересные факты..."
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <Button
        size="sm"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !name.trim()}
      >
        {mutation.isPending ? 'Добавление...' : 'Добавить гида'}
      </Button>
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuthStore();
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
  });

  const { data: guides = [], isLoading: guidesLoading } = useQuery({
    queryKey: ['my-guides'],
    queryFn: () => guidesApi.getMyGuides(),
    enabled: !!(profile?.role === 'PARTNER' || profile?.role === 'ADMIN' || user?.role === 'PARTNER' || user?.role === 'ADMIN'),
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  const displayUser = profile || user;

  if (!displayUser) {
    return (
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Не удалось загрузить профиль</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPartnerOrAdmin = displayUser.role === 'PARTNER' || displayUser.role === 'ADMIN';

  return (
    <div className="container py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Мой профиль</h1>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Личная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Имя</div>
                <div className="font-medium">{displayUser.name}</div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <div className="font-medium">{displayUser.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-1">Телефон</div>
                  <div className="font-medium">{(displayUser as any).phone ?? '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-1">Роль</div>
                  <div className="font-medium">
                    {roleNames[displayUser.role] || displayUser.role}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Информация об аккаунте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Дата регистрации
                </div>
                <div className="font-medium">
                  {formatDateTime(displayUser.createdAt)}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Последнее обновление
                </div>
                <div className="font-medium">
                  {formatDateTime(displayUser.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guides block — only for PARTNER / ADMIN */}
          {isPartnerOrAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Гиды программы
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddForm((v) => !v)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Эти гиды будут показаны на всех ваших турах
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddForm && (
                  <AddGuideForm onAdded={() => setShowAddForm(false)} />
                )}

                {guidesLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : guides.length === 0 && !showAddForm ? (
                  <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                    Гиды не добавлены. Нажмите «Добавить», чтобы создать первого гида.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {guides.map((guide) => (
                      <GuideRow
                        key={guide.id}
                        guide={guide}
                        onSaved={() => {}}
                        onDeleted={() => {}}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
