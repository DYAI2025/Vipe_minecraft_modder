@echo off
cls
echo ========================================================
echo    CHROME MIT SPEECH API FLAGS
echo ========================================================
echo.

echo Schliesse alle Chrome-Fenster...
taskkill /F /IM chrome.exe 2>nul

echo.
echo Starte Chrome mit Speech API Flags...

start chrome --enable-speech-dispatcher ^
            --enable-features=WebSpeech ^
            --allow-file-access-from-files ^
            --disable-web-security ^
            --user-data-dir="C:\ClaudeCraft\chrome-temp" ^
            "http://localhost:8080"

echo.
echo ========================================================
echo  Chrome wurde mit speziellen Flags gestartet!
echo  Speech API sollte jetzt funktionieren!
echo ========================================================
echo.
pause