@echo off
setlocal
cd /d "%~dp0"

set "PYTHONPATH=%~dp0apps\api;%PYTHONPATH%"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

if not exist .venv (
  echo [THONG BAO] Moi truong .venv chua duoc khoi tao. Dang cai dat...
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

.\.venv\Scripts\python.exe -m app.cli %*
endlocal
