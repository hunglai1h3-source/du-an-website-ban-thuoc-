# Chính sách nguồn dữ liệu

## Thứ tự ưu tiên

1. Cơ quan quản lý dược và công bố pháp lý.
2. Tờ hướng dẫn được phê duyệt.
3. Nhà sản xuất hoặc đơn vị đăng ký.
4. Nhà bán lẻ, chỉ dùng làm quan sát.
5. Tệp nhập thủ công hoặc dữ liệu demo.

## Quy tắc crawler

- Chỉ HTTP/HTTPS công khai.
- Kiểm tra `robots.txt` trước khi discover/fetch.
- Không vượt CAPTCHA, đăng nhập, paywall hoặc chống bot.
- Không chuyển sang domain khác.
- Chặn localhost, private IP, link-local và metadata endpoint.
- Có rate limit, timeout, retry và content hash.
- Không sao chép bài viết/hình ảnh để xuất bản lại.

Nếu không xác minh được quyền truy cập, tác vụ thất bại với lý do rõ ràng và người dùng chuyển sang nhập tệp hợp lệ.

