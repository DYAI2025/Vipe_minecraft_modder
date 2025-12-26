@echo off
echo ===============================================
echo   CLAUDE-CRAFT IDE - Quick Start
echo   Iteration 1: Minecraft Block Viewer
echo ===============================================
echo.

cd /d C:\ClaudeCraft

echo Pruefe Installation...
if not exist "node_modules\electron" (
    echo.
    echo Installiere Electron... (einmalig)
    npm install electron three --save
)

echo.
echo [OK] Starte Claude-Craft IDE...
echo.
echo FEATURES DIE FUNKTIONIEREN:
echo - 3D Block-Viewer mit echten Minecraft-Texturen
echo - Sprachbefehle (Mikrofon-Button)
echo - Animationen (Rotation, Schweben, Regenbogen)
echo - Kinderfreundliche Oberflaeche
echo.

npx electron .

if errorlevel 1 (
    echo.
    echo [FEHLER] App konnte nicht gestartet werden
    echo Versuche: npm install --force
    pause
)