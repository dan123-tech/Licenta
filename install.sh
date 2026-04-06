#!/usr/bin/env bash
# FleetShare — entrypoint for Linux / macOS. Forwards all args to scripts/install-server.sh
# Usage: chmod +x install.sh && ./install.sh [--help] [--down] [--no-build] [--pull] [--ai-validator]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
exec bash "$ROOT/scripts/install-server.sh" "$@"
