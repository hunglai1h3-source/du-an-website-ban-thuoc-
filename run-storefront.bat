@echo off
setlocal
cd /d "%~dp0apps\storefront"

echo ========================================================
echo   PharmaTrust / H4CARE - Storefront (Next.js 14)
echo ========================================================
echo.

if not exist node_modules (
  echo [THONG BAO] Dang cai dat thu vien npm cho Storefront...
  call npm.cmd install
)

echo [OK] Dang khoi dong Storefront tai http://localhost:3000 ...
echo Nhan Ctrl+C de dung Storefront.
echo.
call npm.cmd run dev -- -p 3000

if errorlevel 1 (
  echo.
  echo [LOI] Storefront bi dung hoac gap su co.
  pause
)

endlocal
