[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location (Join-Path $PSScriptRoot "apps\web")

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PharmaTrust Data Hub - Frontend (React / Vite)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "[THÔNG BÁO] Đang cài đặt thư viện npm..." -ForegroundColor Yellow
    npm.cmd install
}

Write-Host ""
Write-Host "[OK] Đang khởi động Frontend tại http://localhost:5173 ..." -ForegroundColor Green
Write-Host "Nhấn Ctrl+C để dừng Frontend." -ForegroundColor Gray
Write-Host ""

npm.cmd run dev
