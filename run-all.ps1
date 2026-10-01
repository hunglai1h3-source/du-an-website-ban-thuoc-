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

$nodeDir = if (Test-Path "C:\Program Files\nodejs") { "C:\Program Files\nodejs" } elseif (Test-Path "$env:LOCALAPPDATA\Programs\nodejs") { "$env:LOCALAPPDATA\Programs\nodejs" } else { "C:\Users\AD\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.20_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v20.20.2-win-x64" }
$pyDir = if (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python311") { "$env:LOCALAPPDATA\Programs\Python\Python311" } else { "C:\Users\AD\AppData\Local\Programs\Python\Python311" }
$pyScripts = "$pyDir\Scripts"

if ($env:Path -notlike "*$nodeDir*") { $env:Path = "$nodeDir;$env:Path" }
if ($env:Path -notlike "*$pyDir*") { $env:Path = "$pyDir;$pyScripts;$env:Path" }

# Dam bao CSDL SQLite da duoc khoi tao
if (-not (Test-Path "$PSScriptRoot\pharmatrust.db")) {
    Write-Host "[THONG BAO] Khoi tao co so du lieu ban dau..." -ForegroundColor Yellow
    $env:PYTHONPATH = "$PSScriptRoot\apps\api"
    & "$PSScriptRoot\.venv\Scripts\python.exe" -m app.seed
}

# 1. Start Backend & Admin
Write-Host "[1/2] Khoi dong Admin & Backend API (Cong 8000)..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title PharmaTrust Admin :8000 && cd /d `"$PSScriptRoot`" && set `"PATH=$pyDir;$pyScripts;%PATH%`" && set PYTHONPATH=$PSScriptRoot\apps\api && `"$PSScriptRoot\.venv\Scripts\python.exe`" -m uvicorn app.main:app --app-dir apps\api --reload --host 0.0.0.0 --port 8000"

# 2. Start Storefront
Write-Host "[2/2] Khoi dong Storefront Web Ban Hang (Cong 3000)..." -ForegroundColor White
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title PharmaTrust Storefront :3000 && cd /d `"$PSScriptRoot\apps\storefront`" && set `"PATH=$nodeDir;%PATH%`" && if exist .next (rd /s /q .next >nul 2>&1) && npm run dev -- -p 3000"

Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host "`n[OK] Ca hai he thong dang hoat dong! Da mo trang web chinh http://localhost:3000" -ForegroundColor Green

