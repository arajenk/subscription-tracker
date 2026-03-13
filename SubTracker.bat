@echo off
setlocal enabledelayedexpansion

set "PROJECT=%~dp0"
set "PROJECT=%PROJECT:~0,-1%"
cd /d "%PROJECT%"

set "LOG_DIR=%APPDATA%\SubTracker\logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

if exist ".venv\Scripts\python.exe" (
    set "PYTHON=%PROJECT%\.venv\Scripts\python.exe"
) else if exist "venv\Scripts\python.exe" (
    set "PYTHON=%PROJECT%\venv\Scripts\python.exe"
) else (
    set "PYTHON=python"
)

"%PYTHON%" --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Run setup.bat first.
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo npm not found. Install Node.js from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 "') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 "') do taskkill /F /PID %%a >nul 2>&1

start /min "subtracker backend" cmd /c ""%PYTHON%" "%PROJECT%\main.py" > "%LOG_DIR%\backend.log" 2>&1"

cd "%PROJECT%\frontend"
start /min "subtracker frontend" cmd /c "npm run dev > "%LOG_DIR%\frontend.log" 2>&1"
cd "%PROJECT%"

set /a count=0
:wait_backend
if !count! geq 30 (
    echo Backend failed to start. Check logs at %LOG_DIR%\backend.log
    pause
    exit /b 1
)
curl -sf http://localhost:8000/subscriptions >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    set /a count+=1
    goto wait_backend
)

set /a count=0
:wait_frontend
if !count! geq 30 goto open_browser
curl -sf http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    timeout /t 1 /nobreak >nul
    set /a count+=1
    goto wait_frontend
)

:open_browser
start http://localhost:3000
echo subtracker is running — close this window to stop the servers.
pause
