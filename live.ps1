# voicev1 - one-shot dev/live launcher
# Frontend  -> localtunnel (port 3000)
# Backend   -> ngrok (port 4000)   <- fast, low-latency for API + WebSocket
#
# Usage: .\live.ps1            -> localtunnel + ngrok
#        .\live.ps1 -Local     -> localhost only
#        .\live.ps1 -Lan       -> same-Wi-Fi multi-device mode (no tunnels)
#
# Stop:    .\stop.ps1

param([switch]$Local, [switch]$Lan)

if ($Lan) { $Local = $true }

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

function Info($m) { Write-Host "[ * ] $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "[ + ] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "[ ! ] $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "[ x ] $m" -ForegroundColor Red }

$lanIp = $null
if ($Lan) {
    $lanIp = (
        Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.IPAddress -notlike "127.*" -and
            $_.IPAddress -notlike "169.254*" -and
            $_.InterfaceAlias -notmatch "vEthernet|Loopback|Docker|WSL"
        } |
        Select-Object -ExpandProperty IPAddress -First 1
    )

    if (-not $lanIp) {
        Fail "Could not detect a LAN IPv4 address. Run -Local or connect to Wi-Fi and retry."
        exit 1
    }
    Ok "LAN mode enabled (share URL will be http://$($lanIp):3000)"
}

# --- 0. Pre-flight --------------------------------------------------------
Info "checking prerequisites..."
foreach ($cmd in "docker","node","npm") {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Fail "$cmd is not on PATH."; exit 1
    }
}
if (-not $Local) {
    if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
        Fail "ngrok is not on PATH."; exit 1
    }
    if (-not (Get-Command lt -ErrorAction SilentlyContinue)) {
        Info "installing localtunnel..."
        npm install -g localtunnel --no-audit --no-fund | Out-Null
    }
    $ngrokGlobal = "$env:LOCALAPPDATA\ngrok\ngrok.yml"
    $hasToken = (Test-Path $ngrokGlobal) -and ((Get-Content $ngrokGlobal -Raw) -match 'authtoken')
    if (-not $hasToken) {
        Warn "ngrok authtoken missing."
        $tok = Read-Host "    paste it (or Enter for -Local)"
        if ($tok) { ngrok config add-authtoken $tok | Out-Null } else { $Local = $true }
    }
}

# --- 1. Stop old processes ------------------------------------------------
Info "stopping any old voicev1 processes..."
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

$procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue
foreach ($p in $procs) {
    if (-not $p.CommandLine) { continue }
    $cl = $p.CommandLine
    if ($cl -match "voicev1" -or
        $cl -match "start-localtunnel" -or
        $cl -match "localtunnel" -or
        $cl -match "nest start" -or
        $cl -match "next dev" -or
        $cl -match "next-server") {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

foreach ($port in 3000,4000) {
    $c = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($c) {
        $c | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } |
            ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    }
}
Remove-Item "$root\.lt.url" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# --- 2. Infra -------------------------------------------------------------
Info "starting postgres + redis..."
docker compose up -d postgres redis | Out-Null
Ok "infra running"

Info "waiting for postgres..."
for ($i = 0; $i -lt 30; $i++) {
    $st = docker inspect -f "{{.State.Health.Status}}" voicev1-postgres 2>$null
    if ($st -eq "healthy") { Ok "postgres healthy"; break }
    Start-Sleep -Seconds 1
}

# --- 3. Deps + prisma -----------------------------------------------------
if (-not (Test-Path "$root\backend\node_modules")) {
    Info "installing backend deps..."
    Push-Location "$root\backend"; npm install --no-audit --no-fund | Out-Null; Pop-Location
}
if (-not (Test-Path "$root\frontend\node_modules")) {
    Info "installing frontend deps..."
    Push-Location "$root\frontend"; npm install --no-audit --no-fund | Out-Null; Pop-Location
}

Info "syncing database schema..."
Push-Location "$root\backend"
$ErrorActionPreference = "Continue"
& npx prisma db push --skip-generate --accept-data-loss *> $null
& npx prisma generate *> $null
$ErrorActionPreference = "Stop"
Pop-Location
Ok "database ready"

# --- 4. Tunnels -----------------------------------------------------------
$frontendUrl = "http://localhost:3000"
$backendUrl  = "http://localhost:4000"
$publicIp    = $null

if (-not $Local) {
    # 4a. ngrok for backend (port 4000) - fast for API + websocket
    Info "starting ngrok for backend on :4000..."
    $globalCfg = "$env:LOCALAPPDATA\ngrok\ngrok.yml"
    Start-Process -FilePath "ngrok" `
        -ArgumentList "start","--all","--config","ngrok.yml","--config","`"$globalCfg`"" `
        -WindowStyle Hidden | Out-Null

    $tunnels = $null
    for ($i = 0; $i -lt 25; $i++) {
        Start-Sleep -Seconds 1
        try {
            $tunnels = (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2).tunnels
            if ($tunnels -and $tunnels.Count -ge 1) { break }
        } catch { }
    }
    if (-not $tunnels) {
        Fail "ngrok did not start. Check http://localhost:4040"; exit 1
    }
    $backendUrl = ($tunnels | Where-Object { $_.name -like "api*" } | Select-Object -First 1).public_url
    Ok "backend  -> $backendUrl"

    # 4b. localtunnel for frontend (port 3000)
    Info "starting localtunnel for frontend on :3000..."
    $ltUrlFile = "$root\.lt.url"
    Remove-Item $ltUrlFile -ErrorAction SilentlyContinue
    Start-Process -FilePath "node" `
        -ArgumentList "$root\scripts\start-localtunnel.js","3000","$ltUrlFile" `
        -WindowStyle Hidden | Out-Null

    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path $ltUrlFile) {
            $frontendUrl = (Get-Content $ltUrlFile -Raw).Trim()
            if ($frontendUrl -like "https://*") { break }
        }
    }
    if ($frontendUrl -notlike "https://*") {
        Fail "localtunnel did not start in time."
        exit 1
    }
    Ok "frontend -> $frontendUrl"

    # fetch public IP (used as localtunnel "password" on first browser visit)
    try {
        $publicIp = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5).Trim()
    } catch {
        try { $publicIp = (Invoke-RestMethod -Uri "https://loca.lt/mytunnelpassword" -TimeoutSec 5).Trim() }
        catch { $publicIp = "(check https://loca.lt/mytunnelpassword)" }
    }
}

# --- 5. Env files ---------------------------------------------------------
Info "writing env files..."
$envPath = "$root\backend\.env"
$envBody = Get-Content $envPath -Raw

if ($Local) {
    if ($Lan -and $lanIp) {
        $frontendUrl = "http://$($lanIp):3000"
        $envBody = $envBody -replace 'FRONTEND_ORIGIN=.*', "FRONTEND_ORIGIN=$frontendUrl,http://localhost:3000"
        $envBody = $envBody -replace 'COOKIE_SECURE=.*',   'COOKIE_SECURE=false'
        $envBody = $envBody -replace 'COOKIE_DOMAIN=.*',   'COOKIE_DOMAIN='
    } else {
        $envBody = $envBody -replace 'FRONTEND_ORIGIN=.*', 'FRONTEND_ORIGIN=http://localhost:3000'
        $envBody = $envBody -replace 'COOKIE_SECURE=.*',   'COOKIE_SECURE=false'
        $envBody = $envBody -replace 'COOKIE_DOMAIN=.*',   'COOKIE_DOMAIN=localhost'
    }
} else {
    $envBody = $envBody -replace 'FRONTEND_ORIGIN=.*', "FRONTEND_ORIGIN=$frontendUrl,http://localhost:3000"
    $envBody = $envBody -replace 'COOKIE_SECURE=.*',   'COOKIE_SECURE=true'
    $envBody = $envBody -replace 'COOKIE_DOMAIN=.*',   'COOKIE_DOMAIN='
}
Set-Content $envPath $envBody -NoNewline

$feEnv = if ($Local) {
@"
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WS_URL=
"@
} else {
@"
NEXT_PUBLIC_API_URL=$backendUrl/api
NEXT_PUBLIC_WS_URL=$backendUrl
"@
}
Set-Content "$root\frontend\.env.local" $feEnv -NoNewline
Ok "env files updated"

# --- 6. Backend + frontend ------------------------------------------------
Info "launching backend..."
Start-Process -FilePath "powershell" `
    -ArgumentList "-NoExit","-Command","cd '$root\backend'; npm run start:dev" | Out-Null
Info "launching frontend..."
$frontendDevCmd = if ($Lan) { "cd '$root\frontend'; npm run dev -- -H 0.0.0.0 -p 3000" } else { "cd '$root\frontend'; npm run dev" }
Start-Process -FilePath "powershell" `
    -ArgumentList "-NoExit","-Command",$frontendDevCmd | Out-Null

# --- 7. Wait --------------------------------------------------------------
Info "waiting for backend on :4000..."
$backendReady = $false
for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Seconds 1
    try {
        Invoke-WebRequest -Uri "http://localhost:4000/api/auth/me" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop | Out-Null
        $backendReady = $true; break
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) { $backendReady = $true; break }
    }
}
if ($backendReady) { Ok "backend up" } else { Warn "backend not responding" }

Info "waiting for frontend on :3000..."
$frontendReady = $false
for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing
        if ($r.StatusCode -lt 500) { $frontendReady = $true; break }
    } catch { }
}
if ($frontendReady) { Ok "frontend up" } else { Warn "frontend not responding" }

# --- 8. Done --------------------------------------------------------------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host " voicev1 is LIVE" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " share this URL:  $frontendUrl" -ForegroundColor White
if ($Lan) {
    Write-Host " LAN mode: keep both devices on the same Wi-Fi/LAN network." -ForegroundColor DarkGray
}
if (-not $Local) {
    Write-Host " backend (api):   $backendUrl" -ForegroundColor DarkGray
    Write-Host " ngrok dashboard: http://localhost:4040" -ForegroundColor DarkGray
    if ($publicIp) {
        Write-Host ""
        Write-Host " IMPORTANT: localtunnel first-visit gate" -ForegroundColor Yellow
        Write-Host " --------------------------------------" -ForegroundColor Yellow
        Write-Host " First time you (or anyone) open the frontend URL in a browser, loca.lt shows" -ForegroundColor Yellow
        Write-Host " a 'Click to Submit' page asking for the tunnel password = this PC's public IP:" -ForegroundColor Yellow
        Write-Host "   $publicIp" -ForegroundColor White
        Write-Host " Paste that, click submit, then sign up normally." -ForegroundColor Yellow
    }
}
Write-Host ""
Write-Host " to stop everything: .\stop.ps1" -ForegroundColor DarkGray
Write-Host ""
Start-Process $frontendUrl
