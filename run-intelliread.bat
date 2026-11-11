@echo off
title IntelliRead
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this again. & pause & exit /b)
echo Stopping any old IntelliRead that is still running...
for %%P in (8080 8787) do for /f "tokens=5" %%a in ('%SystemRoot%\System32\netstat.exe -ano ^| findstr ":%%P " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>nul
echo Installing dependencies (first time takes a few minutes)...
call npm install
echo Starting IntelliRead (website on 8080, API on 8787)...
start "" cmd /c "timeout /t 8 >nul & start http://localhost:8080"
call npm run dev
pause
