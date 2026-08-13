@echo off
chcp 65001 >nul
title Sync to GitHub (Vercel Auto-Deploy)

echo ============================================
echo   Sync Local Changes to GitHub ^+ Vercel
echo ============================================
echo.

REM Load system PATH to find git
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%b"
set "PATH=%SYS_PATH%;%USER_PATH%"

REM Check git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git not found. Please install Git first.
    pause
    exit /b 1
)

cd /d "%~dp0"

REM Check for changes
git diff --quiet --exit-code 2>nul
set "TRACKED_CHANGED=%errorlevel%"
git ls-files --others --exclude-standard | findstr /r "." >nul 2>&1
set "UNTRACKED=%errorlevel%"

if %TRACKED_CHANGED% equ 0 if %UNTRACKED% neq 0 (
    echo [INFO] No changes to sync. Everything is up to date.
    echo.
    pause
    exit /b 0
)

echo [1/3] Adding changes...
git add -A
echo.

echo [2/3] Committing...
for /f "delims=" %%i in ('powershell -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') do set "TIMESTAMP=%%i"
git commit -m "sync: local changes - %TIMESTAMP%"
if %errorlevel% neq 0 (
    echo [ERROR] Commit failed.
    pause
    exit /b 1
)
echo.

echo [3/3] Pushing to GitHub main branch...
git push origin main
if %errorlevel% neq 0 (
    echo [ERROR] Push failed. Check your network or GitHub credentials.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Sync Complete!
echo ============================================
echo.
echo   GitHub: https://github.com/XJDemi/business-website
echo   Vercel will auto-deploy shortly.
echo.
pause
