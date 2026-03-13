@echo off
setlocal enabledelayedexpansion

set "PROJECT=%~dp0"
set "PROJECT=%PROJECT:~0,-1%"
cd /d "%PROJECT%"

echo Setting up subtracker...

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Install Python 3 from https://python.org
    pause
    exit /b 1
)

:: Create virtual environment
if not exist ".venv" (
    echo -- Creating Python virtual environment...
    python -m venv .venv
)

echo -- Installing Python dependencies...
.venv\Scripts\pip install -q --upgrade pip
.venv\Scripts\pip install -q -r requirements.txt

:: Node dependencies
echo -- Installing Node dependencies...
cd frontend
call npm install --silent
cd ..

set "PYTHON=%PROJECT%\.venv\Scripts\python.exe"

:: Task Scheduler for login notifications
echo -- Setting up login notification task...
schtasks /delete /tn "SubTracker Notify" /f >nul 2>&1
schtasks /create /tn "SubTracker Notify" /tr "\"%PYTHON%\" \"%PROJECT%\notify_check.py\"" /sc onlogon /rl limited /f >nul
echo -- Login notification task installed.

echo.
echo Done. Double-click SubTracker.bat to launch.
pause
