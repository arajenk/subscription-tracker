@echo off
setlocal enabledelayedexpansion
:: Build the Python sidecar binary and copy it to src-tauri\binaries\
:: Usage: scripts\build-sidecar.bat

echo ^> Building sidecar...

:: Get the Rust target triple
for /f "tokens=2 delims= " %%T in ('rustc -vV ^| findstr /C:"host:"') do set TRIPLE=%%T
echo ^> Target triple: %TRIPLE%

python -m PyInstaller subtracker-backend.spec --clean --noconfirm
if errorlevel 1 (
    echo ERROR: PyInstaller failed
    exit /b 1
)

if not exist "src-tauri\binaries" mkdir "src-tauri\binaries"
copy /y "dist\subtracker-backend.exe" "src-tauri\binaries\subtracker-backend-%TRIPLE%.exe"
if errorlevel 1 (
    echo ERROR: Failed to copy sidecar binary
    exit /b 1
)

echo Done: src-tauri\binaries\subtracker-backend-%TRIPLE%.exe
