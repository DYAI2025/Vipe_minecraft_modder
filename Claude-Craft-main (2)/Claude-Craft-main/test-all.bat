@echo off
cls
echo ========================================================
echo         CLAUDE-CRAFT - TEST SESSION
echo ========================================================
echo.
echo Starte Claude-Craft zum Testen...
echo.

cd /d C:\ClaudeCraft

echo [1] Starte Haupt-App...
start /B npx electron .

echo.
echo [2] Oeffne Test-Zentrale im Browser...
timeout /t 2 /nobreak >nul
start test-center.html

echo.
echo [3] Oeffne Sprach-Test...
timeout /t 2 /nobreak >nul
start src\speech-test.html

echo.
echo ========================================================
echo  TEST-BEFEHLE ZUM AUSPROBIEREN:
echo ========================================================
echo.
echo  1. "Erstelle einen Block"
echo  2. "Mache ihn aus Diamant"  
echo  3. "Lass es leuchten"
echo  4. "Mache ihn groesser"
echo  5. "Lass es schweben"
echo  6. "Regenbogenfarben bitte"
echo  7. "Claude, erklaere mir das!"
echo.
echo ========================================================
echo.
echo App laeuft! Viel Spass beim Testen!
echo.
pause