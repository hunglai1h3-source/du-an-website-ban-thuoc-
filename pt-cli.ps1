# PharmaTrust Data Hub - PowerShell CLI Helper
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$env:PYTHONPATH = "$ScriptDir\apps\api;$($env:PYTHONPATH)"
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

$pythonExe = "$ScriptDir\.venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "[THONG BAO] Dang tao moi truong ao .venv..." -ForegroundColor Yellow
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
        Write-Host "[LOI] Khong tim thay Python runtime tren may." -ForegroundColor Red
        exit 1
    }
    Invoke-Expression "$pyCmd -m venv `"$ScriptDir\.venv`""
    & "$ScriptDir\.venv\Scripts\pip.exe" install -r "$ScriptDir\apps\api\requirements.txt"
}

& $pythonExe -m app.cli @args
