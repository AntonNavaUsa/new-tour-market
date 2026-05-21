# Роадмап: Объекты размещения и Календари занятости

## Обзор

Реализация 4 фич:
1. **Объекты размещения** — самостоятельная сущность с фото, описанием, отзывами; мульти-выбор в форме карточки
2. **Календарь занятости гида** — блокировки дат + отображение дат с заказами
3. **Календарь занятости объекта размещения** — аналогично для объектов
4. **Согласование дат тура с календарями** — при выборе даты бронирования учитываются блокировки гидов и объектов

---

## Архитектурные решения

### Backend (NestJS + Prisma)

- `Accommodation` — новая сущность: id, name, description, address, type (enum), photos, reviews, blocks
- `CardAccommodation` — M2M между Card и Accommodation (заменяет поля accommodationDescription/accommodationReviews)
- `CardGuide` — M2M между Card и Guide (ранее Guide имел только `cardId`)
- `GuideBlock` — блокировки дат для гида (dateFrom, dateTo, reason)
- `AccommodationBlock` — блокировки дат для объекта размещения
- `Review` — добавлено поле `accommodationId` (nullable), позволяет отзывам относиться к объекту размещения

### Frontend (React + TanStack Query)

- `OccupancyCalendar` — переиспользуемый компонент для отображения и управления блокировками
- `AccommodationPicker` — мульти-выбор объектов размещения для формы карточки
- Три новые страницы: список объектов, форма объекта (с вкладками), календарь гида

---

## Backend

### Изменения в Prisma Schema

```
AccommodationType enum: HOTEL | HOSTEL | GUESTHOUSE | APARTMENT | CAMPING | OTHER

Accommodation {
  id, name, description?, address?, type
  photos: AccommodationPhoto[]
  reviews: Review[]
  cardAccommodations: CardAccommodation[]
  blocks: AccommodationBlock[]
}

CardAccommodation {
  @@id([cardId, accommodationId])
  cardId -> Card
  accommodationId -> Accommodation
}

AccommodationBlock {
  id, accommodationId, dateFrom, dateTo, reason?, createdAt
}

CardGuide {
  @@id([cardId, guideId])
  cardId -> Card
  guideId -> Guide
}

GuideBlock {
  id, guideId, dateFrom, dateTo, reason?, createdAt
}

AccommodationPhoto: изменено с cardId -> accommodationId
Card: удалены accommodationDescription, accommodationReviews; добавлены cardAccommodations, cardGuides
```

### Миграция

`backend/prisma/migrations/20260521000001_add_accommodations_guides_calendars/migration.sql`

Ручная миграция (Docker был недоступен). При запуске БД выполнить:
```sql
-- Применить файл migration.sql напрямую через psql или pgAdmin
```

### Новые модули и endpoints

**AccommodationsModule** (`/api/accommodations`)
- `GET /api/accommodations` — список с фильтрацией (search, type, skip, take)
- `GET /api/accommodations/:id` — детали объекта
- `POST /api/accommodations` — создать (ADMIN/PARTNER)
- `PATCH /api/accommodations/:id` — обновить
- `DELETE /api/accommodations/:id` — удалить
- `POST /api/accommodations/:id/photos` — загрузить фото
- `PATCH /api/accommodations/:id/photos/reorder` — сортировка
- `DELETE /api/accommodations/photos/:photoId` — удалить фото
- `PUT /api/accommodations/photos/:photoId` — заменить фото
- `GET /api/accommodations/:id/calendar?year=&month=` — занятость
- `POST /api/accommodations/:id/blocks` — добавить блокировку
- `DELETE /api/accommodations/:id/blocks/:blockId` — удалить блокировку

**GuidesModule — новые endpoints**
- `GET /api/guides/:id/calendar?year=&month=` — занятость гида
- `POST /api/guides/:id/blocks` — добавить блокировку
- `DELETE /api/guides/:id/blocks/:blockId` — удалить блокировку

**SchedulesModule — новый endpoint**
- `GET /api/schedules/cards/:cardId/available-dates/:year/:month` — доступные даты с учётом занятости гидов и объектов

**ReviewsModule — изменения**
- `GET /api/reviews/accommodation/:accommodationId` — отзывы для объекта
- `GET /api/reviews?accommodationId=` — фильтр по объекту
- `POST /api/reviews` — теперь принимает `accommodationId`

**CardsModule — изменения**
- `POST/PATCH /api/cards` — принимают `accommodationIds: string[]` и `guideIds: string[]`; синхронизируют M2M связи

---

## Frontend

### Новые файлы

| Файл | Описание |
|------|----------|
| `src/lib/api/accommodationsApi.ts` | API-клиент для объектов размещения и `schedulesApi.getAvailableDates` |
| `src/lib/api/guideCalendarApi.ts` | API-клиент для календаря гида |
| `src/components/OccupancyCalendar.tsx` | Компонент календаря с блокировками |
| `src/components/AccommodationPicker.tsx` | Мульти-выбор объектов размещения |
| `src/pages/AdminAccommodationsPage.tsx` | Список объектов размещения |
| `src/pages/AdminAccommodationFormPage.tsx` | Форма объекта (вкладки: Основное, Фото, Отзывы, Занятость) |
| `src/pages/AdminGuideCalendarPage.tsx` | Календарь занятости гида |

### Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `src/types/index.ts` | Новые типы: Accommodation, CardAccommodation, CardGuide, GuideBlock, AccommodationBlock, AvailableDateDay, AvailableDatesResponse |
| `src/pages/AdminCardFormPage.tsx` | Секция "Проживание" заменена на `AccommodationPicker` |
| `src/pages/TourDetailPage.tsx` | Загружает `getAvailableDates` из API, фильтрует заблокированные даты |
| `src/App.tsx` | Маршруты: `/admin/accommodations`, `/admin/accommodations/:id`, `/admin/guides/:id/calendar` |

### Новые маршруты

```
/admin/accommodations         — список объектов
/admin/accommodations/new     — создать объект
/admin/accommodations/:id     — редактировать объект (вкладки)
/admin/guides/:id/calendar    — календарь гида
```

---

## Логика проверки доступности дат

`SchedulesService.getAvailableDates(cardId, year, month)`:

1. Загружает карточку с `cardGuides` и `cardAccommodations`
2. Для каждого дня месяца:
   - Проверяет расписание (schedule) — есть ли активные слоты
   - Проверяет блокировки гидов (`GuideBlock`)
   - Проверяет блокировки объектов размещения (`AccommodationBlock`)
3. Возвращает `{year, month, days: [{date, available, times, reason?}]}`

На фронтенде в `TourDetailPage`:
- Загружается на текущий и следующий месяцы
- `availableDates = getAvailableDates(schedule).filter(d => !blockedDateSet.has(d))`

---

## Порядок применения изменений

1. Применить SQL-миграцию к БД
2. Перезапустить бэкенд (подхватит новые модули)
3. Создать бакет `accommodations` в MinIO (или будет создан автоматически при первой загрузке)
4. Перезапустить фронтенд

---

## TODO / Следующие шаги

- [x] Добавить карточку объекта размещения на публичную страницу тура (TourDetailPage) — тип, адрес, фото, отзывы
- [x] Уведомления при блокировке даты, затронувшей существующие заказы (email через NotificationsService)
- [x] Управление несколькими гидами в форме карточки (GuidePicker)
- [x] Публичная страница объекта размещения (`/accommodations/:id`)
- [ ] Экспорт занятости в iCal/Google Calendar
