# PharmaTrust Unified Ecosystem Launcher
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         PHARMATRUST UNIFIED ECOSYSTEM - KHOI DONG HE THONG" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  [1] Web Ban Hang Khach Hang:    http://localhost:3000" -ForegroundColor Yellow
Write-Host "  [2] Admin Portal (Cung cong):   http://localhost:3000/admin" -ForegroundColor Yellow
Write-Host "  [3] Admin Doc Lap:              http://localhost:8000" -ForegroundColor Yellow
Write-Host "  [4] API Documentation (Docs):   http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Start Backend & Admin
Write-Host "[1/2] Khoi dong Admin & Backend API (Cong 8000)..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title PharmaTrust Admin :8000 && cd /d `"$PSScriptRoot`" && set PYTHONPATH=$PSScriptRoot\apps\api && .\.venv\Scripts\uvicorn.exe app.main:app --app-dir apps\api --reload --host 0.0.0.0 --port 8000"

# 2. Start Storefront
Write-Host "[2/2] Khoi dong Storefront Web Ban Hang (Cong 3000)..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title PharmaTrust Storefront :3000 && cd /d `"$PSScriptRoot\apps\storefront`" && npm run dev -- -p 3000"

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
Start-Process "http://localhost:3000/admin"

Write-Host "`n[OK] Ca hai he thong dang hoat dong!" -ForegroundColor Green
