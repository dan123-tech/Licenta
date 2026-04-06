#!/usr/bin/env bash
# FleetShare Docker installer (download from /download). Same logic as scripts/install-server.sh.
# Save beside docker-compose.yml or keep inside the repo; then: chmod +x fleetshare-docker-install.sh && ./fleetshare-docker-install.sh
#
# Options: --help  --down  --no-build  --pull  --ai-validator
set -euo pipefail

AI_VALIDATOR_REPO="https://github.com/dan123-tech/AI_driving-licence.git"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "$SCRIPT_DIR/../docker-compose.yml" ]]; then
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
elif [[ -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
  ROOT="$SCRIPT_DIR"
else
  echo "Could not find docker-compose.yml next to this script or one directory above."
  echo "Run from the FleetShare project root, or put this file beside docker-compose.yml."
  exit 1
fi
cd "$ROOT"

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[0;33m'
CYA='\033[0;36m'
DIM='\033[0;90m'
RST='\033[0m'
if [[ ! -t 1 ]]; then RED= GRN= YLW= CYA= DIM= RST=; fi

usage() {
  cat <<'EOF'
FleetShare — Docker Compose installer (Linux / macOS)

Options:
  -h, --help      Show this help
  --down          Stop containers (docker compose down; volumes kept)
  --no-build      Skip image build (only up -d)
  --pull              Pull base images before build
  --ai-validator      Clone/start AI driving-licence validator (Gemini) beside this project
EOF
  exit 0
}

DO_DOWN=false
DO_BUILD=true
DO_PULL=false
DO_AI_VALIDATOR=false
for arg in "$@"; do
  case "$arg" in
    -h|--help) usage ;;
    --down) DO_DOWN=true ;;
    --no-build) DO_BUILD=false ;;
    --pull) DO_PULL=true ;;
    --ai-validator) DO_AI_VALIDATOR=true ;;
    *) echo -e "${RED}Unknown option: $arg${RST}"; usage ;;
  esac
done

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo -e "${RED}Missing command: $1${RST}"; exit 1; }
}

resolve_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif docker-compose version >/dev/null 2>&1; then
    echo "docker-compose"
  else
    echo -e "${RED}Docker Compose not found. Install the Docker Compose V2 plugin.${RST}" >&2
    exit 1
  fi
}

COMPOSE_CMD=""
compose() {
  # shellcheck disable=SC2086
  $COMPOSE_CMD "$@"
}

echo -e "${CYA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo -e "${CYA}  FleetShare — Docker installer${RST}"
echo -e "${CYA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"

need_cmd docker
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}Docker daemon is not running or you lack permission.${RST}"
  echo "Start Docker (Desktop / service) or run: sudo usermod -aG docker \"\$USER\" (then re-login)."
  exit 1
fi

COMPOSE_CMD="$(resolve_compose)"
echo -e "${DIM}Using:${RST} $COMPOSE_CMD"

if [[ "$DO_DOWN" == true ]]; then
  echo -e "${YLW}==>${RST} Stopping stack (docker compose down)…"
  compose down
  echo -e "${GRN}Stopped.${RST} Data volumes are kept (add -v to compose down manually to wipe DB)."
  exit 0
fi

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    echo -e "${YLW}==>${RST} Created ${GRN}.env${RST} from .env.example"
  else
    echo -e "${RED}No .env or .env.example. Create .env with at least AUTH_SECRET (32+ chars).${RST}"
    exit 1
  fi
fi

if grep -qE '^[[:space:]]*AUTH_SECRET[[:space:]]*=' .env 2>/dev/null; then
  secret_line=$(grep -E '^[[:space:]]*AUTH_SECRET[[:space:]]*=' .env | head -1 | sed 's/^[^=]*=//' | tr -d '"' | tr -d "'")
  secret_len=${#secret_line}
  if [[ "$secret_len" -lt 32 ]]; then
    echo -e "${YLW}⚠ AUTH_SECRET should be at least 32 characters (currently ~${secret_len}). Login may fail with 503.${RST}"
    echo -e "${DIM}  Generate: openssl rand -base64 32${RST}"
  fi
else
  echo -e "${YLW}⚠ No AUTH_SECRET= line found in .env — set it before using the app.${RST}"
fi

echo -e "${DIM}Note: docker-compose.yml sets DATABASE_URL for the app container to @db:5432.${RST}"
echo -e "${DIM}Host tools (Prisma on your PC) should use localhost:5432 in DATABASE_URL.${RST}"
echo ""

if [[ "$DO_PULL" == true ]]; then
  echo -e "${CYA}==>${RST} Pulling base images…"
  compose pull --ignore-buildable || true
fi

if [[ "$DO_BUILD" == true ]]; then
  echo -e "${CYA}==>${RST} Building application image (this may take several minutes)…"
  compose build --no-cache app
fi

echo -e "${CYA}==>${RST} Starting db, app, caddy…"
compose up -d

echo ""
echo -e "${GRN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo -e "${GRN}  Stack is up${RST}"
echo -e "${GRN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo -e "  App:    ${CYA}http://localhost:3000${RST}  (or http://THIS_SERVER_IP:3000)"
echo -e "  HTTPS:  ${CYA}https://localhost:8443${RST}  if Caddy + deploy/certs are configured"
echo ""
echo -e "${DIM}Next:${RST}"
echo "  • Edit .env: NEXT_PUBLIC_APP_URL, NEXTAUTH_URL, SMTP or RESEND, EMAIL_FROM"
echo "  • Rebuild app after URL change: $COMPOSE_CMD build --no-cache app && $COMPOSE_CMD up -d app"
echo "  • Logs: $COMPOSE_CMD logs -f app"
echo "  • Stop:  ./fleetshare-docker-install.sh --down"
echo "  • Driving licence AI: https://github.com/dan123-tech/AI_driving-licence — add --ai-validator to this script"
echo ""

if [[ "$DO_AI_VALIDATOR" == true ]]; then
  echo -e "${CYA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
  echo -e "${CYA}  AI driving-licence validator (Gemini)${RST}"
  echo -e "${CYA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
  PARENT="$(cd "$(dirname "$ROOT")" && pwd)"
  AI_DIR="$PARENT/AI_driving-licence"
  if ! command -v git >/dev/null 2>&1; then
    echo -e "${RED}git not found. Install git, then:${RST}"
    echo "  git clone $AI_VALIDATOR_REPO \"$AI_DIR\""
    echo "  cd \"$AI_DIR\" && docker compose up -d --build"
    exit 1
  fi
  if [[ ! -f "$AI_DIR/docker-compose.yml" ]]; then
    echo -e "${CYA}==>${RST} Cloning validator into ${DIM}$AI_DIR${RST}…"
    git clone --depth 1 "$AI_VALIDATOR_REPO" "$AI_DIR"
  else
    echo -e "${DIM}Validator folder exists: $AI_DIR (skipping clone)${RST}"
  fi
  if [[ ! -f "$AI_DIR/.env" ]]; then
    if [[ -f "$AI_DIR/.env.example" ]]; then
      cp "$AI_DIR/.env.example" "$AI_DIR/.env"
      echo -e "${YLW}==>${RST} Created ${GRN}$AI_DIR/.env${RST} — set ${YLW}GEMINI_API_KEY${RST} for validation to work."
    else
      echo -e "${YLW}⚠ Create $AI_DIR/.env with GEMINI_API_KEY (see repo README).${RST}"
    fi
  fi
  echo -e "${CYA}==>${RST} Building & starting validator (port 8080)…"
  ( cd "$AI_DIR" && $COMPOSE_CMD up -d --build )
  echo ""
  echo -e "${GRN}Validator:${RST} ${CYA}http://localhost:8080/health${RST}"
  echo -e "${DIM}Stop: cd \"$AI_DIR\" && $COMPOSE_CMD down${RST}"
  echo ""
fi
