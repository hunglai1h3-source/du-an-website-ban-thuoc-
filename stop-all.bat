@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ======================================================================
echo          PHARMATRUST / H4CARE - DUNG TOAN BO HE THONG
echo ======================================================================
echo.

echo Dang tat tien trinh Backend API (cong 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Dang tat tien trinh Storefront Next.js (cong 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Dang tat tien trinh Admin Vite dev (cong 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo [OK] Da tat toan bo may chu H4CARE / PharmaTrust thanh cong!
echo ======================================================================
echo.
pause
