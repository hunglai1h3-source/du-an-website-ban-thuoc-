@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   PharmaTrust Data Hub - Thiet lap moi truong Windows
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-windows.ps1"
if errorlevel 1 (
  echo.
  echo [LOI] Qua trinh thiet lap gap su co.
  pause
  exit /b 1
)

endlocal
