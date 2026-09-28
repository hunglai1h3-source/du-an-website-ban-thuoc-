@echo off
setlocal
cd /d "%~dp0"

echo ======================================================================
echo          H4CARE & PHARMATRUST - KHOI DONG TOAN BO HE THONG
echo ======================================================================
echo   [1] Website Ban Hang Khach Hang (Storefront): http://localhost:3000
echo   [2] Trang Quan Tri Du Lieu (Admin Portal):    http://localhost:5173
echo   [3] Backend API Server (FastAPI):            http://localhost:8000
echo   [4] Tai lieu API He thong (Swagger Docs):    http://localhost:8000/docs
echo.
echo ======================================================================

set "PYTHONPATH=%~dp0apps\api;%PYTHONPATH%"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

:: 1. Khoi dong Backend FastAPI tren cong 8000
echo [1/3] Dang khoi dong Backend API Server (Cong 8000)...
start "PharmaTrust-Backend-8000" cmd /k "title PharmaTrust Backend :8000 && cd /d "%~dp0" && set PYTHONPATH=%~dp0apps\api && set PYTHONUTF8=1 && set PYTHONIOENCODING=utf-8 && .\.venv\Scripts\uvicorn.exe app.main:app --app-dir apps\api --reload --host 0.0.0.0 --port 8000"

:: 2. Khoi dong Trang Khach Hang Next.js tren cong 3000
echo [2/3] Dang khoi dong Trang Khach Hang Storefront (Cong 3000)...
start "H4Care-Storefront-3000" cmd /k "title H4Care Storefront :3000 && cd /d "%~dp0apps\storefront" && npm run dev -- -p 3000"

:: 3. Khoi dong Trang Quan Tri Admin Portal tren cong 5173
echo [3/3] Dang khoi dong Trang Quan Tri Admin Portal (Cong 5173)...
start "PharmaTrust-Admin-5173" cmd /k "title PharmaTrust Admin :5173 && cd /d "%~dp0apps\web" && npm run dev"

:: 4. Doi may chu san sang va mo trinh duyet
echo.
echo [OK] Cac he thong dang duoc khoi chay doc lap!
echo Dang mo trinh duyet...
timeout /t 4 >nul

start http://localhost:3000
start http://localhost:5173

echo.
echo ======================================================================
echo   HE THONG DA TACH BIET HOAN TOAN:
echo   - Khach hang: http://localhost:3000
echo   - Quan tri:   http://localhost:5173
echo   - De tat toan bo, chay file stop-all.bat hoac dong cac cua so.
echo ======================================================================
echo.
pause
