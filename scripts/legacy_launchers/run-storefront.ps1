[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location (Join-Path $PSScriptRoot "apps\storefront")

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  H4CARE Pharmacy - Website Khách Hàng (Next.js :3000)  " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Đang khởi động Storefront tại http://localhost:3000 ..." -ForegroundColor Green
Write-Host "Nhấn Ctrl+C để dừng Storefront." -ForegroundColor Gray
Write-Host ""

npm.cmd run dev -- -p 3000
