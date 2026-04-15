import { useQuery } from '@tanstack/react-query';
import { User as UserIcon, Mail, Phone, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatDateTime } from '../lib/utils';

const roleNames = {
  USER: 'Пользователь',
  PARTNER: 'Партнёр',
  ADMIN: 'Администратор',
};

export function ProfilePage() {
  const { user } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.getProfile(),
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
                  <div className="font-medium">{displayUser.phone}</div>
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

          {/* Action Buttons - to be implemented */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Настройки</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Редактировать профиль
              </Button>
              <Button variant="outline" className="w-full mt-2">
                Изменить пароль
              </Button>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
