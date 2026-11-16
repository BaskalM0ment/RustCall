@echo off
setlocal
title RustCall
cd /d "%~dp0"

if not exist ".env" (
    echo Missing .env file. Run install.bat first.
    pause
    exit /b 1
)

if not exist "src-tauri\target\release\rustcall.exe" (
    echo RustCall has not been built yet. Run install.bat first.
    pause
    exit /b 1
)

start "" "%~dp0src-tauri\target\release\rustcall.exe"
exit /b 0
