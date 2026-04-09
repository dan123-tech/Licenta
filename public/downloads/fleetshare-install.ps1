<#
.SYNOPSIS
  FleetShare — Docker installer (download from /download). Same as repo install.ps1.

.DESCRIPTION
  Run from the project folder that contains docker-compose.yml.

.PARAMETER Down
  docker compose down (keeps volumes).

.PARAMETER NoBuild
  Skip docker compose build.

.PARAMETER Pull
  docker compose pull before build.

.PARAMETER Help
  Show help.

.PARAMETER AiValidator
  After FleetShare: clone/start https://github.com/dan123-tech/AI_driving-licence (sibling folder). Requires git.
#>
param(
  [switch]$Down,
  [switch]$NoBuild,
  [switch]$Pull,
  [switch]$AiValidator,
  [switch]$Help
)

$ErrorActionPreference = "Stop"

if ($Help) {
  Get-Help $MyInvocation.MyCommand.Path -Full
  exit 0
}

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Write-Step { param($Msg) Write-Host "==> $Msg" -ForegroundColor Cyan }
function Write-Ok { param($Msg) Write-Host $Msg -ForegroundColor Green }
function Write-Warn { param($Msg) Write-Host $Msg -ForegroundColor Yellow }
function Write-Err { param($Msg) Write-Host $Msg -ForegroundColor Red }

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  FleetShare — Docker installer (Windows)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path (Join-Path $Root "docker-compose.yml"))) {
  Write-Err "docker-compose.yml not found. Put this script in the FleetShare project root."
  exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Err "Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
}

docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Err "Docker daemon is not running. Start Docker Desktop and wait until it is ready."
  exit 1
}

docker compose version 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Err "Docker Compose V2 not available. Enable it in Docker Desktop (Settings)."
  exit 1
}

Write-Host "Using: docker compose" -ForegroundColor DarkGray
Write-Host ""

if ($Down) {
  Write-Step "Stopping stack (docker compose down)…"
  docker compose down
  Write-Ok "Stopped. Volumes kept (database data preserved)."
  exit 0
}

if (-not (Test-Path ".env")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Warn "Created .env from .env.example — set AUTH_SECRET (32+ chars), URLs, email."
  } else {
    Write-Err "No .env or .env.example. Create .env manually."
    exit 1
  }
}

$envLines = Get-Content ".env" -ErrorAction SilentlyContinue
$secretLine = $envLines | Where-Object { $_ -match '^\s*AUTH_SECRET\s*=' } | Select-Object -First 1
if ($secretLine) {
  $val = ($secretLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
  if ($val.Length -lt 32) {
    Write-Warn "AUTH_SECRET should be at least 32 characters (currently $($val.Length)). Login may return 503."
    Write-Host "  Generate (Git Bash): openssl rand -base64 32" -ForegroundColor DarkGray
  }
} else {
  Write-Warn "No AUTH_SECRET= line in .env — set it before using the app."
}

Write-Host "docker-compose.yml uses DATABASE_URL=@db:5432 inside the app container." -ForegroundColor DarkGray
Write-Host ""

if ($Pull) {
  Write-Step "Pulling base images…"
  docker compose pull --ignore-buildable 2>$null
}

if (-not $NoBuild) {
  Write-Step "Building application image (may take several minutes)…"
  docker compose build --no-cache app
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Step "Starting db, app, caddy…"
docker compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Stack is up" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  App:   http://localhost:3000  (or http://THIS_PC_IP:3000)"
Write-Host "  HTTPS: https://localhost:8443  if Caddy + deploy/certs are set"
Write-Host "  DB:    postgresql://postgres:postgres@localhost:5432/company_car_sharing" -ForegroundColor DarkGray
Write-Host "        (Admin can connect using DBeaver / pgAdmin / DataGrip — host=localhost port=5432 user=postgres pass=postgres db=company_car_sharing)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Next:" -ForegroundColor DarkGray
Write-Host "  • Edit .env: NEXT_PUBLIC_APP_URL, NEXTAUTH_URL, SMTP/RESEND, EMAIL_FROM"
Write-Host "  • After URL change: docker compose build --no-cache app; docker compose up -d app"
Write-Host "  • Logs: docker compose logs -f app"
Write-Host "  • Stop: .\fleetshare-install.ps1 -Down"
Write-Host "  • Driving licence AI: https://github.com/dan123-tech/AI_driving-licence — use -AiValidator"
Write-Host ""

if ($AiValidator) {
  $AiValidatorRepo = "https://github.com/dan123-tech/AI_driving-licence.git"
  $Parent = Split-Path -Parent $Root
  $AiDir = Join-Path $Parent "AI_driving-licence"
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  Write-Host "  AI driving-licence validator (Gemini)" -ForegroundColor Cyan
  Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Err "git not found. Install Git for Windows, then: git clone $AiValidatorRepo `"$AiDir`""
    exit 1
  }
  if (-not (Test-Path (Join-Path $AiDir "docker-compose.yml"))) {
    Write-Step "Cloning validator into $AiDir …"
    git clone --depth 1 $AiValidatorRepo $AiDir
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } else {
    Write-Host "Validator folder exists: $AiDir (skipping clone)" -ForegroundColor DarkGray
  }
  if (-not (Test-Path (Join-Path $AiDir ".env"))) {
    $ex = Join-Path $AiDir ".env.example"
    if (Test-Path $ex) {
      Copy-Item $ex (Join-Path $AiDir ".env")
      Write-Warn "Created $AiDir\.env — set GEMINI_API_KEY (see repo README)."
    } else {
      Write-Warn "Create $AiDir\.env with GEMINI_API_KEY."
    }
  }
  Write-Step "Building & starting validator (port 8080)…"
  Push-Location $AiDir
  try {
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } finally {
    Pop-Location
  }
  Write-Host ""
  Write-Host "Validator: http://localhost:8080/health" -ForegroundColor Green
  Write-Host "Stop: cd `"$AiDir`"; docker compose down" -ForegroundColor DarkGray
  Write-Host ""
}
