@echo off
echo Starting Pino Backend and Frontend...
echo.
set "ROOT=%~dp0"
echo Opening Backend in new window...
start "Pino Backend" cmd /k "cd /d \"%ROOT%Backend\" && npm run start:dev"

timeout /t 3 /nobreak >nul

echo Opening Frontend in new window...
start "Pino Frontend" cmd /k "cd /d \"%ROOT%Frontend\" && npm run dev"

echo.
echo ======================================
echo Both servers are starting!
echo ======================================
echo.
echo Backend will be at: http://localhost:3001
echo Frontend will be at: http://localhost:3000
echo.
echo Check the new terminal windows for status.
echo Press any key to exit this window...
pause >nul
