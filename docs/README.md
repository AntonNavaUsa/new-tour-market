# Travelio - Marketplace for Tourist Services

Современный маркетплейс туристических услуг на TypeScript стеке.

## Стек технологий

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **PostgreSQL 16** - Relational database
- **Passport JWT** - Authentication
- **YooKassa SDK** - Payment processing
- **MinIO** - S3-compatible object storage
- **Nodemailer** - Email notifications

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **TanStack Query** - Data fetching
- **React Router v6** - Routing
- **Shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **Zustand** - State management

### Infrastructure
- **Docker Compose** - Containerization
- **Mailpit** - SMTP server for development

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ и npm
- Docker и Docker Compose
- Git Bash (для Windows) или любой bash-терминал

### ⚡ Запуск одной командой

**В Git Bash:**
```bash
bash startup.sh
```

Скрипт автоматически:
- ✅ Создаст .env файл из .env.example (если нужно)
- ✅ Запустит Docker контейнеры (PostgreSQL, MinIO, Mailpit)
- ✅ Дождется готовности базы данных
- ✅ Установит зависимости Backend
- ✅ Применит миграции Prisma
- ✅ Заполнит БД тестовыми данными (если пустая)
- ✅ Запустит Backend в dev режиме

**Остановка проекта:**
```bash
bash stop.sh
```

---

### Ручная установка (при необходимости)

1. **Клонируйте репозиторий и установите переменные окружения**

```bash
cp .env.example .env
# Отредактируйте .env файл при необходимости
```

2. **Запустите инфраструктуру (PostgreSQL, MinIO, Mailpit)**

```bash
docker-compose up -d postgres minio mailpit
```

3. **Инициализация Backend**

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed  # Опционально: заполнить тестовыми данными
npm run start:dev
```

Backend будет доступен на `http://localhost:3000`
Swagger документация: `http://localhost:3000/api/docs`

4. **Инициализация Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:5173`

### Доступ к сервисам

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **PostgreSQL**: localhost:5432
- **MinIO Console**: http://localhost:9001
- **Mailpit UI**: http://localhost:8025

### Тестовые пользователи (после seed)

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

## Структура проекта

```
travelio/
├── backend/              # NestJS приложение
│   ├── src/
│   │   ├── auth/        # Аутентификация
│   │   ├── cards/       # Карточки туров
│   │   ├── orders/      # Заказы и бронирование
│   │   ├── payments/    # Платежи через YooKassa
│   │   ├── files/       # Работа с файлами (MinIO)
│   │   ├── schedules/   # Расписание
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── frontend/             # React приложение
│   ├── src/
│   │   ├── components/  # UI компоненты
│   │   ├── pages/       # Страницы
│   │   ├── hooks/       # Custom hooks
│   │   ├── api/         # API клиент
│   │   └── ...
│   └── package.json
│
├── docker-compose.yml    # Оркестрация контейнеров
├── .env.example          # Пример переменных окружения
└── README.md
```

## Разработка

### Backend разработка

```bash
cd backend
npm run start:dev        # Development с hot reload
npm run test             # Unit тесты
npm run test:e2e         # E2E тесты
npm run lint             # ESLint проверка
npm run format           # Prettier форматирование
```

### Frontend разработка

```bash
cd frontend
npm run dev              # Development сервер
npm run build            # Production build
npm run preview          # Preview production build
npm run test             # Vitest тесты
npm run lint             # ESLint проверка
```

### Работа с базой данных

```bash
cd backend
npx prisma studio        # Открыть Prisma Studio
npx prisma migrate dev   # Создать и применить миграцию
npx prisma generate      # Сгенерировать Prisma Client
npx prisma db seed       # Заполнить тестовыми данными
```

## Основные функции

### Публичная часть
- ✅ Каталог туров с фильтрацией по локации, ценам, тегам
- ✅ Детальная страница тура с фотогалереей
- ✅ Календарь доступности и выбор времени
- ✅ Форма бронирования с выбором типов билетов
- ✅ Оплата через YooKassa Widget
- ✅ Личный кабинет с историей заказов

### Админка
- ✅ CRUD карточек туров
- ✅ Загрузка и управление фотографиями
- ✅ Управление типами билетов и ценами
- ✅ Настройка расписания (недельное + исключения)
- ✅ Календарь занятости
- ✅ Просмотр и управление заказами
- ✅ Управление партнерами (для админа)

### Роли и права
- **Admin**: полный доступ ко всем функциям
- **Partner**: создание и управление своими карточками
- **Hotel Owner**: (зарезервировано для будущего функционала)
- **User**: просмотр каталога, бронирование, личный кабинет

## Интеграции

### YooKassa
Для тестирования платежей используйте тестовые карты YooKassa:
- Успешная оплата: `5555 5555 5555 4444`
- Отклоненная: `5555 5555 5555 5599`

### Email уведомления
В режиме разработки все письма отправляются в Mailpit: http://localhost:8025

## Production деплой

```bash
docker-compose -f docker-compose.prod.yml up -d
```

См. детали в документации по деплою.

## Лицензия

Proprietary - All rights reserved

## Контакты

- Email: support@travelio.local
- GitHub: [repository-url]
