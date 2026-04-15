#!/bin/bash

# Остановка старых процессов на порту 3000
echo "🛑 Stopping old processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

cd "$(dirname "$0")/backend" || exit 1

echo "🚀 Starting NestJS Backend..."
echo "📍 Working directory: $(pwd)"
echo ""

node dist/main
