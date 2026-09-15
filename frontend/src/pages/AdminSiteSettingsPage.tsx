import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react';
import { defaultSiteMenu, type SiteMenuItem } from '../lib/api/meta';

export function AdminSiteSettingsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [tourProvider, setTourProvider] = useState<'tourvisor' | 'sletat'>('tourvisor');
  const [menuItems, setMenuItems] = useState<SiteMenuItem[]>(defaultSiteMenu);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: () => metaApi.getAdminSettings(),
  });

  useEffect(() => {
    if (data) {
      setSiteName(data.siteName ?? '');
      setSiteDescription(data.siteDescription ?? '');
      setAdminEmail(data.adminEmail ?? '');
      setTourProvider(data.tourProvider === 'sletat' ? 'sletat' : 'tourvisor');
      try {
        const savedMenu = data.menuItems ? JSON.parse(data.menuItems) : null;
        if (Array.isArray(savedMenu)) {
          const hasGuide = savedMenu.some((item) => item.id === 'guide');
          setMenuItems(hasGuide ? savedMenu : [...savedMenu, defaultSiteMenu.find((item) => item.id === 'guide')!]);
        }
      } catch {
        setMenuItems(defaultSiteMenu);
      }
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      metaApi.updateSiteSettings({ siteName, siteDescription, adminEmail, tourProvider }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      setSuccess('Настройки сохранены');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(handleApiError(err));
      setSuccess('');
    },
  });

  const menuMutation = useMutation({
    mutationFn: () => metaApi.updateSiteSettings({ menuItems: JSON.stringify(menuItems) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      setSuccess('Настройки меню сохранены');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => {
      setError(handleApiError(err));
      setSuccess('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setError('Email администратора обязателен');
      return;
    }
    mutation.mutate();
  };

  const updateMenuItem = (id: string, changes: Partial<SiteMenuItem>) => {
    setMenuItems((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  };

  const moveMenuItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= menuItems.length) return;
    setMenuItems((items) => {
      const next = [...items];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const addMenuItem = () => {
    setMenuItems((items) => [...items, {
      id: `custom-${Date.now()}`,
      label: 'Новый пункт',
      path: '/',
      visible: true,
    }]);
  };

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Настройки сайта</h1>
        <p className="text-muted-foreground">
          Общие параметры: название, описание и email для уведомлений.
        </p>
        <div className="mt-3">
          <Link to="/admin/settings/offers" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Управление офертами
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Общие настройки</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Название сайта</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Сезон путешествий"
                />
                <p className="text-xs text-muted-foreground">
                  Используется в заголовке и метатегах
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Описание сайта</Label>
                <textarea
                  id="siteDescription"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="Горные походы и экскурсии в Красной Поляне"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Краткое описание для поисковых систем
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email администратора</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@szntravel.ru"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  На этот адрес приходят уведомления о новых заказах и оплатах
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tourProvider">Поставщик API туров</Label>
                <select
                  id="tourProvider"
                  value={tourProvider}
                  onChange={(e) => setTourProvider(e.target.value as 'tourvisor' | 'sletat')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="tourvisor">Tourvisor</option>
                  <option value="sletat">Слетать.ру</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Лицензия Слетать.ру подключена к szntravel.ru. Для запуска нужны логин и пароль в окружении backend.
                </p>
              </div>

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Управление меню</CardTitle>
          <p className="text-sm text-muted-foreground">
            Меняйте названия, порядок и видимость пунктов в верхнем меню сайта.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {menuItems.map((item, index) => (
            <div key={item.id} className="flex items-start gap-2 rounded-md border p-3">
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_1fr]">
                <Input
                  aria-label={`Название пункта ${index + 1}`}
                  value={item.label}
                  onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                  placeholder="Название пункта"
                />
                <Input
                  aria-label={`Ссылка пункта ${index + 1}`}
                  value={item.path}
                  onChange={(e) => updateMenuItem(item.id, { path: e.target.value })}
                  placeholder="/страница"
                />
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="icon" title="Переместить вверх" onClick={() => moveMenuItem(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" title="Переместить вниз" onClick={() => moveMenuItem(index, 1)} disabled={index === menuItems.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" title={item.visible ? 'Скрыть пункт' : 'Показать пункт'} onClick={() => updateMenuItem(item.id, { visible: !item.visible })}>
                  {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button type="button" variant="ghost" size="icon" title="Удалить пункт" onClick={() => setMenuItems((items) => items.filter((menuItem) => menuItem.id !== item.id))} disabled={item.id === 'guide'}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="gap-2" onClick={addMenuItem}>
            <Plus className="h-4 w-4" />
            Добавить пункт
          </Button>
          <p className="text-xs text-muted-foreground">
            Ссылки указываются в формате `/путь`. Для «Путеводителя» ссылка не используется: открывается выпадающий список его страниц.
          </p>
          <Button type="button" disabled={menuMutation.isPending} onClick={() => menuMutation.mutate()}>
            {menuMutation.isPending ? 'Сохранение...' : 'Сохранить меню'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
