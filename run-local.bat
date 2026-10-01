@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ======================================================================
echo          PHARMATRUST / H4CARE - KHOI DONG TOAN BO HE THONG
echo ======================================================================
echo   [1] Giao dien Khach Hang (Storefront):    http://localhost:3000
echo   [2] Giao dien Admin Data Hub (Vite):      http://localhost:5173
echo   [3] Backend API & Tai lieu Swagger:       http://localhost:8000/docs
echo   [4] Health Check API:                     http://localhost:8000/api/v1/health
echo ======================================================================
echo.

where node >nul 2>&1 || set "PATH=C:\Users\AD\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.20_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v20.20.2-win-x64;%PATH%"
where python >nul 2>&1 || set "PATH=C:\Users\AD\AppData\Local\Programs\Python\Python311;C:\Users\AD\AppData\Local\Programs\Python\Python311\Scripts;%PATH%"

set "PYTHON_EXE="
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PYTHON_EXE=%~dp0.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

set "PYTHONPATH=%~dp0apps\api;%PYTHONPATH%"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

:: Kiem tra va khoi tao co so du lieu SQLite neu chua co
if not exist "%~dp0pharmatrust.db" (
    echo [THONG BAO] Co so du lieu SQLite chua co. Dang khoi tao va nap du lieu mau...
    "%PYTHON_EXE%" -m app.seed
    if errorlevel 1 (
        echo [CANH BAO] Nap du lieu mau that bai. Tiep tuc khoi dong server...
    ) else (
        echo [OK] Co so du lieu SQLite da duoc khoi tao thanh cong!
    )
    echo.
)

:: 1. Khoi dong Backend FastAPI tren cong 8000
echo [1/3] Dang khoi dong Backend API (Cong 8000)...
start "H4CARE-Backend-8000" cmd /k "title H4CARE Backend :8000 && cd /d "%~dp0" && set "PATH=C:\Users\AD\AppData\Local\Programs\Python\Python311;C:\Users\AD\AppData\Local\Programs\Python\Python311\Scripts;%PATH%" && set PYTHONPATH=%~dp0apps\api && "%PYTHON_EXE%" -m uvicorn app.main:app --app-dir apps\api --reload --host 0.0.0.0 --port 8000"

:: 2. Khoi dong Storefront Next.js tren cong 3000
echo [2/3] Dang khoi dong Storefront Web Ban Hang (Cong 3000)...
start "H4CARE-Storefront-3000" cmd /k "title H4CARE Storefront :3000 && cd /d "%~dp0apps\storefront" && set "PATH=C:\Users\AD\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.20_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v20.20.2-win-x64;%PATH%" && npm run dev -- -p 3000"

:: 3. Khoi dong Admin Vite Web tren cong 5173
echo [3/3] Dang khoi dong Admin Portal Web (Cong 5173)...
start "H4CARE-Admin-5173" cmd /k "title H4CARE Admin :5173 && cd /d "%~dp0apps\web" && set "PATH=C:\Users\AD\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.20_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v20.20.2-win-x64;%PATH%" && npm run dev"

:: 4. Cho cac may chu san sang va mo trinh duyet
echo.
echo [OK] Ca 3 thanh phan dang duoc khoi chay!
echo Dang mo trang web: http://localhost:3000 ...
timeout /t 3 >nul

start http://localhost:3000

echo.
echo ======================================================================
echo   HE THONG H4CARE / PHARMATRUST DANG HOAT DONG
echo   - Giao dien chinh: http://localhost:3000
echo   - Admin Data Hub:  http://localhost:5173
echo   - API Backend:     http://localhost:8000/docs
echo   - De tat toan bo he thong, chay file stop-all.bat
echo ======================================================================
echo.
pause
