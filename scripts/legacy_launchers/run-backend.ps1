[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PharmaTrust Data Hub - Backend (FastAPI / Uvicorn)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Test-Path ".venv")) {
    Write-Host "[THÔNG BÁO] Đang tạo môi trường ảo Python .venv..." -ForegroundColor Yellow
    $pyCmd = $null
    if (Get-Command py -ErrorAction SilentlyContinue) {
        foreach ($ver in @("-3.11", "-3.12", "-3.13", "-3.14", "-3")) {
            $null = & py $ver -c "import sys" 2>$null
            if ($LASTEXITCODE -eq 0) { $pyCmd = "py $ver"; break }
        }
    }
    if (-not $pyCmd -and (Get-Command python -ErrorAction SilentlyContinue)) {
        $pyCmd = "python"
    }
    if (-not $pyCmd) {
        Write-Host "[LỖI] Không tìm thấy Python runtime trên máy." -ForegroundColor Red
        exit 1
    }
    Invoke-Expression "$pyCmd -m venv .venv"
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
