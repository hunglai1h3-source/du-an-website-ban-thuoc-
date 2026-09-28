@echo off
setlocal
cd /d "%~dp0"

where docker >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua tim thay Docker Desktop hoac Docker chua co trong PATH.
  pause
  exit /b 1
)

set ENV_FILE=.env
echo Dang dung PharmaTrust Data Hub...
docker compose down
if errorlevel 1 (
  echo [LOI] Khong the dung dich vu Docker.
  pause
  exit /b 1
)

echo.
echo [OK] Da dung ung dung. Du lieu trong co so du lieu van duoc giu nguyen.
echo Luu y: khong dung 'docker compose down -v' neu khong muon xoa du lieu.
echo.
pause
endlocal
