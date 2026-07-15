@echo off
setlocal

REM Go to the folder containing this .bat file
cd /d "%~dp0"

REM Start the Next.js server
start "Next.js Dev Server" cmd /k "pnpm start"

REM Wait until localhost:3000 is available
:wait
powershell -Command "try { Invoke-WebRequest http://localhost:3000 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto wait
)

REM Brave executable
set "BRAVE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

REM Open the app
start "" "%BRAVE%" ^
  --user-data-dir="%TEMP%\ChromePOS" ^
  --app=http://localhost:3000 ^
  --start-maximized ^
  --kiosk-printing ^
  --disable-pinch ^
  --overscroll-history-navigation=0 ^
  --disable-session-crashed-bubble ^
  --no-first-run ^
  --disable-infobars

exit