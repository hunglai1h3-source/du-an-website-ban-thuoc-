@echo off
setlocal
cd /d "%~dp0apps\web"

echo ========================================================
echo   PharmaTrust Data Hub - Trang Quan Tri (Vite :5173)
echo ========================================================
echo.
echo [OK] Dang khoi dong Admin Portal tai http://localhost:5173 ...
echo Nhan Ctrl+C de dung Admin Portal.
echo.

call npm run dev

if errorlevel 1 (
  echo.
  echo [LOI] Admin Portal bi dung hoac gap su co.
  pause
)

endlocal
