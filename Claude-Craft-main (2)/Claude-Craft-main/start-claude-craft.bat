@echo off
echo ====================================
echo   Claude-Craft IDE - Starter
echo   Minecraft Mod Creator für Kinder
echo ====================================
echo.

cd /d C:\ClaudeCraft

echo Überprüfe Node.js Installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FEHLER] Node.js ist nicht installiert!
    echo Bitte installiere Node.js von https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installiere Abhängigkeiten...
    echo Das kann beim ersten Mal ein paar Minuten dauern...
    npm install
)

echo.
echo Starte Claude-Craft IDE...
echo.
npm start

pause