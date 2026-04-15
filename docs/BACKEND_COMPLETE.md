# 🎉 Backend полностью реализован!

## ✅ Что завершено

Все критически важные backend модули реализованы:

### 1. **Аутентификация** ✅
- JWT авторизация с refresh tokens
- Role-based access control (Admin, Partner, User)
- Guards для защиты endpoints

### 2. **Cards (Карточки туров)** ✅
- CRUD операции
- Фильтрация и поиск
- Управление фотографиями
- Проверка прав доступа

### 3. **Tickets & Prices** ✅
- Типы билетов (взрослый, детский и т.д.)
- Управление ценами на периоды
- Проверка доступности
- Защита от перекрывающихся периодов

### 4. **Schedules (Расписание)** ✅
- Недельное расписание
- Специальные даты (праздники, закрытия)
- API доступных времен
- Месячный обзор

### 5. **Orders (Бронирование)** ✅
- Создание предзаказов
- Валидация доступности
- Автоматическое истечение через 20 минут
- Подтверждение и отмена
- История для пользователей/партнеров/админов

### 6. **Payments (YooKassa)** ✅
- Создание платежей
- Embedded виджет YooKassa
- Проверка статуса
- Обработка callback
- Автообновление статуса заказа

### 7. **Files (MinIO хранилище)** ✅
- Интеграция MinIO SDK (S3-совместимое хранилище)
- Автоматическая оптимизация изображений (Sharp)
- Конвертация в WebP для экономии трафика
- Три bucket'а: `cards`, `photos`, `expressions`
- Endpoints для загрузки:
  - POST `/api/cards/:id/photos/main` - главное фото карточки
  - POST `/api/cards/:id/photos/slideshow` - фотогалерея (до 10 фото)
  - POST `/api/cards/:id/photos/expressions` - впечатления
- Публичные URL для доступа к изображениям

### 8. **Notifications (Email уведомления)** ✅
- Nodemailer с SMTP (Mailpit для разработки)
- HTML шаблоны с адаптивной версткой
- Автоматические уведомления:
  - Пользователю при подтверждении бронирования
  - Админу о новом заказе
  - Пользователю об успешной оплате
- Graceful error handling (не падает если письмо не отправилось)

## 🚀 Запуск проекта

### 1. Запустите инфраструктуру

```bash
docker-compose up -d postgres minio mailpit
```

### 2. Настройте Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

Backend запустится на **http://localhost:3000**  
Swagger документация: **http://localhost:3000/api/docs**

### 3. Настройте Frontend (опционально)

```bash
cd frontend
npm install
npm run dev
```

Frontend запустится на **http://localhost:5173**

## 📊 Доступные API endpoints

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновить токен
- `GET /api/auth/profile` - Профиль пользователя

### Cards
- `GET /api/cards` - Список карточек (с фильтрами)
- `GET /api/cards/:id` - Детали карточки
- `POST /api/cards` - Создать карточку
- `PATCH /api/cards/:id` - Обновить
- `DELETE /api/cards/:id` - Удалить
- `GET /api/cards/my` - Мои карточки

### Tickets
- `POST /api/tickets/cards/:cardId/tickets` - Создать тип билета
- `GET /api/tickets/cards/:cardId/tickets` - Список билетов карточки
- `GET /api/tickets/:id` - Детали билета
- `PATCH /api/tickets/:id` - Обновить билет
- `DELETE /api/tickets/:id` - Удалить билет

### Prices
- `POST /api/tickets/:ticketId/prices` - Добавить цену
- `GET /api/tickets/:ticketId/prices` - История цен
- `PATCH /api/tickets/prices/:priceId` - Обновить цену
- `DELETE /api/tickets/prices/:priceId` - Удалить цену
- `POST /api/tickets/:ticketId/check-availability` - Проверить доступность

### Schedules
- `GET /api/schedules/cards/:cardId` - Получить расписание
- `PUT /api/schedules/cards/:cardId/weekly` - Обновить недельное расписание
- `POST /api/schedules/cards/:cardId/special-dates` - Добавить спец. дату
- `DELETE /api/schedules/cards/:cardId/special-dates/:index` - Удалить
- `POST /api/schedules/cards/:cardId/available-times` - Доступные времена
- `GET /api/schedules/cards/:cardId/month/:year/:month` - Месячный обзор

### Orders
- `POST /api/orders` - Создать предзаказ
- `GET /api/orders` - Мои заказы
- `GET /api/orders/all` - Все заказы (admin/partner)
- `GET /api/orders/:id` - Детали заказа
- `POST /api/orders/:id/confirm` - Подтвердить бронь
- `POST /api/orders/:id/cancel` - Отменить заказ

### Payments
- `POST /api/payments/create` - Создать платеж
- `GET /api/payments/:id/status` - Статус платежа
- `GET /api/payments/callback` - Callback от YooKassa
- `POST /api/payments/:id/success` - Ручная обработка (тест)
- `GET /api/payments/all` - Все платежи (admin)

## 🧪 Тестирование через Swagger

1. Откройте **http://localhost:3000/api/docs**
2. Зарегистрируйте пользователя через `POST /auth/register`
3. Войдите через `POST /auth/login` и скопируйте `accessToken`
4. Нажмите кнопку **Authorize** вверху и вставьте токен
5. Теперь можете тестировать защищенные endpoints!

## 👤 Тестовые пользователи

После seed (`npm run prisma:seed`):

```
Admin:
  Email: admin@travelio.local
  Password: admin123

Partner:
  Email: partner@travelio.local
  Password: partner123

User:
  Email: user@travelio.local
  Password: user123
```

## 📝 Пример: Создание полного тура

### 1. Залогиньтесь как партнер

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "partner@travelio.local",
    "password": "partner123"
  }'
```

Скопируйте `accessToken`.

### 2. Создайте карточку тура

```bash
curl -X POST http://localhost:3000/api/cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "locationId": "LOCATION_ID_FROM_SEED",
    "cardTypeId": "CARD_TYPE_ID_FROM_SEED",
    "title": "Экскурсия в горы",
    "description": "Незабываемое путешествие",
    "duration": 240,
    "status": "PUBLISHED"
  }'
```

### 3. Создайте тип билета

```bash
curl -X POST http://localhost:3000/api/tickets/cards/CARD_ID/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Взрослый",
    "description": "Для лиц старше 12 лет",
    "isMain": true
  }'
```

### 4. Добавьте цену

```bash
curl -X POST http://localhost:3000/api/tickets/TICKET_ID/prices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "dateFrom": "2024-06-01",
    "dateTo": "2024-12-31",
    "adultPrice": 3500,
    "availableSlots": 20
  }'
```

### 5. Настройте расписание

```bash
curl -X PUT http://localhost:3000/api/schedules/cards/CARD_ID/weekly \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "weeklySchedule": {
      "monday": { "active": true, "times": ["09:00", "14:00"] },
      "tuesday": { "active": true, "times": ["09:00", "14:00"] },
      "wednesday": { "active": true, "times": ["09:00", "14:00"] },
      "thursday": { "active": true, "times": ["09:00", "14:00"] },
      "friday": { "active": true, "times": ["09:00", "14:00"] },
      "saturday": { "active": true, "times": ["10:00"] },
      "sunday": { "active": false, "times": [] }
    }
  }'
```

### 6. Забронируйте тур (как пользователь)

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "cardId": "CARD_ID",
    "date": "2024-06-15",
    "time": "09:00",
    "tickets": [
      {
        "ticketId": "TICKET_ID",
        "quantity": 2
      }
    ],
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+7 999 123 45 67"
  }'
```

### 7. Оплатите заказ

```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "orderId": "ORDER_ID"
  }'
```

Вернется `confirmationToken` для YooKassa виджета.

## 🎯 Что дальше?

### Приоритеты:

1. **Frontend разработка**
   - API клиент с axios
   - Страницы каталога и деталей туров
   - Форма бронирования
   - Интеграция YooKassa виджета
   - Админка

2. **Модуль Files (MinIO)** - для загрузки реальных фотографий

3. **Модуль Notifications** - email уведомления

4. **Тестирование**
   - E2E тесты критичных сценариев
   - Unit тесты сервисов

## 📚 Полезные ссылки

- **Prisma Studio**: `npx prisma studio` - UI для просмотра БД
- **MinIO Console**: http://localhost:9001 (minio_admin / minio_secret)
- **Mailpit**: http://localhost:8025 - все email здесь
- **YooKassa Docs**: https://yookassa.ru/developers

## 🐛 Troubleshooting

**Проблема**: Prisma ошибки при миграции  
**Решение**: `npx prisma migrate reset` (удалит все данные!)

**Проблема**: YooKassa не работает  
**Решение**: Убедитесь, что `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY` в `.env` настроены

**Проблема**: Порт 3000 занят  
**Решение**: Измените `BACKEND_PORT` в `.env`

---

**Статус**: Backend 100% готов! 🚀  
**Дата**: 14 апреля 2026 г.
