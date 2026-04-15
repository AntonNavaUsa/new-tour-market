# План: Миграция маркетплейса туристических услуг на TypeScript-стек

Переписать Laravel-проект на современный TypeScript-стек с фокусом на:
- Каталог карточек туров с фильтрацией
- Бронирование и оплата через YooKassa
- Админка для управления карточками, ценами, расписанием

**Новый стек:**
- Backend: NestJS + Prisma + PostgreSQL
- Frontend: React + Vite + shadcn/ui + Tailwind CSS
- Infrastructure: Docker Compose (PostgreSQL, MinIO, SMTP mailserver)
- Платежи: YooKassa Node.js SDK
- Email: Nodemailer

---

## Фазы реализации

### **Фаза 1: Подготовка инфраструктуры и проектирование**

**1.1 Docker окружение**
- Создать `docker-compose.yml` с сервисами:
  - PostgreSQL 16
  - MinIO (S3-совместимое хранилище для изображений)
  - MailHog/Mailpit (SMTP для разработки)
  - Backend контейнер (NestJS)
  - Frontend контейнер (React + Vite + Nginx для production)
- Настроить volumes для персистентности данных
- Создать `.env.example` с переменными окружения

**1.2 Проектирование схемы БД**
- Спроектировать Prisma schema на основе Laravel миграций:
  - Users (id, name, email, phone, password_hash, role enum, partner_id, hotel_id)
  - Cards (id, user_id, location_id, cardtype_id, title, description, photos, pricing_config, schedule_config, status, position)
  - Locations (id, url_slug, country, region, city, language)
  - Orders (id, user_id, card_id, date, time, quantity, amount, status enum, expired, promocode_id)
  - Payments (id, user_id, order_id, amount, payment_id_external, status enum)
  - Tickets (id, card_id, title, is_main, position, type_config)
  - Prices (id, ticket_id, date_from, adult_price, child_price, available_slots)
  - OrderTickets (id, order_id, price_id, quantity, price_snapshot)
  - Partners (id, user_id, title, description, contacts, logo_url)
  - Schedules (id, card_id, weekly_schedule JSON, special_dates JSON)
  - SlideshowPhotos (id, card_id, url, sort_order)
  - Expressions (id, card_id, photo_url, sort_order)
- Определить индексы для часто используемых запросов (location_id, user_id, status)
- Настроить каскадные удаления и ограничения

**1.3 Инициализация проектов**
- Backend: `nest new travelio-backend` с настройкой:
  - Swagger для API документации
  - Class-validator + class-transformer
  - Passport JWT стратегия
  - Helmet, CORS, rate-limiting
- Frontend: `npm create vite@latest travelio-frontend -- --template react-ts`
  - React Router v6
  - TanStack Query (React Query) для data fetching
  - Zustand для state management
  - Shadcn/ui + Tailwind CSS
  - React Hook Form + Zod валидация

---

### **Фаза 2: Backend разработка (Core API)**

**2.1 Аутентификация и авторизация** (*основа для всех модулей*)
- AuthModule с JWT tokens (access + refresh)
- Guard'ы для ролей: `@Roles('admin', 'partner', 'hotel_owner', 'user')`
- Endpoints:
  - POST `/auth/register` (user registration)
  - POST `/auth/login` (email + password)
  - POST `/auth/refresh` (refresh tokens)
  - GET `/auth/profile` (текущий пользователь)
  - POST `/auth/verify-email` (подтверждение email)
- Bcrypt для хеширования паролей
- Политики доступа через CASL или встроенные Guards

**2.2 Модуль Cards (Карточки туров)** (*зависит от 2.1*)
- Сервисы:
  - `CardsService.create()` - создание карточки (только admin/partner)
  - `CardsService.findAll()` - список с фильтрацией (location, tags, price range)
  - `CardsService.findOne()` - детали карточки с relations
  - `CardsService.update()` - обновление (проверка ownership через policy)
  - `CardsService.delete()` - удаление с каскадом
  - `CardsService.uploadHeadPhoto()` - загрузка главного фото в MinIO
  - `CardsService.uploadSlideshow()` - множественная загрузка в фотоальбом
  - `CardsService.reorderSlideshow()` - изменение порядка фото
- Endpoints:
  - GET `/cards?location=:id&tags=:tags&price_from=:min` (публичный)
  - GET `/cards/:id` (публичный)
  - POST `/cards` (@Roles admin/partner)
  - PATCH `/cards/:id` (@Roles admin/partner + ownership check)
  - DELETE `/cards/:id`
  - POST `/cards/:id/photos/head` (multipart)
  - POST `/cards/:id/photos/slideshow` (multipart array)
  - PATCH `/cards/:id/photos/slideshow/order` (body: {photos: [{id, order}]})
- DTO валидация для всех операций

**2.3 Модуль Tickets & Prices** (*зависит от 2.2*)
- Сервисы:
  - `TicketsService.createForCard()` - создание типа билета
  - `TicketsService.updatePrices()` - управление прайс-листом
  - `PricesService.getAvailability()` - проверка доступности на дату
- Endpoints:
  - POST `/cards/:cardId/tickets` (создание билета)
  - PATCH `/tickets/:id` (обновление)
  - DELETE `/tickets/:id`
  - GET `/tickets/:id/prices` (история цен)
  - POST `/tickets/:id/prices` (добавить цену на период)

**2.4 Модуль Schedules (Расписание)** (*зависит от 2.2*)
- Сервисы:
  - `SchedulesService.updateWeekly()` - недельное расписание
  - `SchedulesService.addSpecialDate()` - добавить исключение (закрытие/спец. время)
  - `SchedulesService.getAvailableTimes()` - получить доступные времена на дату
- Endpoints:
  - PUT `/cards/:cardId/schedule/weekly` (body: {monday: {active, times: []}, ...})
  - POST `/cards/:cardId/schedule/special-dates` (body: {date_from, date_to, times, is_closed})
  - GET `/cards/:cardId/schedule/available?date=:date` (публичный)

**2.5 Модуль Orders & Booking** (*зависит от 2.2, 2.3, 2.4*)
- Сервисы:
  - `OrdersService.createPreOrder()` - создать предзаказ (status=0)
  - `OrdersService.confirmBooking()` - подтвердить бронь без оплаты (status=1)
  - `OrdersService.checkExpiration()` - проверка истечения (>20 мин, status=0)
  - `OrdersService.getUserOrders()` - список заказов пользователя
- Endpoints:
  - POST `/orders` (body: {card_id, date, time, quantity, tickets: [{ticket_id, price_id, qty}]})
  - GET `/orders` (текущего пользователя)
  - GET `/orders/:id`
  - POST `/orders/:id/confirm` (для бесплатных бронирований)
- Scheduled task для автоматической отметки expired orders

**2.6 Модуль Payments (Платежи)** (*зависит от 2.5*)
- Интеграция YooKassa SDK:
  - Credentials из env (shop_id, secret_key для test/prod)
  - Embedded widget flow
- Сервисы:
  - `PaymentsService.initiate()` - создать платеж в YooKassa + запись в БД
  - `PaymentsService.handleSuccess()` - проверка статуса, обновление Order/Payment
  - `PaymentsService.getPaymentStatus()` - проверка статуса в YooKassa
- Endpoints:
  - POST `/payments/create` (body: {order_id, amount}) → return {confirmation_token, payment_id}
  - GET `/payments/:id/status` (проверка статуса)
  - GET `/payments/callback` (return_url после оплаты)
- События:
  - `OrderPaidEvent` → триггерит email уведомления

**2.7 Модуль Notifications (Email уведомления)** (*зависит от 2.6*)
- Настройка Nodemailer с SMTP credentials
- Email templates (Handlebars или React-email):
  - `admin-order-paid.hbs` - уведомление админу
  - `user-order-paid.hbs` - уведомление пользователю
  - `booking-confirmed.hbs` - подтверждение брони
- Сервисы:
  - `NotificationsService.sendOrderPaidAdmin()`
  - `NotificationsService.sendOrderPaidUser()`
- Listener для `OrderPaidEvent`

**2.8 Модуль Calendar (Календарь занятости)** (*зависит от 2.5*)
- Сервисы:
  - `CalendarService.getMonthBusySlots()` - занятость по дням месяца
  - `CalendarService.getDayTimeline()` - детализация по 30-мин слотам
  - `CalendarService.blockSlot()` - забронировать время (при создании Order)
  - `CalendarService.calculateBusyPercent()` - % занятости дня
- Endpoints:
  - GET `/calendar/:cardId/:year/:month` (возврат busy meta)
  - GET `/calendar/:cardId/:date/timeline` (временная шкала дня)
  - POST `/calendar/block` (ручная блокировка админом)

**2.9 Модуль Files (Файловое хранилище)** (*параллельно с 2.2*)
- Интеграция MinIO SDK:
  - Bucket для каждого типа: `cards-headers`, `cards-slideshow`, `cards-expressions`
  - Генерация pre-signed URLs для безопасного доступа
- Сервисы:
  - `FilesService.upload()` - загрузка с оптимизацией (Sharp для resize + WebP conversion)
  - `FilesService.delete()` - удаление файла
  - `FilesService.getUrl()` - получить публичный URL
- Middleware для мультипарт загрузок

**2.10 Модуль Partners** (*зависит от 2.1*)
- Сервисы:
  - `PartnersService.create()` - создание партнера
  - `PartnersService.linkCardToPartner()` - привязать карточку
  - `PartnersService.getPartnerCards()` - карточки партнера
- Endpoints:
  - POST `/partners`
  - GET `/partners/:id/cards`
  - POST `/partners/:id/cards/:cardId` (link)

---

### **Фаза 3: Frontend разработка (Публичная часть)** (*параллельно с Фазой 2*)

**3.1 Routing и Layout**
- React Router настройка:
  - `/` - главная
  - `/:location` - каталог карточек локации
  - `/cards/:id` - детали карточки
  - `/orders/create` - форма бронирования
  - `/orders/:id` - детали заказа
  - `/payment/:id` - страница оплаты
  - `/admin/*` - админка (protected route)
- Layout компоненты:
  - Header (навигация, поиск, user menu)
  - Footer
  - ProtectedRoute wrapper

**3.2 Каталог карточек** (*зависит от backend 2.2*)
- Компоненты:
  - `CardsList` - грид карточек с бесконечной прокруткой
  - `CardItem` - превью карточки (фото, название, цена)
  - `FiltersPanel` - фильтры (теги, цена, длительность)
  - `SearchBar` - поиск по названию
- TanStack Query hooks:
  - `useCards(filters)` - fetch с кешированием
  - `useLocations()` - список локаций
- State: фильтры через URL search params

**3.3 Детали карточки** (*зависит от backend 2.2, 2.3, 2.4*)
- Компоненты:
  - `CardDetails` - основная информация
  - `PhotoGallery` - слайдшоу с превью (react-image-gallery)
  - `PricingTable` - типы билетов и цены
  - `CalendarPicker` - выбор даты (react-day-picker + подсветка доступности)
  - `TimeSlotPicker` - выбор времени (на основе schedule)
  - `BookNowButton` - кнопка бронирования
- TanStack Query:
  - `useCard(id)` - детали карточки
  - `useCardSchedule(id, date)` - расписание на дату

**3.4 Процесс бронирования** (*зависит от backend 2.5*)
- Компоненты:
  - `BookingForm` - форма с React Hook Form + Zod:
    - Дата, время, количество человек
    - Выбор типов билетов
    - Контакты (если не авторизован - регистрация inline)
  - `BookingSummary` - итоговая сумма, детали
  - `BookingConfirmation` - страница подтверждения
- Mutations:
  - `useCreateOrder()` - создать предзаказ
  - `useConfirmBooking()` - подтвердить без оплаты

**3.5 Оплата** (*зависит от backend 2.6*)
- Компоненты:
  - `PaymentPage` - встраивание YooKassa Widget:
    ```tsx
    const widget = new window.YooMoneyCheckoutWidget({
      confirmation_token: confirmationToken,
      return_url: `/orders/${orderId}`,
      error_callback: (error) => {...}
    });
    widget.render('payment-form');
    ```
  - `PaymentSuccess` - страница успешной оплаты
  - `PaymentError` - обработка ошибок
- Mutations:
  - `useInitiatePayment(orderId)` - получить confirmation_token

**3.6 Личный кабинет пользователя** (*зависит от backend 2.1, 2.5*)
- Компоненты:
  - `ProfilePage` - редактирование профиля
  - `OrdersList` - история заказов с фильтрацией (expired, confirmed, paid)
  - `OrderDetails` - детали заказа, кнопка оплаты для pending
- Queries:
  - `useUserOrders()` - список заказов
  - `useProfile()` - данные пользователя

---

### **Фаза 4: Frontend разработка (Админка)** (*зависит от Фазы 3*)

**4.1 Admin Layout и навигация**
- Sidebar навигация:
  - Карточки (список, создать)
  - Заказы (все заказы)
  - Партнеры (для admin)
  - Календарь
  - Настройки
- Breadcrumbs
- Role-based рендеринг (admin видит всё, partner - только свои карточки)

**4.2 Управление карточками**
- Компоненты:
  - `CardsTable` - таблица с сортировкой, поиском (TanStack Table)
  - `CardEditForm` - форма редактирования с табами:
    - **Основное:** название, описание, локация, статус, позиция
    - **Медиа:** загрузка главного фото, фотоальбом (drag-n-drop reorder), впечатления
    - **Цены:** управление типами билетов + прайс-листом (CRUD таблица)
    - **Расписание:** недельное расписание + исключения (календарь с multiselect)
  - `PhotoUploader` - drag-n-drop загрузка с превью
  - `TicketsEditor` - CRUD для билетов
  - `ScheduleEditor` - UI для недельного расписания + спец. даты
- Mutations:
  - `useCreateCard()`, `useUpdateCard()`, `useDeleteCard()`
  - `useUploadPhoto()`, `useReorderPhotos()`
  - `useUpdateSchedule()`

**4.3 Управление заказами**
- Компоненты:
  - `OrdersTable` - все заказы с фильтрами (статус, дата, карточка)
  - `OrderAdminDetails` - детали с кнопкой отмены
- Queries:
  - `useAllOrders(filters)` - для админа/партнера

**4.4 Календарь занятости**
- Компоненты:
  - `AdminCalendar` - месячный вид с % занятости (на основе backend 2.8)
  - `DayTimeline` - временная шкала дня при клике
  - `BlockTimeModal` - ручная блокировка слота
- Queries:
  - `useCalendarMonth(cardId, year, month)`
  - `useDayTimeline(cardId, date)`

**4.5 Управление партнерами** (*только для admin*)
- Компоненты:
  - `PartnersTable` - список партнеров
  - `PartnerForm` - создание/редактирование
  - `LinkCardsModal` - привязка карточек к партнеру

---

### **Фаза 5: Интеграции и оптимизация**

**5.1 Тестирование**
- Backend:
  - Unit тесты для сервисов (Jest)
  - E2E тесты критичных flow (Supertest):
    - Регистрация → бронирование → оплата
    - Создание карточки партнером
- Frontend:
  - Component тесты (Vitest + Testing Library)
  - E2E тесты (Playwright):
    - Просмотр каталога → бронирование
    - Админка: создание карточки

**5.2 Миграция данных** (*опционально, если нужны тестовые данные*)
- Скрипт для экспорта из Laravel БД (только структура для референса)
- Создание seed файлов Prisma:
  - Несколько локаций
  - 10-15 карточек с реалистичными данными
  - Тестовые пользователи (admin, partner, user)

**5.3 Оптимизация**
- Backend:
  - Настройка индексов БД (EXPLAIN ANALYZE запросов)
  - Кеширование часто используемых запросов (Redis - опционально)
  - Rate limiting для API
- Frontend:
  - Lazy loading роутов
  - Image optimization (WebP, lazy loading)
  - Bundle size анализ (rollup-plugin-visualizer)

**5.4 Документация**
- README с инструкциями запуска
- Swagger документация API (auto-generated в NestJS)
- Архитектурная диаграмма (С4 model)
- Postman коллекция для тестирования API

---

### **Фаза 6: Деплой и CI/CD**

**6.1 Production Docker setup**
- Мультистейдж Dockerfile для backend (build + production image)
- Мультистейдж Dockerfile для frontend (build + nginx)
- Production `docker-compose.yml` с:
  - Настройкой secrets (не в .env файлах)
  - Health checks для всех сервисов
  - Restart policies
  - Logging drivers

**6.2 CI/CD pipeline**
- GitHub Actions / GitLab CI:
  - Lint + тесты на каждый PR
  - Build Docker images
  - Push в registry
  - Deploy на staging/production

**6.3 Monitoring и логирование**
- Backend:
  - Winston logger с уровнями (error, warn, info)
  - Sentry для error tracking (опционально)
- PostgreSQL backup стратегия
- MinIO backup

---

## Критические файлы для изучения

**Backend модели (референс для Prisma schema):**
- `app/Models/User.php` - роли, партнеры
- `app/Models/Card.php` - основная модель карточки + relations
- `app/Models/Order.php` - статусы заказов
- `app/Models/Payment.php` - интеграция платежей
- `app/Models/Ticket.php` + `Price.php` - pricing система
- `app/Models/Shedule.php` - расписание

**Backend контроллеры (логика для NestJS endpoints):**
- `app/Http/Controllers/CardController.php` - CRUD карточек
- `app/Http/Controllers/OrderController.php` - процесс бронирования
- `app/Http/Controllers/PaymentController.php` - YooKassa flow

**Frontend (примеры UI для React компонентов):**
- `resources/views/Orders/preorder.blade.php` - форма бронирования
- `resources/views/payments/payform.blade.php` - YooKassa Widget
- `resources/views/cards/edit.blade.php` - форма редактирования админки

**Livewire (функционал для админки):**
- `app/Livewire/TicketForm.php` - управление билетами
- `app/Livewire/SheduleForm.php` - редактор расписания
- `app/Livewire/CalendarController.php` + `CalendarTimeline.php` - календарь

---

## Верификация

**Автоматизированные тесты:**
1. Backend unit тесты для сервисов (coverage >70%)
2. E2E тесты критичных потоков (регистрация, бронирование, оплата)
3. Frontend component тесты (формы, таблицы)

**Ручная верификация:**
1. Публичная часть:
   - Просмотр каталога с фильтрацией
   - Просмотр детали карточки с фотогалереей
   - Бронирование бесплатного тура (без оплаты)
   - Бронирование с оплатой через YooKassa test card
   - Получение email уведомлений
2. Админка:
   - Создание карточки партнером
   - Загрузка фото, изменение порядка
   - Управление билетами и ценами
   - Настройка недельного расписания + исключения
   - Просмотр календаря занятости
   - Просмотр списка заказов
3. Роли и права:
   - Admin видит все карточки
   - Partner видит только свои
   - Попытка партнера отредактировать чужую карточку → 403
4. Деплой:
   - Запуск через `docker-compose up` на чистой системе
   - Применение миграций Prisma
   - Проверка MinIO storage (загрузка/получение файлов)
   - Проверка SMTP (отправка тестового email)

---

## Решения и предположения

**Архитектурные:**
- Монолитный backend (NestJS) с модульной архитектурой, не микросервисы - проще для развертывания
- SPA фронтенд (React + Vite), не SSR - т.к. нет SEO требований для админки, публичная часть может рендериться на клиенте
- MinIO вместо облачного S3 - независимость от провайдера, локальный деплой

**Бизнес-логика:**
- Pre-order expires через 20 минут - сохранить из Laravel
- Партнеры могут создавать карточки, admin может всё - многоуровневый доступ
- YooKassa остается платежной системой - минимум изменений в integration flow

**Технические:**
- JWT токены вместо Laravel session - stateless API
- Prisma вместо Eloquent - type-safety, лучшие миграции для PostgreSQL
- TanStack Query вместо Redux - проще для data fetching, меньше boilerplate

**Исключено из скоупа:**
- Миграция контента (данные не переносим)
- Hotels management - упоминается в ролях, но не реализовано в текущем проекте
- Промокоды - есть поле в Order, но логика не обнаружена
- Уведомления в браузере (Push Notifications)
- Мобильное приложение

---

## Дальнейшие соображения

1. **Кеширование:** Рассмотреть Redis для кеширования списка карточек и расписания - может значительно снизить нагрузку на БД при росте трафика
2. **CDN для изображений:** Если проект масштабируется, MinIO можно синхронизировать с CDN (CloudFlare, Fastly) для быстрой доставки контента
3. **Internationalization:** Текущая версия имеет поле `location.language`, возможно планировалась мультиязычность - учесть i18n с react-i18next
