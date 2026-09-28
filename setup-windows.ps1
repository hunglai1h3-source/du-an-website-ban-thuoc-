[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot

function Pause-And-Exit($exitCode) {
    if ($Host.Name -notlike "*ISE*" -and [Environment]::UserInteractive) {
        Write-Host ""
        Read-Host -Prompt "Nhấn Enter để đóng cửa sổ này..."
    }
    exit $exitCode
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  PharmaTrust Data Hub - Thiết lập môi trường Windows   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiểm tra lệnh docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[LOI] Chưa tìm thấy Docker Desktop hoặc Docker chưa có trong PATH." -ForegroundColor Red
    Write-Host "Vui lòng cài đặt Docker Desktop và kích hoạt WSL 2 backend." -ForegroundColor Yellow
    Write-Host "Tải Docker Desktop tại: https://docs.docker.com/desktop/setup/install/windows-install/" -ForegroundColor Yellow
    Pause-And-Exit 1
}

# 2. Kiểm tra Docker Engine có đang chạy không
$dockerRunning = $false
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "Docker Desktop chưa chạy. Đang thử mở Docker Desktop..." -ForegroundColor Yellow
    $dockerDesktopPath = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktopPath) {
        Start-Process $dockerDesktopPath
    } else {
        Start-Process "Docker Desktop" -ErrorAction SilentlyContinue
    }

    Write-Host "Đang chờ Docker Engine khởi động (tối đa 90 giây)..."
    for ($i = 1; $i -le 45; $i++) {
        Start-Sleep -Seconds 2
        $null = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
            break
        }
        Write-Host "." -NoNewline
    }
    Write-Host ""
}

if (-not $dockerRunning) {
    Write-Host "[LOI] Docker Engine chưa sẵn sàng. Hãy mở Docker Desktop, chờ trạng thái 'Engine running' rồi chạy lại." -ForegroundColor Red
    Pause-And-Exit 1
}

# 3. Tạo file .env nếu chưa có và sinh SECRET_KEY ngẫu nhiên
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    try {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($bytes)
        $secretKey = -join ($bytes | ForEach-Object { "{0:x2}" -f $_ })
        $envContent = Get-Content ".env" -Raw
        $envContent = $envContent -replace "SECRET_KEY=.*", "SECRET_KEY=$secretKey"
        [System.IO.File]::WriteAllText((Join-Path (Get-Location) ".env"), $envContent, [System.Text.Encoding]::UTF8)
        Write-Host "[OK] Đã tạo file .env với SECRET_KEY ngẫu nhiên cho máy này." -ForegroundColor Green
    } catch {
        Write-Host "[CANH BAO] Đã tạo .env nhưng chưa đổi SECRET_KEY ngẫu nhiên." -ForegroundColor Yellow
    }
}

# 4. Kiểm tra cấu hình Docker Compose
Write-Host "Đang kiểm tra cấu hình Docker Compose..." -ForegroundColor Cyan
$env:ENV_FILE = ".env"
docker compose config 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[LOI] Cấu hình Docker Compose không hợp lệ." -ForegroundColor Red
    docker compose config
    Pause-And-Exit 1
}

# 5. Dựng image
Write-Host "Đang tải và dựng các dịch vụ Docker (lần đầu có thể mất vài phút)..." -ForegroundColor Cyan
docker compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[LOI] Quá trình dựng image thất bại." -ForegroundColor Red
    Pause-And-Exit 1
}

Write-Host ""
Write-Host "[OK] Thiết lập Windows hoàn tất." -ForegroundColor Green
Write-Host "Bấm đúp .\start-windows.bat để mở ứng dụng qua Docker." -ForegroundColor Cyan
Write-Host "Hoặc bấm đúp .\run-local.bat để chạy trực tiếp trên Terminal." -ForegroundColor Cyan
Pause-And-Exit 0
