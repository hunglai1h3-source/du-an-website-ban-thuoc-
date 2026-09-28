# PharmaTrust Data Hub

Phiên bản `1.1.1` — hỗ trợ Windows, Mac Apple Silicon và Mac Intel; sửa lỗi đọc `CORS_ORIGINS` khi khởi động API.

Ứng dụng thu thập, chuẩn hóa, đối chiếu và chấm điểm **độ tin cậy của hồ sơ dữ liệu thuốc**. Hệ thống không bán thuốc, không chẩn đoán, không tư vấn liều và không xác nhận thuốc chính hãng.

## Chức năng đã có

- Đăng nhập JWT, refresh token và phân quyền `ADMIN`, `DATA_REVIEWER`, `VIEWER`.
- Quản lý nguồn dữ liệu và lịch sử tác vụ thu thập.
- Kiểm tra `robots.txt`, giới hạn domain, tốc độ và chặn SSRF.
- Nhập CSV, XLSX, JSON, PDF, PNG và JPG.
- OCR tiếng Việt/Anh trong Docker bằng Tesseract.
- Ollama structured extraction với parser dự phòng khi Ollama không sẵn sàng.
- Chuẩn hóa tên, số đăng ký, hàm lượng và đơn vị.
- Ghép sản phẩm bằng số đăng ký, RapidFuzz, hoạt chất, hàm lượng và nhà sản xuất.
- Rule engine, hard rules và điểm tin cậy phiên bản `1.0`.
- Hàng chờ ứng viên, trung tâm mâu thuẫn và lịch sử điểm.
- Bằng chứng theo từng trường dữ liệu.
- Audit log bất biến từ giao diện.
- Public API chỉ xuất dữ liệu thật đã đạt điều kiện.
- Xuất CSV, XLSX và JSON.
- Dashboard responsive và bộ dữ liệu demo 20 sản phẩm.
- Docker Compose, bộ chạy Windows/macOS, backup/restore và test tự động.

## Chạy nhanh bằng Docker

Yêu cầu: Docker Desktop đang chạy.

```bash
docker compose up --build
```

Mở:

- Giao diện: http://localhost:5173
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health

Trên Windows có thể chạy `start-windows.bat`. Lần đầu nên chạy `setup-windows.ps1` bằng PowerShell.

### Chạy trên macOS

PharmaTrust hỗ trợ cả Mac Apple Silicon và Mac Intel. Hãy cài đúng bản Docker Desktop cho chip của máy, mở Docker Desktop và chờ Docker Engine chạy.

Lần đầu:

1. Bấm đúp `setup-macos.command` để kiểm tra máy, tạo `.env` với khóa bí mật ngẫu nhiên và build ứng dụng.
2. Bấm đúp `start-macos.command`; script sẽ khởi động các dịch vụ và mở giao diện.
3. Khi muốn dừng, bấm đúp `stop-macos.command`. Dữ liệu trong Docker volume vẫn được giữ.

Nếu macOS chặn quyền chạy sau khi giải nén, mở Terminal tại thư mục dự án và chạy một lần:

```bash
chmod +x setup-macos.command start-macos.command stop-macos.command
```

Sau đó chạy:

```bash
./setup-macos.command
./start-macos.command
```

Không cần cài riêng Python, Node.js, PostgreSQL hoặc Redis khi chạy bằng Docker.

`docker compose up --build` mặc định đọc `.env.example` để có thể khởi động ngay. Khi cấu hình thật:

1. Sao chép `.env.example` thành `.env`.
2. Đổi `SECRET_KEY` thành chuỗi ngẫu nhiên dài.
3. Chạy với biến `ENV_FILE=.env` hoặc dùng script Windows.

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@pharmatrust.vn` | `Admin@123456` |
| Data reviewer | `reviewer@pharmatrust.vn` | `Reviewer@123456` |
| Viewer | `viewer@pharmatrust.vn` | `Viewer@123456` |

Phải đổi hoặc xóa các tài khoản này trước khi triển khai thật.

## Chạy phát triển không dùng Docker

Backend yêu cầu Python 3.11 hoặc 3.12:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements-dev.txt
export PYTHONPATH=apps/api
alembic -c apps/api/alembic.ini upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

Windows PowerShell dùng `$env:PYTHONPATH="apps/api"` thay cho `export`.

Frontend:

```bash
cd apps/web
npm install
npm run dev
```

Chế độ local dùng SQLite mặc định. Worker yêu cầu Redis:

```bash
PYTHONPATH=apps/api celery -A app.tasks.celery_app:celery worker --loglevel=INFO
```

## Cấu hình Ollama

1. Cài Ollama và kéo mô hình:

```bash
ollama pull qwen2.5:3b
```

2. Đặt trong `.env`:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5:3b
```

Nếu Ollama không sẵn sàng, OCR vẫn chạy và hệ thống tự dùng parser quy tắc. Metadata lưu rõ `fallback_used`, model và prompt hash; không giả vờ rằng LLM đã xử lý thành công.

Trên Docker Desktop cho Windows và macOS, `host.docker.internal` cho phép container kết nối đến Ollama đang chạy trên máy chủ. Trên Mac Apple Silicon, nên cài bản Ollama dành cho Apple Silicon và dùng mô hình phù hợp với dung lượng RAM.

## Nhập dữ liệu

Mẫu nằm tại `data/samples/products_demo.csv`. Các tên cột được nhận diện:

- `name`, `product_name`, `ten_thuoc`, `tên thuốc`
- `registration_number`, `so_dang_ky`, `số đăng ký`, `sdk`
- `manufacturer`, `nha_san_xuat`, `nhà sản xuất`
- `ingredients`, `hoat_chat`, `hoạt chất`
- `dosage_form`, `dang_bao_che`, `dạng bào chế`
- `package`, `quy_cach`, `quy cách`
- `rx_otc`, `phan_loai`, `phân loại`

Dữ liệu vừa nhập chỉ tạo `ProductCandidate`; không tự động xuất hiện trên Public API.

## Public API

Public API không yêu cầu token:

```text
GET /api/v1/public/products
GET /api/v1/public/products/{id}
GET /api/v1/public/search?q=...
```

Điều kiện xuất bản:

- Không phải dữ liệu demo.
- Điểm tối thiểu 85.
- Nhãn `HIGH_OFFICIAL_MATCH`.
- Không bị hard rule chặn.
- Trạng thái `PUBLISHED`.

## Kiểm thử

```bash
PYTHONPATH=apps/api pytest apps/api/tests -q --cov=apps/api/app
cd apps/web && npm run build
```

## Backup và restore

```bash
bash scripts/backup.sh
bash scripts/restore.sh backups/pharmatrust_YYYYMMDD_HHMMSS.sql
```

## Tài liệu

- [Kiến trúc](docs/ARCHITECTURE.md)
- [Công thức điểm và hard rules](docs/SCORING.md)
- [Chính sách nguồn](docs/SOURCE_POLICY.md)
- [Bảo mật](docs/SECURITY.md)
- [Xử lý lỗi](docs/TROUBLESHOOTING.md)

## Giới hạn quan trọng

- Generic HTML adapter chỉ tạo ứng viên có confidence thấp. Muốn khai thác một nguồn thật cần adapter riêng dựa trên cấu trúc và quyền truy cập hợp lệ.
- Không có kết quả crawler nào được coi là bằng chứng về hàng thật.
- `DATA_REVIEWER` chỉ kiểm tra dữ liệu, không phải dược sĩ.
- Rule engine không thay thế người chịu trách nhiệm chuyên môn khi thương mại hóa.
- Dữ liệu demo hoàn toàn hư cấu và luôn bị Public API loại bỏ.
