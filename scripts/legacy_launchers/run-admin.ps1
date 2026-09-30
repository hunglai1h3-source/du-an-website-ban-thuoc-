[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location (Join-Path $PSScriptRoot "apps\web")

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PharmaTrust Data Hub - Trang Quan Tri (Vite :5173)    " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Dang khoi dong Admin Portal tai http://localhost:5173 ..." -ForegroundColor Green
Write-Host "Nhan Ctrl+C de dung Admin Portal." -ForegroundColor Gray
Write-Host ""

npm.cmd run dev
