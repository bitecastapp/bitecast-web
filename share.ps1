# Share Nomrank with testers at https://beta.bitecast.in, served from this PC through the Cloudflare tunnel "bitecast".
#
#   .\share.ps1          start the app and the tunnel (Ctrl+C stops both)
#   .\share.ps1 -Build   rebuild first; do this after pulling or changing code
#
# Stop `pnpm dev` before running: both use port 3000, and building while dev runs leaves dev with stale files.
param([switch]$Build)
$ErrorActionPreference = "Stop"

$web = Join-Path $PSScriptRoot "apps\web"
$cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"

if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
  throw "Port 3000 is already in use (is pnpm dev running?). Stop it, then run this again."
}
if ($Build -or -not (Test-Path (Join-Path $web ".next\BUILD_ID"))) {
  Push-Location $web
  try {
    pnpm build
    if ($LASTEXITCODE -ne 0) { throw "Build failed." }
  } finally { Pop-Location }
}

$app = Start-Process "pnpm.cmd" -ArgumentList "start", "-p", "3000" -WorkingDirectory $web -NoNewWindow -PassThru
try {
  Write-Host "`nNomrank is live at https://beta.bitecast.in (Ctrl+C to stop)`n" -ForegroundColor Green
  & $cloudflared tunnel run --url http://localhost:3000 bitecast
} finally {
  # pnpm starts node as a child; stop the whole tree so port 3000 is freed.
  taskkill /PID $app.Id /T /F | Out-Null
}
