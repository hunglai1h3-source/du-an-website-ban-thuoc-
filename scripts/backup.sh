#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="$project_dir/backups"
mkdir -p "$backup_dir"
backup_file="$backup_dir/pharmatrust_$(date +%Y%m%d_%H%M%S).sql"
docker compose -f "$project_dir/docker-compose.yml" exec -T postgres pg_dump -U pharmatrust pharmatrust > "$backup_file"
echo "Backup created: $backup_file"

