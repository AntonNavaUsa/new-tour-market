import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { metaApi } from '../lib/api';
import { handleApiError } from '../lib/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

export function AdminSiteSettingsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: () => metaApi.getAdminSettings(),
  });

  useEffect(() => {
    if (data) {
      setSiteName(data.siteName ?? '');
      setSiteDescription(data.siteDescription ?? '');
      setAdminEmail(data.adminEmail ?? '');
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      metaApi.updateSiteSettings({ siteName, siteDescription, adminEmail }),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setError('Email администратора обязателен');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Настройки сайта</h1>
        <p className="text-muted-foreground">
          Общие параметры: название, описание и email для уведомлений.
        </p>
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
                  placeholder="Сезон приключений"
                />
                <p className="text-xs text-muted-foreground">
                  Используется в заголовке и метатегах
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Описание сайта</Label>
                <Textarea
                  id="siteDescription"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder="Горные походы и экскурсии в Красной Поляне"
                  rows={3}
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

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
