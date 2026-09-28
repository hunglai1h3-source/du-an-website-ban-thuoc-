# PharmaTrust Unified Ecosystem Launcher
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         PHARMATRUST DATA HUB - KHOI DONG HE THONG" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  [1] Giao dien Web (Vite Dev):   http://localhost:5173" -ForegroundColor Yellow
Write-Host "  [2] Backend & Web SPA (Uvicorn): http://localhost:8000" -ForegroundColor Yellow
Write-Host "  [3] API Documentation (Docs):   http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Start Backend & Admin
Write-Host "[1/2] Khoi dong Backend API & SPA (Cong 8000)..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title PharmaTrust Backend :8000 && cd /d `"$PSScriptRoot`" && set PYTHONPATH=$PSScriptRoot\apps\api && set PYTHONUTF8=1 && set PYTHONIOENCODING=utf-8 && .\.venv\Scripts\uvicorn.exe app.main:app --app-dir apps\api --reload --host 0.0.0.0 --port 8000"

# 2. Start Web Frontend
Write-Host "[2/2] Khoi dong Web Frontend (Cong 5173)..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title PharmaTrust Web :5173 && cd /d `"$PSScriptRoot\apps\web`" && npm run dev"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
Start-Process "http://localhost:8000/docs"

Write-Host "`n[OK] Ca hai he thong dang hoat dong!" -ForegroundColor Green
