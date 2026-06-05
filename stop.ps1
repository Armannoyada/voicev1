# Kills every process tied to voicev1: ngrok, localtunnel, nest watch, npm, next.

Write-Host "stopping ngrok..." -ForegroundColor Cyan
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "stopping all voicev1 node processes..." -ForegroundColor Cyan
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

Write-Host "killing anything still bound to :3000 / :4000..." -ForegroundColor Cyan
foreach ($port in 3000, 4000) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | Select-Object -ExpandProperty OwningProcess -Unique |
            Where-Object { $_ -gt 0 } |
            ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    }
}

Remove-Item "C:\Users\CFGFLR2.0\Documents\GitHub\voicev1\.lt.url" -ErrorAction SilentlyContinue
Remove-Item "C:\Users\CFGFLR2.0\Documents\GitHub\voicev1\.lt.log" -ErrorAction SilentlyContinue
Remove-Item "C:\Users\CFGFLR2.0\Documents\GitHub\voicev1\.lt.err" -ErrorAction SilentlyContinue

Write-Host "stopping postgres + redis containers..." -ForegroundColor Cyan
docker compose stop postgres redis 2>$null | Out-Null

Write-Host "done." -ForegroundColor Green
