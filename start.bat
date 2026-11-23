@echo off
cd /d "%~dp0"
title Sci-Report Portal Server
echo ====================================================
echo   Sci-Report Portal - Grading and Upload System
echo ====================================================
echo.

if not exist "node_modules" (
    echo [1/2] Installing required npm packages...
    call npm install
    echo.
)

echo [2/2] Starting server at http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js
pause
