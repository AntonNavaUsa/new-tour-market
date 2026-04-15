# Примеры использования Files API

## Обзор

Модуль Files предоставляет endpoints для загрузки изображений в MinIO с автоматической оптимизацией.

**Возможности:**
- Автоматическое изменение размера (max 1920x1080)
- Конвертация в WebP для уменьшения размера
- Настраиваемое качество (по умолчанию 85%)
- Три отдельных bucket'а для разных типов изображений

## Buckets в MinIO

После запуска backend автоматически создаются:
- `cards` - главные фотографии карточек
- `photos` - фотогалереи (slideshow)
- `expressions` - фотографии впечатлений

Все buckets имеют публичную политику чтения.

## Endpoints

### 1. Загрузка главного фото карточки

**Endpoint:** `POST /api/cards/:id/photos/main`  
**Auth:** Required (Bearer token)  
**Roles:** ADMIN, PARTNER  
**Content-Type:** `multipart/form-data`

**Параметры:**
- `:id` - ID карточки
- `file` - файл изображения (form-data)

**Пример curl:**
```bash
curl -X POST http://localhost:3000/api/cards/YOUR_CARD_ID/photos/main \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Swagger:** Используйте кнопку "Try it out", выберите файл и нажмите "Execute"

**Ответ:**
```json
{
  "message": "Main photo uploaded successfully",
  "card": {
    "id": "card-uuid",
    "title": "Tour Name",
    "headPhotoUrl": "http://localhost:9000/cards/uuid.webp",
    ...
  }
}
```

### 2. Загрузка фотографий в галерею

**Endpoint:** `POST /api/cards/:id/photos/slideshow`  
**Auth:** Required (Bearer token)  
**Roles:** ADMIN, PARTNER  
**Content-Type:** `multipart/form-data`  
**Max files:** 10

**Параметры:**
- `:id` - ID карточки
- `files` - массив файлов изображений (form-data)

**Пример curl (множественная загрузка):**
```bash
curl -X POST http://localhost:3000/api/cards/YOUR_CARD_ID/photos/slideshow \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg" \
  -F "files=@/path/to/image3.jpg"
```

**Swagger:** 
1. Нажмите "Try it out"
2. Нажмите "Choose Files" и выберите несколько изображений
3. Нажмите "Execute"

**Ответ:**
```json
{
  "message": "3 photos uploaded successfully",
  "photos": [
    {
      "id": "photo-uuid-1",
      "cardId": "card-uuid",
      "url": "http://localhost:9000/photos/uuid1.webp",
      "sortOrder": 1,
      "createdAt": "2026-04-14T10:00:00Z"
    },
    {
      "id": "photo-uuid-2",
      "cardId": "card-uuid",
      "url": "http://localhost:9000/photos/uuid2.webp",
      "sortOrder": 2,
      "createdAt": "2026-04-14T10:00:01Z"
    },
    {
      "id": "photo-uuid-3",
      "cardId": "card-uuid",
      "url": "http://localhost:9000/photos/uuid3.webp",
      "sortOrder": 3,
      "createdAt": "2026-04-14T10:00:02Z"
    }
  ]
}
```

### 3. Загрузка фотографий впечатлений

**Endpoint:** `POST /api/cards/:id/photos/expressions`  
**Auth:** Required (Bearer token)  
**Roles:** ADMIN, PARTNER  
**Content-Type:** `multipart/form-data`  
**Max files:** 10

**Параметры:**
- `:id` - ID карточки
- `files` - массив файлов изображений (form-data)

**Пример curl:**
```bash
curl -X POST http://localhost:3000/api/cards/YOUR_CARD_ID/photos/expressions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/expression1.jpg" \
  -F "files=@/path/to/expression2.jpg"
```

**Ответ:**
```json
{
  "message": "2 expression photos uploaded successfully",
  "expressions": [
    {
      "id": "expression-uuid-1",
      "cardId": "card-uuid",
      "photoUrl": "http://localhost:9000/expressions/uuid1.webp",
      "sortOrder": 1,
      "createdAt": "2026-04-14T10:00:00Z"
    },
    {
      "id": "expression-uuid-2",
      "cardId": "card-uuid",
      "photoUrl": "http://localhost:9000/expressions/uuid2.webp",
      "sortOrder": 2,
      "createdAt": "2026-04-14T10:00:01Z"
    }
  ]
}
```

## Настройки оптимизации

По умолчанию все изображения обрабатываются с параметрами:
- **maxWidth:** 1920px
- **maxHeight:** 1080px
- **quality:** 85%
- **format:** webp

Изображение автоматически масштабируется с сохранением пропорций, но не увеличивается.

## Поддерживаемые форматы

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif) - первый кадр при конвертации в WebP
- WebP (.webp)
- AVIF (.avif)

## Проверка загруженных изображений

После загрузки изображения доступны по публичным URL:
```
http://localhost:9000/cards/uuid.webp
http://localhost:9000/photos/uuid.webp
http://localhost:9000/expressions/uuid.webp
```

Откройте URL в браузере для просмотра изображения.

## MinIO Console

Для просмотра всех загруженных файлов:
1. Откройте http://localhost:9001
2. Логин: `minio_admin`
3. Пароль: `minio_secret_password`
4. Перейдите в раздел "Buckets"

## Работа с ошибками

### Ошибка: "File must be an image"
Убедитесь, что загружаемый файл имеет MIME-type начинающийся с `image/`

### Ошибка: "At least one file is required"
Вы не прикрепили файл к запросу. Проверьте form-data поле.

### Ошибка: 403 Forbidden
Вы не имеете прав на обновление этой карточки. Только владелец или админ может загружать фото.

### Ошибка: 404 Card not found
Проверьте правильность ID карточки в URL.

## Пример полного workflow

### 1. Авторизуйтесь
```bash
# Логин от admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@travelio.local","password":"admin123"}'

# Сохраните access_token из ответа
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. Создайте карточку
```bash
curl -X POST http://localhost:3000/api/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Экскурсия по городу",
    "description": "Познавательная экскурсия",
    "shortDescription": "2 часа прогулки",
    "locationId": "location-uuid",
    "cardTypeId": "cardtype-uuid",
    "duration": 120,
    "minParticipants": 1,
    "maxParticipants": 20
  }'

# Сохраните id карточки из ответа
CARD_ID="card-uuid-here"
```

### 3. Загрузите главное фото
```bash
curl -X POST http://localhost:3000/api/cards/$CARD_ID/photos/main \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@main-photo.jpg"
```

### 4. Загрузите фотогалерею
```bash
curl -X POST http://localhost:3000/api/cards/$CARD_ID/photos/slideshow \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "files=@photo3.jpg"
```

### 5. Проверьте результат
```bash
curl http://localhost:3000/api/cards/$CARD_ID
```

Ответ будет содержать URL всех загруженных фотографий в полях `headPhotoUrl` и массиве `slideshowPhotos`.

## Тестирование через Swagger UI

1. Откройте http://localhost:3000/api/docs
2. Авторизуйтесь:
   - Нажмите кнопку "Authorize" вверху справа
   - Введите `Bearer YOUR_TOKEN`
   - Нажмите "Authorize"
3. Найдите раздел "cards"
4. Разверните `POST /api/cards/{id}/photos/main`
5. Нажмите "Try it out"
6. Введите ID карточки
7. Выберите файл через кнопку "Choose File"
8. Нажмите "Execute"
9. Проверьте ответ и статус код (должен быть 200)

## Ограничения

- Максимум 10 файлов за один запрос для slideshow и expressions
- Максимальный размер файла определяется настройкой `MAX_FILE_SIZE` в .env (по умолчанию 10MB)
- При замене главного фото старое автоматически удаляется из MinIO
