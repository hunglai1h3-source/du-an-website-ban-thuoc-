@echo off
setlocal
cd /d "%~dp0"

echo ======================================================================
echo          PHARMATRUST UNIFIED ECOSYSTEM - KHOI DONG HE THONG
echo ======================================================================
echo   [1] Giao dien Khach Hang (Storefront):    http://localhost:3000
echo   [2] Giao dien Admin Portal (Cung cong):   http://localhost:3000/admin
echo   [3] Giao dien Admin doc lap:              http://localhost:8000
echo   [4] Tai lieu API He thong (Swagger):      http://localhost:8000/docs
echo.
echo ======================================================================

set "PYTHONPATH=%~dp0apps\api;%PYTHONPATH%"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

:: 1. Khoi dong Backend FastAPI & Admin Web tren cong 8000
echo [1/2] Dang khoi dong Admin & Backend API (Cong 8000)...
start "PharmaTrust-Backend-Admin-8000" cmd /k "title PharmaTrust Admin :8000 && cd /d "%~dp0" && set PYTHONPATH=%~dp0apps\api && .\.venv\Scripts\uvicorn.exe app.main:app --app-dir apps\api --reload --host 0.0.0.0 --port 8000"

:: 2. Khoi dong Next.js Storefront tren cong 3000
echo [2/2] Dang khoi dong Storefront Web Ban Hang (Cong 3000)...
start "PharmaTrust-Storefront-3000" cmd /k "title PharmaTrust Storefront :3000 && cd /d "%~dp0apps\storefront" && npm run dev -- -p 3000"

:: 3. Doi may chu san sang va mo duy nhat trang giao dien chinh
echo.
echo [OK] Ca hai he thong dang duoc khoi chay!
echo Dang mo trang web chinh: http://localhost:3000 ...
timeout /t 3 >nul

start http://localhost:3000

echo.
echo ======================================================================
echo   HE THONG PHARMATRUST DANG HOAT DONG
echo   - Giao dien chinh: http://localhost:3000
echo   - Dang nhap Admin tai giao dien chinh se tu dong mo tab Quan Tri.
echo   - De tat toan bo he thong, chay file stop-all.bat hoac dong cac cua so.
echo ======================================================================
echo.
pause
