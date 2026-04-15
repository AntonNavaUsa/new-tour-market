#!/bin/bash

# Остановка всех node процессов Travelio

echo "🛑 Остановка Travelio backend..."

# Остановка процессов на порту 3000
PORT_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_PIDS" ]; then
    echo "Найдены процессы на порту 3000: $PORT_PIDS"
    kill -9 $PORT_PIDS 2>/dev/null
    echo "✅ Процессы остановлены"
else
    echo "ℹ️  Нет процессов на порту 3000"
fi

echo "✅ Готово"
