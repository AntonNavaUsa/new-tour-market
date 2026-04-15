# PowerShell stop script для Travelio

Write-Host "🛑 Остановка Travelio проекта..." -ForegroundColor Yellow

# Остановка Docker контейнеров
Write-Host "🐳 Остановка Docker контейнеров..." -ForegroundColor Yellow
docker-compose down

Write-Host "✅ Проект остановлен" -ForegroundColor Green
