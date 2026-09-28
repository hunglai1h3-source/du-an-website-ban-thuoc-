# Điểm tin cậy và hard rules

Điểm đánh giá độ tin cậy của **hồ sơ**, không đánh giá độ an toàn của thuốc.

| Tiêu chí | Điểm tối đa |
|---|---:|
| Số đăng ký khớp nguồn chính thức | 30 |
| Trạng thái OTC từ nguồn chính thức | 20 |
| Hoạt chất và hàm lượng | 20 |
| Nhà sản xuất | 10 |
| Quy cách | 5 |
| Đồng thuận nguồn | 5 |
| Độ mới | 5 |
| Độ đầy đủ | 5 |

Nhãn:

- `85–100`: `HIGH_OFFICIAL_MATCH`
- `60–84`: `REVIEW_REQUIRED`
- `0–59`: `INSUFFICIENT_EVIDENCE`
- `BLOCKED`: hard rule đã chặn

## Hard rules

- Thu hồi, vi phạm chất lượng nghiêm trọng hoặc hết hiệu lực: điểm 0 và chặn.
- Không có số đăng ký hoặc không tìm thấy hồ sơ chính thức: tối đa 40.
- Mâu thuẫn hoạt chất/hàm lượng: tối đa 25 và chặn.
- Chỉ có nguồn nhà bán lẻ: tối đa 59.
- Không xác định OTC: không suy ra đủ điều kiện bán trực tuyến.

Mọi lần tính điểm tạo một `ScoreHistory`. Không sửa lịch sử cũ.

