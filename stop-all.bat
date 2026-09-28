@echo off
setlocal
cd /d "%~dp0"

echo ======================================================================
echo          PHARMATRUST UNIFIED ECOSYSTEM - DUNG HE THONG
echo ======================================================================
echo.

echo Dang tat tien trinh Admin uvicorn (cong 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Dang tat tien trinh Storefront Next.js (cong 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo.
echo [OK] Da tat toan bo may chu PharmaTrust thanh cong!
echo ======================================================================
pause
