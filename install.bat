@echo off
setlocal EnableExtensions
title RustCall Installer
color 0B
cd /d "%~dp0"

echo.
echo ==========================================
echo             RUSTCALL INSTALLER
echo ==========================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Please right-click install.bat and choose Run as administrator.
    pause
    exit /b 1
)

where winget >nul 2>&1
if errorlevel 1 (
    echo WinGet is required. Install App Installer from Microsoft Store.
    pause
    exit /b 1
)

echo [1/5] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo Installing Node.js LTS...
    winget install --id OpenJS.NodeJS.LTS --exact --silent --accept-package-agreements --accept-source-agreements
    if errorlevel 1 goto failed
)

echo [2/5] Checking Rust...
where cargo >nul 2>&1
if errorlevel 1 (
    echo Installing Rust...
    winget install --id Rustlang.Rustup --exact --silent --accept-package-agreements --accept-source-agreements
    if errorlevel 1 goto failed
)

set "PATH=%USERPROFILE%\.cargo\bin;%ProgramFiles%\nodejs;%PATH%"

echo [3/5] Checking Microsoft C++ Build Tools...
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
set "HAS_VS="
if exist "%VSWHERE%" (
    "%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath >nul 2>&1
    if not errorlevel 1 set "HAS_VS=1"
)
if not defined HAS_VS (
    echo Installing Visual Studio 2022 Build Tools and C++ workload.
    winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --silent --accept-package-agreements --accept-source-agreements --override "--wait --quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
    if errorlevel 1 (
        echo Build Tools installation did not complete. Install them manually:
        echo https://visualstudio.microsoft.com/visual-cpp-build-tools/
        pause
        exit /b 1
    )
)

set "PATH=%USERPROFILE%\.cargo\bin;%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js was installed but is not available in this window.
    echo Restart Windows, then run install.bat again.
    pause
    exit /b 1
)
where cargo >nul 2>&1
if errorlevel 1 (
    echo Rust was installed but is not available in this window.
    echo Restart Windows, then run install.bat again.
    pause
    exit /b 1
)

echo [4/5] Configuring Discord bot token...
if not exist ".env" (
    set /p BOT_TOKEN="Paste your Discord bot token: "
    if not defined BOT_TOKEN (
        echo No token entered.
        pause
        exit /b 1
    )
    >.env echo DISCORD_BOT_TOKEN=%BOT_TOKEN%
)
if not exist ".env" (
    echo Could not create .env.
    pause
    exit /b 1
)

echo [5/5] Installing packages and building RustCall...
call npm install
if errorlevel 1 goto failed
call npm run tauri build
if errorlevel 1 goto failed

echo.
echo Creating desktop shortcut...
set "EXE=%CD%\src-tauri\target\release\rustcall.exe"
set "SHORTCUT=%USERPROFILE%\Desktop\RustCall.lnk"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%SHORTCUT%'); $s.TargetPath='%EXE%'; $s.WorkingDirectory='%CD%'; $s.Save()"

echo.
echo ==========================================
echo          RUSTCALL INSTALLED
echo ==========================================
echo Double-click start.bat or the desktop shortcut.
echo.
pause
exit /b 0

:failed
echo.
echo INSTALLATION FAILED. Read the error above.
pause
exit /b 1
