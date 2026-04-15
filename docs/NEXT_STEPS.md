# Инструкция по продолжению разработки

## Что уже готово

✅ **Инфраструктура полностью настроена**
- Docker Compose с PostgreSQL, MinIO, Mailpit
- Переменные окружения настроены
- Базовая документация создана

✅ **Backend основа готова**
- NestJS проект инициализирован
- Prisma schema с полной схемой БД
- Модуль аутентификации (регистрация, логин, JWT)
- Модуль Cards (CRUD карточек туров)
- Guards для защиты роутов
- Swagger документация настроена

✅ **Frontend основа готова**
- React + Vite проект инициализирован
- TanStack Query настроен
- Tailwind CSS + shadcn/ui
- React Router v6

## Следующие шаги

### ШАГ 1: Запуск и проверка текущего состояния

```bash
# 1. Запустите инфраструктуру
docker-compose up -d postgres minio mailpit

# 2. Установите зависимости backend
cd backend
npm install

# 3. Сгенерируйте Prisma Client
npx prisma generate

# 4. Примените миграции
npx prisma migrate dev --name init

# 5. Заполните тестовыми данными
npm run prisma:seed

# 6. Запустите backend
npm run start:dev
# Backend доступен на http://localhost:3000
# Swagger: http://localhost:3000/api/docs

# 7. В новом терминале - установите зависимости frontend
cd ../frontend
npm install

# 8. Запустите frontend
npm run dev
# Frontend доступен на http://localhost:5173
```

### ШАГ 2: Проверьте работоспособность

1. **Откройте Swagger**: http://localhost:3000/api/docs
2. **Проверьте endpoint'ы**:
   - POST /api/auth/register - регистрация
   - POST /api/auth/login - логин
   - GET /api/cards - список карточек
3. **Протестируйте в Swagger**:
   - Создайте пользователя
   - Залогиньтесь (получите access_token)
   - Используйте Authorize кнопку для добавления Bearer token
   - Создайте карточку тура

### ШАГ 3: Разработка модуля Tickets & Prices

Создайте следующие файлы:

**backend/src/tickets/tickets.module.ts**
```typescript
import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
```

**backend/src/tickets/tickets.service.ts**
- `createTicket(cardId, dto)` - создать тип билета
- `updateTicket(id, dto)` - обновить
- `deleteTicket(id)` - удалить
- `createPrice(ticketId, dto)` - добавить цену на период
- `getPrices(ticketId, filters)` - получить прайс-лист
- `getAvailability(ticketId, date)` - проверить доступность

**backend/src/tickets/tickets.controller.ts**
- POST /cards/:cardId/tickets
- PATCH /tickets/:id
- DELETE /tickets/:id
- POST /tickets/:id/prices
- GET /tickets/:id/prices
- GET /tickets/:id/availability

**backend/src/tickets/dto/index.ts**
- CreateTicketDto
- UpdateTicketDto
- CreatePriceDto
- PriceFilterDto

### ШАГ 4: Разработка модуля Schedules

**backend/src/schedules/schedules.module.ts**
**backend/src/schedules/schedules.service.ts**
- `updateWeeklySchedule(cardId, dto)` - обновить недельное расписание
- `addSpecialDate(cardId, dto)` - добавить исключение
- `getAvailableTimes(cardId, date)` - получить доступные времена
- `isTimeAvailable(cardId, date, time)` - проверить конкретное время

**backend/src/schedules/schedules.controller.ts**
- PUT /cards/:cardId/schedule/weekly
- POST /cards/:cardId/schedule/special-dates
- GET /cards/:cardId/schedule/available?date=YYYY-MM-DD

### ШАГ 5: Разработка модуля Orders

**backend/src/orders/orders.module.ts**
**backend/src/orders/orders.service.ts**
- `createPreOrder(userId, dto)` - создать предзаказ (status=PREORDER)
- `confirmBooking(orderId)` - подтвердить (status=CONFIRMED)
- `getUserOrders(userId, filters)` - список заказов пользователя
- `getOrderById(id)` - детали заказа
- `checkAndMarkExpired()` - проверка истечения (>20 мин)

**backend/src/orders/orders.controller.ts**
- POST /orders - создать предзаказ
- GET /orders - список заказов текущего пользователя
- GET /orders/:id - детали заказа
- POST /orders/:id/confirm - подтвердить бронь

**Scheduled task** для проверки истечения заказов каждую минуту.

### ШАГ 6: Разработка модуля Payments

**backend/src/payments/payments.module.ts**
**backend/src/payments/payments.service.ts**
- `initiatePayment(orderId, amount)` - создать платеж в YooKassa
- `handleSuccess(paymentId)` - обработать успешную оплату
- `getPaymentStatus(paymentId)` - проверить статус
- Интеграция YooKassa SDK

**backend/src/payments/payments.controller.ts**
- POST /payments/create
- GET /payments/:id/status
- GET /payments/callback?orderId=...

### ШАГ 7: Разработка модуля Files (MinIO)

**backend/src/files/files.module.ts**
**backend/src/files/files.service.ts**
- Настройка MinIO client
- `uploadImage(file, bucket)` - загрузка с оптимизацией (Sharp, WebP)
- `deleteFile(url)` - удаление
- `getPresignedUrl(url)` - получить временный URL

**backend/src/files/files.controller.ts**
- POST /files/upload
- DELETE /files/:id

**Интеграция с Cards**:
- POST /cards/:id/photos/head - загрузка главного фото
- POST /cards/:id/photos/slideshow - загрузка в галерею

### ШАГ 8: Frontend - API Client

**frontend/src/lib/axios.ts**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Request interceptor для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Попытка обновить токен
      // или редирект на логин
    }
    return Promise.reject(error);
  }
);

export default api;
```

**frontend/src/services/auth.service.ts**
```typescript
import api from '@/lib/axios';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
```

**frontend/src/hooks/useAuth.ts**
```typescript
import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

export const useAuth = () => {
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.data.accessToken);
      localStorage.setItem('refresh_token', data.data.refreshToken);
    },
  });

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    enabled: !!localStorage.getItem('access_token'),
  });

  return {
    login: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    profile: profileQuery.data?.data,
    isAuthenticated: !!profileQuery.data,
  };
};
```

### ШАГ 9: Frontend - Публичные страницы

**frontend/src/pages/CardsListPage.tsx**
- Каталог карточек
- Фильтры (локация, теги, цена)
- Пагинация/бесконечная прокрутка

**frontend/src/pages/CardDetailPage.tsx**
- Детали карточки
- Фотогалерея
- Информация о ценах
- Кнопка "Забронировать"

**frontend/src/pages/BookingPage.tsx**
- Форма бронирования
- Выбор даты и времени
- Выбор типов билетов
- Расчет суммы
- Создание предзаказа

**frontend/src/pages/PaymentPage.tsx**
- Интеграция YooKassa Widget
- Обработка результата оплаты

### ШАГ 10: Frontend - Админка

**frontend/src/pages/admin/Dashboard.tsx**
**frontend/src/pages/admin/CardsManagePage.tsx**
**frontend/src/pages/admin/CardEditPage.tsx**
- Табы: Основное, Медиа, Цены, Расписание
- WYSIWYG редактор для описания
- Drag-n-drop для фото

**frontend/src/pages/admin/OrdersPage.tsx**
- Таблица заказов
- Фильтры по статусу
- Экспорт в CSV

**frontend/src/pages/admin/CalendarPage.tsx**
- Месячный календарь
- Индикация занятости
- Детали дня

## Приоритеты

**Высокий приоритет:**
1. Модуль Tickets & Prices (без него нельзя бронировать)
2. Модуль Schedules (проверка доступности)
3. Модуль Orders (система бронирования)
4. Frontend API client + Auth

**Средний приоритет:**
5. Модуль Payments (YooKassa)
6. Модуль Files (MinIO загрузка)
7. Frontend публичные страницы

**Низкий приоритет:**
8. Frontend админка
9. Email уведомления
10. Календарь занятости

## Полезные ресурсы

- **NestJS документация**: https://docs.nestjs.com/
- **Prisma документация**: https://www.prisma.io/docs
- **YooKassa Node.js SDK**: https://github.com/yoomoney/yookassa-sdk-nodejs
- **TanStack Query**: https://tanstack.com/query/latest
- **Shadcn/ui**: https://ui.shadcn.com/
- **MinIO JavaScript SDK**: https://min.io/docs/minio/linux/developers/javascript/API.html

## Советы

1. **Тестируйте через Swagger** - это быстрее чем создавать frontend формы
2. **Используйте Prisma Studio** - `npx prisma studio` для просмотра БД
3. **Проверяйте Mailpit** - все email будут там: http://localhost:8025
4. **MinIO Console** - управление файлами: http://localhost:9001
5. **React Query DevTools** - автоматически включен в dev режиме
6. **Git commits** - делайте частые коммиты после каждого модуля

## Структура коммитов

```
feat(auth): add JWT authentication module
feat(cards): add cards CRUD operations
feat(tickets): add tickets and prices management
feat(schedules): add schedule management
feat(orders): add booking system
feat(payments): integrate YooKassa
feat(frontend): add cards catalog page
```

---

**Удачи в разработке! 🚀**

Если возникнут вопросы - обращайтесь к документации или изучайте уже созданный код в модулях Auth и Cards как примеры.
