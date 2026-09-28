@echo off
setlocal
cd /d "%~dp0"

echo ======================================================================
echo          PHARMATRUST DATA HUB - KHOI DONG HE THONG
echo ======================================================================
echo   [1] Giao dien Web (Vite Dev):   http://localhost:5173
echo   [2] Backend & Web SPA:          http://localhost:8000
echo   [3] Tai lieu API He thong (Docs): http://localhost:8000/docs
echo.
echo ======================================================================

set "PYTHONPATH=%~dp0apps\api;%PYTHONPATH%"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

:: 1. Khoi dong Backend FastAPI
echo [1/2] Dang khoi dong Backend API (Cong 8000)...
start "PharmaTrust-Backend-8000" cmd /k "title PharmaTrust Backend :8000 && cd /d "%~dp0" && set PYTHONPATH=%~dp0apps\api && set PYTHONUTF8=1 && set PYTHONIOENCODING=utf-8 && .\.venv\Scripts\uvicorn.exe app.main:app --app-dir apps\api --reload --host 0.0.0.0 --port 8000"

:: 2. Khoi dong Frontend Vite Web
echo [2/2] Dang khoi dong Frontend Web (Cong 5173)...
start "PharmaTrust-Web-5173" cmd /k "title PharmaTrust Web :5173 && cd /d "%~dp0apps\web" && npm run dev"

:: 3. Doi may chu san sang va mo trinh duyet
echo.
echo [OK] Ca hai he thong dang duoc khoi chay!
echo Dang mo trinh duyet...
timeout /t 3 >nul

start http://localhost:5173
start http://localhost:8000/docs

echo.
echo ======================================================================
echo   HE THONG PHARMATRUST DANG HOAT DONG
echo   - De tat toan bo he thong, chay file stop-all.bat hoac dong cac cua so.
echo ======================================================================
echo.
pause
