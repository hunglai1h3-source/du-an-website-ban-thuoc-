@echo off
setlocal
cd /d "%~dp0apps\storefront"

echo ========================================================
echo   H4CARE Pharmacy - Website Khach Hang (Next.js :3000)
echo ========================================================
echo.
echo [OK] Dang khoi dong Storefront tai http://localhost:3000 ...
echo Nhan Ctrl+C de dung Storefront.
echo.

call npm run dev -- -p 3000

if errorlevel 1 (
  echo.
  echo [LOI] Storefront bi dung hoac gap su co.
  pause
)

endlocal
