#!/bin/bash
set -Eeuo pipefail

cd "$(dirname "$0")"

pause_before_exit() {
  if [[ -t 0 ]]; then
    printf "\nNhấn Enter để đóng cửa sổ này..."
    read -r _
  fi
}

trap 'status=$?; if [[ $status -ne 0 ]]; then printf "\n[LOI] Không thể khởi động PharmaTrust (mã lỗi %s).\n" "$status"; pause_before_exit; fi' EXIT

if ! command -v docker >/dev/null 2>&1; then
  echo "[LOI] Chưa cài Docker Desktop."
  echo "Xem hướng dẫn: https://docs.docker.com/desktop/setup/install/mac-install/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Đang mở Docker Desktop..."
  open -a Docker >/dev/null 2>&1 || true
  for _ in {1..45}; do
    if docker info >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
fi

if ! docker info >/dev/null 2>&1; then
  echo "[LOI] Docker Engine chưa sẵn sàng. Hãy mở Docker Desktop và chạy lại."
  exit 1
fi

if [[ ! -f ".env" ]]; then
  echo "Chưa có .env; đang chạy thiết lập lần đầu..."
  "./setup-macos.command"
fi

echo "Đang khởi động PharmaTrust Data Hub..."
ENV_FILE=.env docker compose up -d --build

echo "Đang chờ API sẵn sàng..."
ready=0
for _ in {1..60}; do
  if curl --fail --silent "http://localhost:8000/api/v1/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

ENV_FILE=.env docker compose ps

if [[ "$ready" -eq 1 ]]; then
  echo
  echo "[OK] PharmaTrust đã sẵn sàng."
  echo "Giao diện: http://localhost:5173"
  echo "API docs:  http://localhost:8000/docs"
  open "http://localhost:5173"
else
  echo
  echo "[CANH BAO] Dịch vụ đã được khởi động nhưng API chưa phản hồi sau 120 giây."
  echo "Chạy lệnh sau để xem lỗi: docker compose logs --tail=200"
fi

echo "Các container tiếp tục chạy khi đóng cửa sổ này."
echo "Bấm đúp stop-macos.command khi muốn dừng ứng dụng."
pause_before_exit

