# Kiến trúc PharmaTrust

```text
React Dashboard
      │ REST/JWT
      ▼
FastAPI ───── PostgreSQL
   │              │
   │ queue        └─ hồ sơ chuẩn, bằng chứng, điểm, audit
   ▼
Redis ── Celery Worker ── Source Adapters / OCR / Ollama
```

## Pipeline

1. Kiểm tra quyền truy cập và `robots.txt`.
2. Lưu `RawDocument` bất biến theo `content_hash`.
3. Parser/OCR/LLM tạo `ProductCandidate`.
4. Normalizer chuẩn hóa tên, đơn vị và số đăng ký.
5. Entity resolver đề xuất ghép với `CanonicalProduct`.
6. Regulatory record được ưu tiên so với nguồn bán lẻ.
7. Conflict detector tạo cảnh báo.
8. Hard rules chạy trước khi gắn nhãn.
9. Score và lịch sử được lưu.
10. Public API áp dụng điều kiện xuất bản một lần nữa.

## Thêm nguồn mới

Tạo class kế thừa `SourceAdapter` trong `app/services/crawler.py` và triển khai:

- `check_access_policy`
- `discover`
- `fetch`
- `parse`
- `normalize`

Không đặt selector của website cụ thể vào `PublicHtmlAdapter`. Mỗi nguồn cần fixture HTML và test parser riêng để phát hiện thay đổi cấu trúc.

## Tính idempotent

Một tài liệu được định danh bởi `source_id + source_url + content_hash`. Nhập hoặc crawl lại cùng phiên bản không tạo candidate mới.

