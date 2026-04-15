# PowerShell startup script для Travelio

Write-Host "🚀 Запуск Travelio проекта..." -ForegroundColor Green

# Проверка Docker
Write-Host "🐋 Проверка Docker..." -ForegroundColor Yellow
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker не отвечает"
    }
    Write-Host "✅ Docker работает" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker не запущен!" -ForegroundColor Red
    Write-Host "Пожалуйста, запустите Docker Desktop и повторите попытку." -ForegroundColor Yellow
    Write-Host "Windows: Запустите Docker Desktop из меню Пуск" -ForegroundColor Yellow
    exit 1
}

# Проверка .env файла
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Файл .env не найден. Копирую из .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example -Destination .env
    Write-Host "✅ .env файл создан" -ForegroundColor Green
}

# Копирование .env в папку backend для Prisma
if (-not (Test-Path "backend\.env")) {
    Write-Host "📋 Копирование .env в backend..." -ForegroundColor Yellow
    Copy-Item .env -Destination backend\.env
    Write-Host "✅ backend\.env создан" -ForegroundColor Green
}

# Проверка docker-compose
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker-compose не установлен!" -ForegroundColor Red
    exit 1
}

# Остановка старых контейнеров (если есть)
Write-Host "🔄 Остановка старых контейнеров..." -ForegroundColor Yellow
docker-compose down 2>$null

# Запуск инфраструктуры
Write-Host "🐳 Запуск Docker контейнеров..." -ForegroundColor Yellow
docker-compose up -d postgres minio mailpit

# Ожидание готовности PostgreSQL
Write-Host "⏳ Ожидание готовности PostgreSQL..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    try {
        $result = docker-compose exec -T postgres pg_isready -U travelio_user -d travelio_db 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL готов" -ForegroundColor Green
            $ready = $true
            break
        }
    } catch {
        # Игнорируем ошибки
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Host "❌ PostgreSQL не запустился за 30 секунд" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
}

# Backend setup
Write-Host "`n📦 Установка зависимостей Backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "✅ node_modules уже установлены" -ForegroundColor Green
}

# Prisma
Write-Host "🔧 Генерация Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "🗄️  Применение миграций..." -ForegroundColor Yellow
npx prisma migrate deploy

# Проверка, нужно ли делать seed
Write-Host "🌱 Проверка данных в БД..." -ForegroundColor Yellow
$adminCount = docker-compose exec -T postgres psql -U travelio_user -d travelio_db -tAc "SELECT COUNT(*) FROM \`"User\`" WHERE role = 'ADMIN';" 2>$null
if (-not $adminCount) { $adminCount = 0 }

if ([int]$adminCount -eq 0) {
    Write-Host "🌱 Заполнение БД тестовыми данными..." -ForegroundColor Yellow
    npm run prisma:seed
} else {
    Write-Host "✅ БД уже содержит данные" -ForegroundColor Green
}

# Запуск Backend
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Проект запущен успешно!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend API: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Yellow
Write-Host "📚 Swagger Docs: " -NoNewline
Write-Host "http://localhost:3000/api/docs" -ForegroundColor Yellow
Write-Host "🗄️  Prisma Studio: " -NoNewline
Write-Host "npx prisma studio" -ForegroundColor Yellow
Write-Host "📧 Mailpit: " -NoNewline
Write-Host "http://localhost:8025" -ForegroundColor Yellow
Write-Host "🪣 MinIO Console: " -NoNewline
Write-Host "http://localhost:9001" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔐 Тестовые аккаунты:" -ForegroundColor Yellow
Write-Host "   Admin: admin@travelio.local / admin123"
Write-Host "   Partner: partner@travelio.local / partner123"
Write-Host "   User: user@travelio.local / user123"
Write-Host ""
Write-Host "🚀 Запуск Backend сервера..." -ForegroundColor Yellow
Write-Host ""

npm run start:dev
