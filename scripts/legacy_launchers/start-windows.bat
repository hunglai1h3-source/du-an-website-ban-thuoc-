@echo off
setlocal
cd /d "%~dp0"
where docker >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Docker Desktop hoac Docker chua co trong PATH.
  pause
  exit /b 1
)
if not exist .env copy .env.example .env >nul
set ENV_FILE=.env
echo Dang khoi dong PharmaTrust Data Hub...
docker compose up --build
if errorlevel 1 (
  echo [LOI] Khong the khoi dong. Hay kiem tra Docker Desktop dang chay.
  pause
  exit /b 1
)
endlocal

