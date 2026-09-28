@echo off
setlocal
cd /d "%~dp0"

set "PYTHONPATH=%~dp0apps\api;%PYTHONPATH%"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

if not exist .venv (
  echo [THONG BAO] Moi truong .venv chua duoc khoi tao. Dang cai dat...
  py -3.11 -m venv .venv
  call .\.venv\Scripts\pip.exe install -r apps\api\requirements.txt
)

.\.venv\Scripts\python.exe -m app.cli %*
endlocal
