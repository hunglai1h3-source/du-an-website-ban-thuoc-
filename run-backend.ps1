[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PharmaTrust Data Hub - Backend (FastAPI / Uvicorn)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Test-Path ".venv")) {
    Write-Host "[THÔNG BÁO] Đang tạo môi trường ảo Python .venv..." -ForegroundColor Yellow
    py -3.11 -m venv .venv
    & .\.venv\Scripts\pip.exe install -r apps\api\requirements.txt
}

$pthFile = Join-Path $PSScriptRoot ".venv\Lib\site-packages\pharmatrust.pth"
if (-not (Test-Path $pthFile)) {
    (Join-Path $PSScriptRoot "apps\api") | Out-File -FilePath $pthFile -Encoding ascii
}

$apiDir = Join-Path $PSScriptRoot "apps\api"
$env:PYTHONPATH = "$apiDir;$($env:PYTHONPATH)"
$env:PYTHONUTF8 = "1"

if (-not (Test-Path "pharmatrust.db")) {
    Write-Host "[THÔNG BÁO] Đang khởi tạo cơ sở dữ liệu SQLite và dữ liệu demo..." -ForegroundColor Yellow
    & .\.venv\Scripts\python.exe -m app.seed
}

Write-Host ""
Write-Host "[OK] Đang khởi động Backend tại http://0.0.0.0:8000 ..." -ForegroundColor Green
Write-Host "API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "Nhấn Ctrl+C để dừng Backend." -ForegroundColor Gray
Write-Host ""

& .\.venv\Scripts\uvicorn.exe app.main:app --app-dir $apiDir --reload --host 0.0.0.0 --port 8000
