# ⚡ Быстрый запуск Travelio

## Запуск одной командой

### Git Bash / Linux / macOS

**Запуск backend:**
```bash
bash start-backend.sh
```

**Остановка:**
```bash
bash stop-backend.sh
```

### Windows PowerShell / CMD

**Запуск backend:**
```cmd
start.bat
```

**Остановка:**
```cmd
stop-backend.bat
```

---

## Что делают скрипты?

**start-backend.sh / start.bat:**
1. ✅ Автоматически останавливает предыдущие процессы на порту 3000
2. ✅ Запускает Backend сервер (`node dist/main`)

**stop-backend.sh / stop-backend.bat:**
1. ✅ Находит все процессы на порту 3000
2. ✅ Останавливает их

---

## Доступные эндпоинты после запуска

- **🌐 Backend API**: http://localhost:3000
- **📚 Swagger Docs**: http://localhost:3000/api/docs
- **📧 Mailpit** (email тестирование): http://localhost:8025
- **🪣 MinIO Console**: http://localhost:9001 (minio_admin / minio_secret)
- **️ Prisma Studio**: `npx prisma studio` (в папке backend)

---

## Тестовые аккаунты

После первого запуска в БД будут созданы тестовые пользователи:

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@travelio.local | admin123 |
| Partner | partner@travelio.local | partner123 |
| User | user@travelio.local | user123 |

---

## Остановка проекта

### Git Bash / Linux / macOS

```bash
bash stop.sh
```

### Windows PowerShell

```powershell
.\stop.ps1
```

---

## Полный сброс проекта

Если нужно полностью пересоздать базу данных:

```bash
# Остановить все контейнеры и удалить volumes
docker-compose down -v

# Запустить снова
bash startup.sh  # или .\startup.ps1 в PowerShell
```

---

## Troubleshooting

### ❌ Docker не запущен

**Ошибка**: `unable to get image... The system cannot find the file specified`

**Решение**: 
1. Запустите **Docker Desktop** из меню Пуск (Windows)
2. Дождитесь, пока Docker полностью запустится (иконка станет зеленой)
3. Повторите `bash startup.sh`

### Порт 3000 уже занят

Измените `BACKEND_PORT` в `.env` файле:
```env
BACKEND_PORT=3001
```

### PostgreSQL не запускается

1. Проверьте, не занят ли порт 5432:
   ```bash
   netstat -ano | findstr :5432  # Windows
   lsof -i :5432  # Linux/macOS
   ```

2. Измените порт в `.env` и `docker-compose.yml`:
   ```env
   DATABASE_PORT=5433
   ```

### Docker ошибки

Убедитесь, что Docker Desktop запущен и работает:
```bash
docker ps
```

### npm install не работает

Попробуйте очистить кэш npm:
```bash
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Разработка Frontend

Для запуска Frontend (опционально):

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на http://localhost:5173

---

## Полезные команды

### Просмотр логов Docker контейнеров

```bash
docker-compose logs -f postgres  # PostgreSQL логи
docker-compose logs -f --tail=100  # Все логи (последние 100 строк)
```

### Подключение к PostgreSQL

```bash
docker-compose exec postgres psql -U travelio_user -d travelio_db
```

### Просмотр БД через Prisma Studio

```bash
cd backend
npx prisma studio
```

Откроется в браузере на http://localhost:5555

### Пересоздание миграций

```bash
cd backend
npx prisma migrate reset  # ⚠️ Удалит все данные!
npx prisma migrate dev
npm run prisma:seed
```

---

## Что дальше?

После успешного запуска:

1. 📚 Изучите **Swagger документацию** на http://localhost:3000/api/docs
2. 🔐 Залогиньтесь через API `/auth/login` с тестовым аккаунтом
3. 🎫 Создайте тур через endpoints `/cards` и `/tickets`
4. 📅 Настройте расписание через `/schedules`
5. 🛒 Протестируйте бронирование через `/orders`
6. 💳 Проверьте создание платежа через `/payments`

Полная документация: [BACKEND_COMPLETE.md](BACKEND_COMPLETE.md)
