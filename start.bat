@echo off
echo Stopping old processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
timeout /t 1 /nobreak >nul
cd /d "%~dp0backend"
echo Starting backend server...
node dist/main
