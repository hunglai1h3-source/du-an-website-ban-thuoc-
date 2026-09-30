#!/bin/bash
set -Eeuo pipefail

cd "$(dirname "$0")"

pause_before_exit() {
  if [[ -t 0 ]]; then
    printf "\nNhấn Enter để đóng cửa sổ này..."
    read -r _
  fi
}

trap 'status=$?; if [[ $status -ne 0 ]]; then printf "\n[LOI] Thiết lập chưa hoàn tất (mã lỗi %s).\n" "$status"; pause_before_exit; fi' EXIT

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "[LOI] File này chỉ dành cho macOS."
  exit 1
fi

case "$(uname -m)" in
  arm64|aarch64)
    echo "Đã nhận diện Mac Apple Silicon (M1/M2/M3/M4 hoặc mới hơn)."
    ;;
  x86_64)
    echo "Đã nhận diện Mac dùng chip Intel."
    ;;
  *)
    echo "[LOI] Kiến trúc máy chưa được hỗ trợ: $(uname -m)"
    exit 1
    ;;
esac

if ! command -v docker >/dev/null 2>&1; then
  echo "[LOI] Chưa tìm thấy Docker Desktop."
  echo "Cài đúng bản tại: https://docs.docker.com/desktop/setup/install/mac-install/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop chưa chạy. Đang thử mở Docker..."
  open -a Docker >/dev/null 2>&1 || true

  for _ in {1..45}; do
    if docker info >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
fi

if ! docker info >/dev/null 2>&1; then
  echo "[LOI] Docker Engine chưa sẵn sàng. Hãy mở Docker Desktop, chờ trạng thái Running rồi chạy lại."
  exit 1
fi

if [[ ! -f ".env" ]]; then
  cp ".env.example" ".env"
  if command -v openssl >/dev/null 2>&1; then
    secret_key="$(openssl rand -hex 32)"
    sed -i '' "s|^SECRET_KEY=.*|SECRET_KEY=${secret_key}|" ".env"
  fi
  echo "Đã tạo file .env dành riêng cho máy này."
fi

echo "Đang kiểm tra cấu hình Docker Compose..."
ENV_FILE=.env docker compose config >/dev/null

echo "Đang tải và dựng các dịch vụ. Lần đầu có thể mất vài phút..."
ENV_FILE=.env docker compose build

echo
echo "[OK] Thiết lập macOS hoàn tất."
echo "Bấm đúp start-macos.command để khởi động PharmaTrust."
pause_before_exit

