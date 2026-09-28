@echo off
setlocal
cd /d "%~dp0apps\web"

echo ========================================================
echo   PharmaTrust Data Hub - Frontend (React / Vite)
echo ========================================================
echo.

if not exist node_modules (
  echo [THONG BAO] Dang cai dat thu vien npm...
  call npm.cmd install
)

echo [OK] Dang khoi dong Frontend tai http://localhost:5173 ...
echo Nhan Ctrl+C de dung Frontend.
echo.
call npm.cmd run dev

if errorlevel 1 (
  echo.
  echo [LOI] Frontend bi dung hoac gap su co.
  pause
)

endlocal
