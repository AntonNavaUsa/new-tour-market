# Travelio - Маркетплейс туристических услуг

Полнофункциональное веб-приложение для бронирования туров и экскурсий с системой партнёрских кабинетов и админ-панелью.

## 🚀 Технологический стек

### Backend
- **NestJS 10** - Progressive Node.js framework
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **Swagger** - API documentation
- **Bcrypt** - Password hashing
- **Multer** - File uploads

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router v6** - Routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form validation
- **Lucide React** - Icons

## 📋 Возможности

### Для пользователей
- ✅ Регистрация и аутентификация
- ✅ Каталог туров с поиском
- ✅ Детальная страница тура с фотогалереей
- ✅ Бронирование туров с выбором даты и времени
- ✅ Выбор типов билетов (взрослый, детский)
- ✅ Личный кабинет
- ✅ История заказов
- ✅ Интеграция с платёжной системой

### Для партнёров
- ✅ Создание и управление турами
- ✅ Управление расписанием и билетами
- ✅ Загрузка фотографий
- ✅ Управление заказами
- ✅ Статистика продаж

### Для администраторов
- ✅ Полный доступ к системе
- ✅ Управление пользователями
- ✅ Модерация туров
- ✅ Управление локациями и типами туров
- ✅ Просмотр всех заказов и платежей

## 🛠️ Установка и запуск

### Предварительные требования
- Node.js 18+
- PostgreSQL 14+
- npm или yarn

### 1. Клонирование репозитория
```powershell
git clone <repository-url>
cd new-tour-market
```

### 2. Настройка Backend

```powershell
cd backend

# Установка зависимостей
npm install

# Создание .env файла
Copy-Item .env.example .env

# Отредактируйте .env и укажите параметры подключения к PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/travelio"
# JWT_SECRET="your-secret-key"
# JWT_REFRESH_SECRET="your-refresh-secret-key"

# Применение миграций базы данных
npx prisma migrate dev

# (Опционально) Заполнение БД тестовыми данными
npx prisma db seed

# Запуск в режиме разработки
npm run start:dev
```

Backend будет доступен на `http://localhost:3000`  
API документация (Swagger): `http://localhost:3000/api/docs`

### 3. Настройка Frontend

```powershell
cd ../frontend

# Установка зависимостей
npm install

# Создание .env файла (если нужно изменить URL API)
# VITE_API_URL=http://localhost:3000

# Запуск в режиме разработки
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

### 4. Быстрый запуск (PowerShell)

В корне проекта создан скрипт для автоматического запуска обоих серверов:

```powershell
.\startup.ps1
```

Этот скрипт запустит одновременно:
- Backend на порту 3000
- Frontend на порту 5173

## 📁 Структура проекта

```
new-tour-market/
├── backend/                # NestJS backend
│   ├── prisma/            # Prisma schema and migrations
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed data
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── cards/         # Tours/Cards module
│   │   ├── tickets/       # Tickets module
│   │   ├── schedules/     # Schedules module
│   │   ├── orders/        # Orders module
│   │   ├── payments/      # Payments module
│   │   ├── files/         # File uploads module
│   │   └── notifications/ # Notifications module
│   └── uploads/           # Uploaded files storage
├── frontend/              # React frontend
│   ├── public/           
│   └── src/
│       ├── components/    # React components
│       │   ├── ui/        # UI components (Button, Card, Input, etc.)
│       │   └── layout/    # Layout components (Header, Footer)
│       ├── lib/          
│       │   ├── api/       # API client methods
│       │   ├── axios.ts   # Axios config with interceptors
│       │   └── utils.ts   # Utility functions
│       ├── pages/         # Page components
│       ├── store/         # Zustand stores
│       ├── types/         # TypeScript type definitions
│       └── App.tsx        # Main app component
└── startup.ps1           # Startup script
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/refresh` - Обновление токенов
- `GET /api/auth/profile` - Получение профиля
- `POST /api/auth/logout` - Выход

### Cards (Туры)
- `GET /api/cards` - Список туров (с фильтрацией и поиском)
- `GET /api/cards/:id` - Детали тура
- `POST /api/cards` - Создание тура (PARTNER/ADMIN)
- `PATCH /api/cards/:id` - Обновление тура
- `DELETE /api/cards/:id` - Удаление тура
- `POST /api/cards/:id/photos/main` - Загрузка главного фото
- `POST /api/cards/:id/photos/slideshow` - Загрузка фото для слайдшоу

### Orders
- `POST /api/orders` - Создание заказа
- `GET /api/orders/my` - Мои заказы
- `GET /api/orders/:id` - Детали заказа
- `PATCH /api/orders/:id/confirm` - Подтверждение заказа
- `PATCH /api/orders/:id/cancel` - Отмена заказа

### Payments
- `POST /api/payments` - Создание платежа
- `GET /api/payments/:id` - Статус платежа
- `POST /api/payments/callback` - Webhook от платёжной системы

...и другие эндпоинты в Swagger документации

## 🎨 Дизайн и UI

Приложение использует современный дизайн с:
- Адаптивной вёрсткой (mobile-first)
- Тёмной/светлой темой (настраивается через Tailwind)
- Анимациями и переходами
- Скелетонами загрузки
- Модальными окнами и toast-уведомлениями

### Основные страницы

1. **Главная** (`/`) - Hero секция, особенности платформы
2. **Каталог туров** (`/tours`) - Поиск, фильтрация, список туров
3. **Детали тура** (`/tours/:id`) - Фотогалерея, описание, расписание
4. **Бронирование** (`/booking/:id`) - Выбор билетов, форма заказа
5. **Профиль** (`/profile`) - Личная информация (защищённая)
6. **Заказы** (`/orders`) - История заказов (защищённая)
7. **Вход/Регистрация** (`/login`, `/register`)

## 🔐 Безопасность

- JWT-based аутентификация с refresh tokens
- Bcrypt хеширование паролей
- Protected routes на фронтенде
- RBAC (Role-Based Access Control) на бэкенде
- Валидация данных через DTO и Zod схемы
- CORS настроен для production

## 📦 Сборка для production

### Backend
```powershell
cd backend
npm run build
npm run start:prod
```

### Frontend
```powershell
cd frontend
npm run build
# Результат в папке dist/
```

## 🐛 Отладка

### Backend
- Логи доступны в консоли при запуске `npm run start:dev`
- Используйте Swagger UI для тестирования API
- Prisma Studio для просмотра БД: `npx prisma studio`

### Frontend
- React Developer Tools для отладки компонентов
- TanStack Query DevTools (автоматически включены в dev режиме)
- Network tab в браузере для проверки API вызовов

## 📝 Todo (Будущие улучшения)

- [ ] Админ-панель с таблицами и статистикой
- [ ] Личный кабинет партнёра для управления турами
- [ ] Email уведомления
- [ ] Push уведомления
- [ ] Отзывы и рейтинги туров
- [ ] Интеграция с календарём Google/Apple
- [ ] Карта с локациями туров
- [ ] Мультиязычность (i18n)
- [ ] PWA поддержка
- [ ] CI/CD pipeline

## 👥 Роли пользователей

1. **USER** - Обычный пользователь (бронирование туров)
2. **PARTNER** - Партнёр (создание и управление турами)
3. **ADMIN** - Администратор (полный доступ)
4. **HOTEL_OWNER** - Владелец отеля (будущая роль)

## 📄 Лицензия

MIT

## 🤝 Поддержка

При возникновении проблем создайте issue в репозитории.

---

**Сделано с ❤️ для туристической индустрии**
