@echo off
setlocal
cd /d "%~dp0"

echo ======================================================================
echo   PharmaTrust Data Hub - Ứng dụng Web chạy trực tiếp bằng Python
echo ======================================================================
echo.

if not exist .venv (
  echo [THONG BAO] Dang tao moi truong ao Python .venv...
  set "PY_CMD="
  py -3.11 -c "import sys" >nul 2>&1 && set "PY_CMD=py -3.11"
  if not defined PY_CMD py -3.12 -c "import sys" >nul 2>&1 && set "PY_CMD=py -3.12"
  if not defined PY_CMD py -3.13 -c "import sys" >nul 2>&1 && set "PY_CMD=py -3.13"
  if not defined PY_CMD py -3.14 -c "import sys" >nul 2>&1 && set "PY_CMD=py -3.14"
  if not defined PY_CMD py -3 -c "import sys" >nul 2>&1 && set "PY_CMD=py -3"
  if not defined PY_CMD python -c "import sys" >nul 2>&1 && set "PY_CMD=python"
  if not defined PY_CMD (
    echo [LOI] Khong tim thay Python tren he thong.
    pause
    exit /b 1
  )
  %PY_CMD% -m venv .venv
  call .\.venv\Scripts\pip.exe install -r apps\api\requirements.txt
)

if not exist .venv\Lib\site-packages\pharmatrust.pth (
  echo %~dp0apps\api > .venv\Lib\site-packages\pharmatrust.pth
)

set "PYTHONPATH=%~dp0apps\api;%PYTHONPATH%"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

if not exist pharmatrust.db (
  echo [THONG BAO] Dang khoi tao co so du lieu SQLite...
  .\.venv\Scripts\python.exe -m app.seed
)

echo [OK] Dang khoi dong Web App tai: http://localhost:8000
echo      - Giao dien Web: http://localhost:8000
echo      - Tai lieu API:  http://localhost:8000/docs
echo.
echo [!] Dang mo trinh duyet tu dong...
start http://localhost:8000

echo.
echo Nhan Ctrl+C de tat ung dung.
echo ======================================================================
echo.

.\.venv\Scripts\uvicorn.exe app.main:app --app-dir "%~dp0apps\api" --reload --host 0.0.0.0 --port 8000

if errorlevel 1 (
  echo.
  echo [LOI] He thong bi dung hoac gap su co.
  pause
)

endlocal
