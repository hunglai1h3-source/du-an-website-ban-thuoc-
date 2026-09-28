# Xử lý lỗi thường gặp

## Docker không chạy trên Windows

- Mở Docker Desktop.
- Bật WSL 2.
- Chạy `docker version` và `docker compose version`.
- Chạy lại `setup-windows.ps1`.

## Docker hoặc file `.command` không chạy trên macOS

- Kiểm tra đã cài đúng Docker Desktop cho Apple Silicon hoặc Intel.
- Mở Docker Desktop và chờ Docker Engine chạy, sau đó kiểm tra `docker version` và `docker compose version`.
- Nếu macOS báo không có quyền thực thi, chạy:

```bash
chmod +x setup-macos.command start-macos.command stop-macos.command
```

- Nếu macOS chặn ứng dụng tải từ Internet, vào **System Settings → Privacy & Security** và chỉ cho phép mở khi bạn xác nhận file tải từ gói PharmaTrust này.
- Docker Desktop hiện chỉ hỗ trợ các phiên bản macOS còn trong phạm vi hỗ trợ của Docker. Nếu không cài được, hãy kiểm tra và cập nhật macOS trước.

## Mac Apple Silicon gặp lỗi image hoặc kiến trúc

Các image mặc định của dự án hỗ trợ đa kiến trúc và dự án không ép chạy `linux/amd64`. Không tự thêm `platform: linux/amd64` trừ khi đã xác định một dependency cụ thể không hỗ trợ ARM64, vì giả lập sẽ chậm hơn.

## API thoát với lỗi `error parsing value for field "cors_origins"`

Hãy dùng PharmaTrust `1.1.1` trở lên. Các phiên bản này chấp nhận cả danh sách phân cách bằng dấu phẩy và JSON. Với bản cũ, sửa dòng trong `.env` thành:

```env
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

Sau đó build và khởi động lại:

```bash
docker compose up -d --build
```

## Port đã được sử dụng

Đổi cổng bên trái trong `docker-compose.yml`, ví dụ `5174:80` hoặc `8001:8000`.

## Worker báo không kết nối Redis

```bash
docker compose ps
docker compose logs redis worker
```

## OCR tiếng Việt không hoạt động

Docker image đã cài `tesseract-ocr-vie`. Khi chạy local cần cài Tesseract, gói ngôn ngữ Việt và Poppler riêng.

## Ollama unavailable

Kiểm tra `ollama list`, port 11434 và `OLLAMA_BASE_URL`. Hệ thống sẽ dùng rule-based fallback và ghi lại cảnh báo.

## Không crawl được website

Xem `robots_status` và lỗi trong Crawl Run. Không cố vượt chặn; dùng CSV/XLSX/PDF được cung cấp hợp lệ.

## Reset dữ liệu phát triển

Chỉ dùng cho môi trường demo:

```bash
docker compose down -v
docker compose up --build
```

Lệnh này xóa volume database; hãy backup trước nếu có dữ liệu cần giữ.
