# H4CARE & PharmaTrust Unified Ecosystem Launcher
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         H4CARE & PHARMATRUST - KHOI DONG TOAN BO HE THONG" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  [1] Website Ban Hang Khach Hang (Storefront): http://localhost:3000" -ForegroundColor Yellow
Write-Host "  [2] Trang Quan Tri Du Lieu (Admin Portal):    http://localhost:5173" -ForegroundColor Yellow
Write-Host "  [3] Backend API Server (FastAPI):            http://localhost:8000" -ForegroundColor Yellow
Write-Host "  [4] Tai lieu API He thong (Swagger Docs):    http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Khoi dong Backend FastAPI (Port 8000)
Write-Host "[1/3] Khoi dong Backend API Server (Cong 8000)..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title PharmaTrust Backend :8000 && cd /d `"$PSScriptRoot`" && set PYTHONPATH=$PSScriptRoot\apps\api && set PYTHONUTF8=1 && set PYTHONIOENCODING=utf-8 && .\.venv\Scripts\uvicorn.exe app.main:app --app-dir apps\api --reload --host 0.0.0.0 --port 8000"

# 2. Khoi dong Trang Khach Hang Next.js Storefront (Port 3000)
Write-Host "[2/3] Khoi dong Trang Khach Hang Storefront (Cong 3000)..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title H4Care Storefront :3000 && cd /d `"$PSScriptRoot\apps\storefront`" && npm run dev -- -p 3000"

# 3. Khoi dong Trang Quan Tri Admin Portal Vite (Port 5173)
Write-Host "[3/3] Khoi dong Trang Quan Tri Admin Portal (Cong 5173)..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title PharmaTrust Admin :5173 && cd /d `"$PSScriptRoot\apps\web`" && npm run dev"

Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"
Start-Process "http://localhost:5173"

Write-Host "`n[OK] Toan bo 3 he thong dang hoat dong rieng biet va san sang!" -ForegroundColor Green
