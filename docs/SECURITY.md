# Bảo mật

- JWT access 30 phút và refresh 7 ngày.
- Mật khẩu dùng `scrypt` với salt ngẫu nhiên.
- RBAC được kiểm tra tại backend.
- Rate limit riêng cho đăng nhập và Public API.
- Upload giới hạn 20 MB, whitelist phần mở rộng và MIME.
- URL import bị chặn SSRF.
- HTML phải sanitize trước khi bổ sung chức năng preview trực tiếp.
- Secret chỉ đi qua environment.
- Audit lưu người dùng, IP, user-agent, before/after.
- Nginx và API đặt security headers cơ bản.

Trước production cần dùng HTTPS, secret manager, Redis rate limit dùng chung giữa nhiều instance, quét dependency và thay tài khoản demo.

