# PharmaTrust Data Hub - Run Web App via Python (PowerShell)
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  PharmaTrust Data Hub - Ứng dụng Web chạy trực tiếp bằng Python" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$env:PYTHONPATH = "$ScriptDir\apps\api;$($env:PYTHONPATH)"
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

$pythonExe = "$ScriptDir\.venv\Scripts\python.exe"
$uvicornExe = "$ScriptDir\.venv\Scripts\uvicorn.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "[THONG BAO] Dang tao moi truong ao .venv..." -ForegroundColor Yellow
    py -3.11 -m venv "$ScriptDir\.venv"
    & "$ScriptDir\.venv\Scripts\pip.exe" install -r "$ScriptDir\apps\api\requirements.txt"
}

if (-not (Test-Path "$ScriptDir\pharmatrust.db")) {
    Write-Host "[THONG BAO] Dang khoi tao co so du lieu SQLite..." -ForegroundColor Yellow
    & $pythonExe -m app.seed
}

Write-Host "[OK] Dang khoi dong Web App tai: http://localhost:8000" -ForegroundColor Green
Write-Host "     - Giao dien Web: http://localhost:8000" -ForegroundColor Green
Write-Host "     - Tai lieu API:  http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "[!] Dang mo trinh duyet tu dong..." -ForegroundColor Yellow
Start-Process "http://localhost:8000"

Write-Host ""
Write-Host "Nhan Ctrl+C de tat ung dung." -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

& $uvicornExe app.main:app --app-dir "$ScriptDir\apps\api" --reload --host 0.0.0.0 --port 8000
