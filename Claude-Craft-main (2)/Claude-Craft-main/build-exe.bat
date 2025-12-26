@echo off
echo ====================================
echo   Claude-Craft IDE - EXE Builder
echo ====================================
echo.

cd /d C:\ClaudeCraft

echo Installiere Electron-Builder falls nötig...
npm install --save-dev electron-builder

echo.
echo Baue Windows EXE...
npm run build

echo.
echo ====================================
echo   Build abgeschlossen!
echo   Die .exe findest du in: dist\
echo ====================================
echo.

pause