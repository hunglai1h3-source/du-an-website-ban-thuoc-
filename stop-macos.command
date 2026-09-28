#!/bin/bash
set -Eeuo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "[LOI] Không tìm thấy Docker."
  read -r -p "Nhấn Enter để đóng cửa sổ..." _
  exit 1
fi

echo "Đang dừng PharmaTrust Data Hub..."
ENV_FILE=.env docker compose down
echo "[OK] Đã dừng ứng dụng. Dữ liệu vẫn được giữ nguyên."
echo "Lưu ý: không dùng 'docker compose down -v' nếu không muốn xóa dữ liệu."
read -r -p "Nhấn Enter để đóng cửa sổ..." _

