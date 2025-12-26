@echo off
cls
echo ========================================================
echo   CLAUDE-CRAFT IDE - Iteration 2
echo   Sprachgesteuerte Minecraft Mod-Schule mit Claude!
echo ========================================================
echo.
echo NEU IN VERSION 2.0:
echo -------------------
echo [+] Claude erklaert alles was er macht
echo [+] Erweiterte Sprach-Befehle verstehen
echo [+] Eigenschaften-Editor mit Erklaerungen
echo [+] Lern-Tipps waehrend du baust
echo [+] Mehr Animationen (Wackeln, Groesse)
echo [+] Interaktive Hilfe mit Beispielen
echo.
echo SPRACHBEFEHLE DIE FUNKTIONIEREN:
echo ---------------------------------
echo - "Erstelle einen leuchtenden Diamantblock"
echo - "Mache ihn groesser"
echo - "Lass es regenbogenfarben werden"
echo - "Zeige mir ein riesiges Schwert"
echo - "Mache es unzerstoerbar wie Bedrock"
echo - "Claude, erklaere mir das!"
echo.

cd /d C:\ClaudeCraft

if not exist "node_modules\electron" (
    echo Installiere fehlende Module...
    npm install electron three --save
)

echo.
echo [START] Oeffne Claude-Craft IDE...
echo.
npx electron .

pause