@echo off
chcp 65001 >nul
title Installing Dependencies

echo ============================================
echo    Installing Dependencies
echo ============================================
echo.

set "PATH=D:\Program Files\nodejs;%PATH%"

cd /d "e:\郭海娥\trae 项目\business-website"

echo Node version:
node --version
echo.

echo Installing npm packages...
call npm install --no-audit --no-fund

if errorlevel 1 (
    echo.
    echo ============================================
    echo ERROR: Installation failed!
    echo ============================================
    pause
    exit /b 1
)

echo.
echo ============================================
echo Dependencies installed successfully!
echo ============================================
echo.
echo You can now run start.bat to start the server.
echo.
pause
