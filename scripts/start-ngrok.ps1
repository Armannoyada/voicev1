# Starts both ngrok tunnels (api:4000, web:3000) and prints the public URLs
# Usage:  .\scripts\start-ngrok.ps1
# Stop:   Ctrl-C (or close the window)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$config = Join-Path $root "ngrok.yml"

if (-not (Test-Path $config)) {
    Write-Error "ngrok.yml not found at $config"
    exit 1
}

Write-Host ""
Write-Host "Starting ngrok tunnels (api:4000, web:3000)..." -ForegroundColor Cyan
Write-Host "Dashboard will open at http://localhost:4040" -ForegroundColor Cyan
Write-Host ""

$ngrok = Start-Process -FilePath "ngrok" -ArgumentList "start", "--all", "--config", "`"$config`"" -PassThru -WindowStyle Hidden

# wait a few seconds for tunnels to come up
Start-Sleep -Seconds 4

try {
    $tunnels = (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels").tunnels
    $api = ($tunnels | Where-Object { $_.name -like "api*" } | Select-Object -First 1).public_url
    $web = ($tunnels | Where-Object { $_.name -like "web*" } | Select-Object -First 1).public_url

    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host " Tunnels are up" -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host " backend (api): $api"
    Write-Host " frontend (web): $web"
    Write-Host ""
    Write-Host "---- paste into backend/.env ----" -ForegroundColor Yellow
    Write-Host "FRONTEND_ORIGIN=$web"
    Write-Host "COOKIE_SECURE=true"
    Write-Host "COOKIE_DOMAIN="
    Write-Host ""
    Write-Host "---- paste into frontend/.env.local ----" -ForegroundColor Yellow
    Write-Host "NEXT_PUBLIC_API_URL=$api/api"
    Write-Host "NEXT_PUBLIC_WS_URL=$api"
    Write-Host ""
    Write-Host "Then restart backend (npm run start:dev) and frontend (npm run dev)." -ForegroundColor Cyan
    Write-Host "Open $web in two browsers (Chrome + Incognito) to test." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl-C in this window to stop ngrok." -ForegroundColor DarkGray
} catch {
    Write-Warning "Could not query ngrok dashboard. Open http://localhost:4040 manually."
    Write-Warning $_.Exception.Message
}

# keep this script alive so closing the window kills ngrok
Wait-Process -Id $ngrok.Id
