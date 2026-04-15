#!/bin/bash

echo "🛑 Остановка Travelio проекта..."

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Остановка Docker контейнеров
echo -e "${YELLOW}🐳 Остановка Docker контейнеров...${NC}"
docker-compose down

echo -e "${GREEN}✅ Проект остановлен${NC}"
