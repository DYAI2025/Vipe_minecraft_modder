@echo off
cls
echo ========================================================
echo    CLAUDE-CRAFT MIT LOKALEM SERVER
echo    (Loest Speech API Probleme!)
echo ========================================================
echo.

cd /d C:\ClaudeCraft

echo Installiere HTTP-Server...
call npm install -g http-server

echo.
echo Starte Server auf Port 8080...
start cmd /k "http-server -p 8080 -c-1"

echo.
echo Warte 3 Sekunden...
timeout /t 3 /nobreak >nul

echo.
echo Oeffne Claude-Craft im Browser...
start chrome "http://localhost:8080/src/index.html"

echo.
echo ========================================================
echo  WICHTIG: Die App laeuft jetzt unter:
echo  http://localhost:8080/src/index.html
echo.
echo  Speech API sollte jetzt funktionieren!
echo ========================================================
echo.
pause