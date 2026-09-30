[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location $PSScriptRoot

& "$PSScriptRoot\run-web.ps1"
