#!/usr/bin/env bash
# FleetShare companion — AI driving-licence validator only (Gemini microservice).
# Source: https://github.com/dan123-tech/AI_driving-licence
# Download from FleetShare /download. Requires Docker + git.
#
# Usage:
#   chmod +x fleetshare-ai-validator-install.sh
#   ./fleetshare-ai-validator-install.sh              # creates ./AI_driving-licence
#   ./fleetshare-ai-validator-install.sh ..           # sibling of current dir (e.g. next to FleetShare repo)
#   ./fleetshare-ai-validator-install.sh --help
#
# Set GEMINI_API_KEY in AI_driving-licence/.env (see repo README). Service listens on :8080.
set -euo pipefail

AI_VALIDATOR_REPO="https://github.com/dan123-tech/AI_driving-licence.git"
REPO_DIR_NAME="AI_driving-licence"

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[0;33m'
CYA='\033[0;36m'
DIM='\033[0;90m'
RST='\033[0m'
if [[ ! -t 1 ]]; then RED= GRN= YLW= CYA= DIM= RST=; fi

usage() {
  cat <<'EOF'
AI driving-licence validator — Docker installer

Usage:
  ./fleetshare-ai-validator-install.sh [PARENT_DIR]

  PARENT_DIR   Folder that will contain AI_driving-licence (default: current directory)

Requires: Docker with Compose V2, git
EOF
  exit 0
}

[[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && usage

PARENT="${1:-.}"
if [[ ! -d "$PARENT" ]]; then
  echo -e "${RED}Not a directory: $PARENT${RST}"
  exit 1
fi
PARENT="$(cd "$PARENT" && pwd)"
AI_DIR="$PARENT/$REPO_DIR_NAME"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo -e "${RED}Missing command: $1${RST}"; exit 1; }
}

resolve_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif docker-compose version >/dev/null 2>&1; then
    echo "docker-compose"
  else
    echo -e "${RED}Docker Compose not found.${RST}" >&2
    exit 1
  fi
}

COMPOSE_CMD="$(resolve_compose)"
compose() { $COMPOSE_CMD "$@"; }

echo -e "${CYA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo -e "${CYA}  AI driving-licence validator (Gemini)${RST}"
echo -e "${CYA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"

need_cmd docker
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}Docker daemon is not running or you lack permission.${RST}"
  exit 1
fi
need_cmd git

echo -e "${DIM}Using:${RST} $COMPOSE_CMD"
echo -e "${DIM}Target:${RST} $AI_DIR"
echo ""

if [[ -f "$AI_DIR/docker-compose.yml" ]]; then
  echo -e "${DIM}Repository folder already exists — skipping clone.${RST}"
else
  echo -e "${CYA}==>${RST} Cloning ${DIM}$AI_VALIDATOR_REPO${RST}…"
  git clone --depth 1 "$AI_VALIDATOR_REPO" "$AI_DIR"
fi

if [[ ! -f "$AI_DIR/.env" ]]; then
  if [[ -f "$AI_DIR/.env.example" ]]; then
    cp "$AI_DIR/.env.example" "$AI_DIR/.env"
    echo -e "${YLW}==>${RST} Created ${GRN}.env${RST} — set ${YLW}GEMINI_API_KEY${RST} (see repo README)."
  else
    echo -e "${YLW}⚠ Create $AI_DIR/.env with GEMINI_API_KEY before validation will work.${RST}"
  fi
fi

echo -e "${CYA}==>${RST} Building & starting (port 8080)…"
( cd "$AI_DIR" && compose up -d --build )

echo ""
echo -e "${GRN}Done.${RST}  ${CYA}http://localhost:8080/health${RST}"
echo -e "${DIM}FleetShare (Docker) expects this on host port 8080 → host.docker.internal:8080${RST}"
echo -e "${DIM}Stop: cd \"$AI_DIR\" && $COMPOSE_CMD down${RST}"
echo ""
