#!/bin/bash

set -e

echo "🚀 Запуск Travelio проекта..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка Docker
echo -e "${YELLOW}🐋 Проверка Docker...${NC}"
if ! docker info &> /dev/null; then
  echo -e "${RED}❌ Docker не запущен!${NC}"
  echo -e "${YELLOW}Пожалуйста, запустите Docker Desktop и повторите попытку.${NC}"
  echo -e "${YELLOW}Windows: Запустите Docker Desktop из меню Пуск${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker работает${NC}"

# Проверка .env файла
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠️  Файл .env не найден. Копирую из .env.example...${NC}"
  cp .env.example .env
  echo -e "${GREEN}✅ .env файл создан${NC}"
fi

# Копирование .env в папку backend для Prisma
if [ ! -f "backend/.env" ]; then
  echo -e "${YELLOW}📋 Копирование .env в backend...${NC}"
  cp .env backend/.env
  echo -e "${GREEN}✅ backend/.env создан${NC}"
fi

# Проверка docker-compose
if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}❌ docker-compose не установлен!${NC}"
  exit 1
fi

# Остановка старых контейнеров (если есть)
echo -e "${YELLOW}🔄 Остановка старых контейнеров...${NC}"
docker-compose down 2>/dev/null || true

# Запуск инфраструктуры
echo -e "${YELLOW}🐳 Запуск Docker контейнеров...${NC}"
docker-compose up -d postgres minio mailpit

# Ожидание готовности PostgreSQL
echo -e "${YELLOW}⏳ Ожидание готовности PostgreSQL...${NC}"
for i in {1..30}; do
  if docker-compose exec -T postgres pg_isready -U travelio_user -d travelio_db &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL готов${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ PostgreSQL не запустился за 30 секунд${NC}"
    exit 1
  fi
  echo -n "."
  sleep 1
done

# Backend setup
echo -e "${YELLOW}📦 Установка зависимостей Backend...${NC}"

# Сохраняем текущую директорию
PROJECT_ROOT=$(pwd)
cd backend

if [ ! -d "node_modules" ]; then
  npm install
else
  echo -e "${GREEN}✅ node_modules уже установлены${NC}"
fi

# Prisma
echo -e "${YELLOW}🔧 Генерация Prisma Client...${NC}"
npx prisma generate

echo -e "${YELLOW}🗄️  Применение миграций...${NC}"
npx prisma migrate deploy

# Проверка, нужно ли делать seed
echo -e "${YELLOW}🌱 Проверка данных в БД...${NC}"
ADMIN_COUNT=$(docker-compose exec -T postgres psql -U travelio_user -d travelio_db -tAc "SELECT COUNT(*) FROM \"User\" WHERE role = 'ADMIN';" 2>/dev/null || echo "0")

if [ "$ADMIN_COUNT" -eq "0" ]; then
  echo -e "${YELLOW}🌱 Заполнение БД тестовыми данными...${NC}"
  npm run prisma:seed
else
  echo -e "${GREEN}✅ БД уже содержит данные${NC}"
fi

# Запуск Backend
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Проект запущен успешно!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📍 Backend API: ${YELLOW}http://localhost:3000${NC}"
echo -e "📚 Swagger Docs: ${YELLOW}http://localhost:3000/api/docs${NC}"
echo -e "🗄️  Prisma Studio: ${YELLOW}npx prisma studio${NC}"
echo -e "📧 Mailpit: ${YELLOW}http://localhost:8025${NC}"
echo -e "🪣 MinIO Console: ${YELLOW}http://localhost:9001${NC}"
echo ""
echo -e "${YELLOW}🔐 Тестовые аккаунты:${NC}"
echo "   Admin: admin@travelio.local / admin123"
echo "   Partner: partner@travelio.local / partner123"
echo "   User: user@travelio.local / user123"
echo ""
echo -e "${YELLOW}🚀 Запуск Backend сервера...${NC}"
echo ""

# Запуск из директории backend
cd "$PROJECT_ROOT/backend"
node dist/main
