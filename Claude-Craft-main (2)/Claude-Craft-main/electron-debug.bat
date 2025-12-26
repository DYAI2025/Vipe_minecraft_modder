@echo off
cls
echo ========================================
echo    ELECTRON DEBUG START
echo ========================================
echo.

cd C:\ClaudeCraft

echo Beende alte Prozesse...
taskkill /F /IM electron.exe 2>nul

echo.
echo Starte Electron mit Konsole...
npx electron . --enable-logging --log-level=0

pause