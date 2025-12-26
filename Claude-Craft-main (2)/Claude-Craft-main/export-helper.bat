@echo off
title Claude-Craft Export Helper
color 0A

echo ==========================================
echo    CLAUDE-CRAFT EXPORT HELPER
echo    Automatischer Mod-Export zu Minecraft
echo ==========================================
echo.

:: Prüfe ob MCreator installiert ist
if exist "C:\Program Files\Pylo\MCreator\mcreator.exe" (
    echo [OK] MCreator gefunden!
) else (
    echo [!] MCreator nicht gefunden!
    echo     Bitte installiere MCreator von https://mcreator.net
    pause
    exit
)

:: Prüfe Minecraft mods Ordner
set MC_MODS=%APPDATA%\.minecraft\mods
if not exist "%MC_MODS%" (
    echo [i] Erstelle Minecraft mods Ordner...
    mkdir "%MC_MODS%"
    echo [OK] Mods Ordner erstellt!
) else (
    echo [OK] Minecraft mods Ordner gefunden!
)

echo.
echo Optionen:
echo [1] JAR direkt in Minecraft kopieren
echo [2] MCreator Projekt öffnen
echo [3] Backup mods Ordner
echo [4] Forge installieren
echo [5] Zeige Export-Guide
echo.

set /p choice="Wähle eine Option (1-5): "

if "%choice%"=="1" goto COPY_JAR
if "%choice%"=="2" goto OPEN_MCREATOR  
if "%choice%"=="3" goto BACKUP_MODS
if "%choice%"=="4" goto INSTALL_FORGE
if "%choice%"=="5" goto SHOW_GUIDE

:COPY_JAR
echo.
echo === JAR zu Minecraft kopieren ===
echo.
echo Ziehe deine .jar Datei hier rein und drücke Enter:
set /p jarfile=

if exist "%jarfile%" (
    copy "%jarfile%" "%MC_MODS%"
    echo [OK] Mod kopiert nach: %MC_MODS%
    echo.
    echo Starte Minecraft mit Forge!
) else (
    echo [!] Datei nicht gefunden!
)
pause
goto END

:OPEN_MCREATOR
echo.
echo === MCreator öffnen ===
start "" "C:\Program Files\Pylo\MCreator\mcreator.exe"
echo [OK] MCreator gestartet!
pause
goto END

:BACKUP_MODS
echo.
echo === Backup erstellen ===
set backup_name=mods_backup_%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%
set backup_name=%backup_name: =0%
xcopy "%MC_MODS%" "%USERPROFILE%\Desktop\%backup_name%\" /E /I
echo [OK] Backup erstellt auf Desktop: %backup_name%
pause
goto END

:INSTALL_FORGE
echo.
echo === Forge Installation ===
echo.
echo 1. Öffne https://files.minecraftforge.net/
echo 2. Wähle deine Minecraft Version
echo 3. Download "Installer"
echo 4. Doppelklick und "Install Client" wählen
echo.
echo Browser öffnet sich...
start https://files.minecraftforge.net/
pause
goto END

:SHOW_GUIDE
echo.
type EXPORT-GUIDE.md
pause
goto END

:END
echo.
echo ==========================================
echo    Viel Spaß mit deinen Mods!
echo ==========================================
pause