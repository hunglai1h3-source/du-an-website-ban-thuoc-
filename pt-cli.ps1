# PharmaTrust Data Hub - PowerShell CLI Helper
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$env:PYTHONPATH = "$ScriptDir\apps\api;$($env:PYTHONPATH)"
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

$pythonExe = "$ScriptDir\.venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "[THONG BAO] Dang tao moi truong ao .venv..." -ForegroundColor Yellow
    py -3.11 -m venv "$ScriptDir\.venv"
    & "$ScriptDir\.venv\Scripts\pip.exe" install -r "$ScriptDir\apps\api\requirements.txt"
}

& $pythonExe -m app.cli @args
