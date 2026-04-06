<#
.SYNOPSIS
  AI driving-licence validator (Gemini) — Docker only, for FleetShare.

.DESCRIPTION
  Clones https://github.com/dan123-tech/AI_driving-licence and runs docker compose.
  Download from FleetShare /download. Requires Docker Desktop + git.

.PARAMETER Parent
  Folder that will contain AI_driving-licence (default: current directory).

.PARAMETER Help
  Show help.
#>
param(
  [string]$Parent = ".",
  [switch]$Help
)

$ErrorActionPreference = "Stop"

if ($Help) {
  Get-Help $MyInvocation.MyCommand.Path -Full
  exit 0
}

$AiValidatorRepo = "https://github.com/dan123-tech/AI_driving-licence.git"
$RepoDirName = "AI_driving-licence"

function Write-Step { param($Msg) Write-Host "==> $Msg" -ForegroundColor Cyan }
function Write-Ok { param($Msg) Write-Host $Msg -ForegroundColor Green }
function Write-Warn { param($Msg) Write-Host $Msg -ForegroundColor Yellow }
function Write-Err { param($Msg) Write-Host $Msg -ForegroundColor Red }

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  AI driving-licence validator (Gemini)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $Parent -PathType Container)) {
  Write-Err "Not a directory: $Parent"
  exit 1
}
$ParentFull = (Resolve-Path $Parent).Path
$AiDir = Join-Path $ParentFull $RepoDirName

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Err "Docker not found. Install Docker Desktop."
  exit 1
}
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Err "Docker daemon is not running."
  exit 1
}
docker compose version 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Err "Docker Compose V2 not available."
  exit 1
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Err "git not found. Install Git for Windows."
  exit 1
}

Write-Host "Target: $AiDir" -ForegroundColor DarkGray
Write-Host ""

if (Test-Path (Join-Path $AiDir "docker-compose.yml")) {
  Write-Host "Repository folder already exists — skipping clone." -ForegroundColor DarkGray
} else {
  Write-Step "Cloning $AiValidatorRepo …"
  git clone --depth 1 $AiValidatorRepo $AiDir
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not (Test-Path (Join-Path $AiDir ".env"))) {
  $ex = Join-Path $AiDir ".env.example"
  if (Test-Path $ex) {
    Copy-Item $ex (Join-Path $AiDir ".env")
    Write-Warn "Created .env — set GEMINI_API_KEY (see repo README)."
  } else {
    Write-Warn "Create $AiDir\.env with GEMINI_API_KEY."
  }
}

Write-Step "Building & starting (port 8080)…"
Push-Location $AiDir
try {
  docker compose up -d --build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}

Write-Host ""
Write-Ok "Done. http://localhost:8080/health"
Write-Host "FleetShare Docker uses host.docker.internal:8080" -ForegroundColor DarkGray
Write-Host "Stop: cd `"$AiDir`"; docker compose down" -ForegroundColor DarkGray
Write-Host ""
