# Start both FastAPI Backend and Next.js Storefront for local testing
$env:PYTHONPATH = "apps/api"

Write-Host ">>> Starting H4CARE Backend (FastAPI on port 8000)..."
$apiProcess = Start-Process -FilePath ".\.venv\Scripts\python.exe" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -PassThru

Write-Host ">>> Starting H4CARE Storefront (Next.js on port 3000)..."
$webProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory "apps\storefront" -PassThru

Write-Host ">>> Backend PID: $($apiProcess.Id) -> http://127.0.0.1:8000"
Write-Host ">>> Storefront PID: $($webProcess.Id) -> http://localhost:3000"
Write-Host ">>> System ready for testing!"

# Keep alive
try {
    while ($true) {
        Start-Sleep -Seconds 30
    }
} finally {
    Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $webProcess.Id -Force -ErrorAction SilentlyContinue
}
