#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "Usage: scripts/restore.sh /path/to/backup.sql"
  exit 1
fi
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
docker compose -f "$project_dir/docker-compose.yml" exec -T postgres psql -U pharmatrust -d pharmatrust < "$1"
echo "Restore completed."

