#!/bin/bash

# Скрипт для исправления версии Prisma

echo "🔧 Исправление версии Prisma..."

cd backend

echo "📦 Удаление старых зависимостей..."
rm -rf node_modules
rm -f package-lock.json

echo "📥 Установка правильных версий..."
npm install

echo "✅ Готово! Теперь запустите: bash startup.sh"
