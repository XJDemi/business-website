@echo off
chcp 65001 >nul
echo ============================================
echo   XuanJi Technology Website - Startup Script
echo ============================================
echo.

if not exist node_modules (
    echo Installing dependencies...
    npm install
    echo.
)

echo Starting server on port 8000...
echo.
echo Server will be available at: http://localhost:8000/
echo Admin panel: http://localhost:8000/admin/
echo.
echo Press Ctrl+C to stop the server.
echo ============================================
echo.

node "e:\郭海娥\trae 项目\business-website\server.js"