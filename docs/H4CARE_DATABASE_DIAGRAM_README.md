# H4CARE - DATABASE DIAGRAM & ARCHITECTURAL AUDIT REPORT

Tài liệu kỹ thuật tổng hợp cấu trúc cơ sở dữ liệu thực tế của toàn bộ hệ sinh thái **H4CARE / PharmaTrust**, phục vụ nhập trực tiếp vào [dbdiagram.io](https://dbdiagram.io/) thông qua file DBML: [`H4CARE_DATABASE_DIAGRAM.dbml`](./H4CARE_DATABASE_DIAGRAM.dbml).

---

## 1. TỔNG QUAN HỆ THỐNG CƠ SỞ DỮ LIỆU (DUAL-DATABASE SETUP)

Quá trình audit thực tế mã nguồn (`apps/api`, `apps/storefront`, `alembic`, `prisma`) và file database SQLite xác nhận: **Hệ thống H4CARE hiện đang vận hành theo mô hình Dual-Database (2 cơ sở dữ liệu vật lý riêng biệt)**:

| Phân hệ / Database | Công nghệ ORM | File SQLite (Dev) | Target Production | Số lượng Table | Mục đích chính |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Backend Core Data Hub** | SQLAlchemy 2.0 + Alembic | `pharmatrust.db` (Root) | PostgreSQL | **45** | Master Catalog, Crawler, Kho vận (WMS), Đơn hàng (OMS), Thanh toán, Trust Score, Địa chỉ 2 cấp 2025. |
| **Storefront Customer Portal** | Prisma ORM 5.x | `apps/storefront/prisma/dev.db` | PostgreSQL / SQLite | **10** | Đơn thuốc điện tử (Prescription), Pipeline OCR, LLM Extraction, Deterministic Clinical Safety Engine, Dị ứng. |
| **TỔNG CỘNG HỆ THỐNG** | — | — | — | **55** | Toàn bộ 55 bảng nghiệp vụ thực tế. |

---

## 2. DANH SÁCH BẢNG THEO MODULE & DATABASE NGUỒN

### A. Phân hệ Core API & Data Hub (`pharmatrust.db` - 45 Bảng)

#### Module 1: Auth, Users & Security (2 bảng)
- `users`: Quản lý tài khoản (Admin, Data Reviewer, Viewer, Customer), điểm thưởng loyalty, mật khẩu bcrypt. Hệ thống sử dụng JWT stateless authentication (không duy trì bảng session).
- `audit_logs`: Nhật ký kiểm toán bảo mật, ghi lại snapshot trước/sau (JSON), IP, User Agent của mọi thao tác quản trị.

#### Module 2: Product & Drug Master Catalog (7 bảng)
- `canonical_products`: Danh mục thuốc chuẩn hóa trung tâm (Số đăng ký, dạng bào chế, hoạt chất, quy cách, chỉ định, Trust Score 0-100, AI Category classification).
- `ingredients`: Từ điển chuẩn hóa tên hoạt chất dược học.
- `product_ingredients`: Bảng liên kết thuốc - hoạt chất kèm hàm lượng chuẩn (`strength_value`, `strength_unit`).
- `product_skus`: Quy cách đóng gói thương mại (Hộp, Vỉ, Viên, Chai, Tuýp), hệ số quy đổi và đơn giá bán.
- `confidence_scores`: Chi tiết điểm thành phần của thuật toán Trust Score (Số đăng ký, Hoạt chất, Nhà sản xuất, Đồng thuận nguồn, Độ tươi mới dữ liệu).
- `score_history`: Lịch sử biến động điểm tin cậy khi có đợt tính toán lại hoặc điều chỉnh thủ công.
- `price_observations`: Quan sát và so sánh giá bán lẻ theo thời gian thực từ các chuỗi nhà thuốc đối thủ.

#### Module 3: Crawler Pipeline & Regulatory Sources (11 bảng)
- `data_sources`: Cấu hình nguồn dữ liệu (Cục Quản lý Dược DAV, DrugBank, Chuỗi bán lẻ Pharmacity/Long Châu).
- `crawl_runs`: Lịch sử các phiên thu thập dữ liệu (trạng thái, số trang thành công/thất bại).
- `crawl_locks`: Cơ chế khóa phân tán (Distributed Lock) ngăn chặn crawl trùng lặp đồng thời trên một nguồn.
- `raw_documents`: Kho lưu trữ bất biến các tài liệu HTML/JSON thô kèm `content_hash` chống trùng lặp.
- `product_candidates`: Bản ghi ứng viên thuốc trích xuất từ văn bản thô chờ chuẩn hóa và đối soát.
- `product_source_fields`: Nguồn gốc xuất xứ từng thuộc tính (Data Provenance/Lineage) - xác định nguồn nào cung cấp field nào.
- `regulatory_records`: Cơ sở dữ liệu pháp lý gốc từ Cục Quản lý Dược Việt Nam (Số ĐK, tình trạng lưu hành).
- `data_conflicts`: Phát hiện và lưu trữ xung đột dữ liệu giữa các nguồn (ví dụ: khác biệt dạng bào chế hoặc NSX).
- `review_decisions`: Quyết định phê duyệt / từ chối đối soát dữ liệu của Dược sĩ kiểm duyệt.
- `failed_crawl_items`: Danh sách URL bị lỗi thu thập để phục vụ retry hoặc sửa parser.
- `admin_alerts`: Cảnh báo vận hành hệ thống thu thập dữ liệu.

#### Module 4: Geography & Vietnam Administrative Units (2 bảng)
- `administrative_units`: Danh mục đơn vị hành chính Việt Nam, hỗ trợ mô hình chính quyền địa phương 2 cấp mới nhất năm 2025.
- `customer_addresses`: Sổ địa chỉ giao hàng của khách hàng tích hợp mã đơn vị hành chính và tọa độ bản đồ.

#### Module 5: Warehouse & Inventory Management - WMS (13 bảng)
- `warehouses`: Kho tổng trung tâm và nhà thuốc chi nhánh.
- `warehouse_locations`: Vị trí lưu kho chi tiết (Dãy/Aisle, Kệ/Shelf, Ô/Bin).
- `suppliers`: Nhà cung cấp dược phẩm đạt chuẩn GSP.
- `inventory_batches`: Lô thuốc nhập kho với ngày sản xuất và hạn dùng (`expiry_date`) làm hạt nhân cho thuật toán FEFO.
- `warehouse_batch_stock`: Số lượng tồn kho theo thời gian thực của từng lô tại từng kho và ô lưu trữ (`quantity_on_hand`, `quantity_reserved`, `quantity_available`).
- `stock_receipts`: Phiếu nhập kho từ nhà cung cấp.
- `stock_receipt_items`: Chi tiết các lô thuốc và đơn giá nhập trên phiếu nhập.
- `stock_movements`: Sổ cái ghi vết bất biến (Immutable Ledger) mọi giao dịch biến động kho.
- `stock_adjustments`: Biên bản kiểm kê và điều chỉnh lệch kho.
- `stock_adjustment_items`: Chi tiết độ lệch tồn kho của từng lô thuốc.
- `stock_transfers`: Lệnh điều chuyển thuốc giữa các kho/chi nhánh.
- `stock_transfer_items`: Chi tiết lô thuốc điều chuyển.
- `stock_reservations`: Khóa giữ tồn kho tạm thời khi khách hàng đang tạo đơn thanh toán.

#### Module 6: Orders & Payments - OMS (7 bảng)
- `orders`: Đơn hàng khách hàng, lưu trữ địa chỉ 2 cấp 2025, tọa độ GPS, phương thức thanh toán và trạng thái.
- `order_items`: Chi tiết sản phẩm trong đơn hàng.
- `order_fulfillments`: Kiện hàng đóng gói và xuất kho giao cho đơn vị vận chuyển 3PL.
- `fulfillment_items`: Số lượng sản phẩm đóng trong từng kiện hàng.
- `order_item_batch_allocations`: Phân bổ đích danh lô thuốc (`batch_id`) và kho xuất cho từng dòng đơn hàng theo chuẩn FEFO.
- `payment_transactions`: Giao dịch cổng thanh toán điện tử (MoMo Sandbox, VNPay, COD, VietQR).
- `payment_webhook_events`: Lưu vết webhook IPN gửi về từ cổng thanh toán kèm chữ ký số và raw payload.

#### Module 7: Marketing, Engagement & Operations (3 bảng)
- `product_reviews`: Đánh giá 1-5 sao và nhận xét từ khách hàng đã mua thuốc.
- `seasonal_campaigns`: Chiến dịch sức khỏe theo mùa (Xuân, Hạ, Thu, Đông) gợi ý thuốc phòng bệnh tương ứng.
- `email_outboxes`: Hàng đợi email gửi thông báo đơn hàng và OTP qua SMTP với cơ chế tự động thử lại khi lỗi.

---

### B. Phân hệ Storefront Clinical Portal (`dev.db` - 10 Bảng)

#### Module 8: Prescription OCR & AI Extraction Pipeline (6 bảng)
- `prescriptions`: Đơn thuốc do khách hàng tải lên (lưu metadata, storageKey, mã session hoặc userId).
- `prescription_ocr_results`: Kết quả nhận dạng quang học văn bản OCR (Tesseract / Google Vision / Mock).
- `prescription_ocr_pages`: Chi tiết văn bản OCR bóc tách theo từng trang ảnh.
- `prescription_extractions`: Kết quả trích xuất cấu trúc lâm sàng bằng mô hình ngôn ngữ lớn (OpenAI / Gemini / Mock).
- `prescription_medications`: Từng loại thuốc trong đơn bóc tách được (Tên thuốc, hàm lượng, cách dùng, liều lượng, số lượng, trạng thái đối soát).
- `drug_references`: Bảng tra cứu danh mục dược dụng cục bộ tích hợp riêng trong Storefront phục vụ đối soát tên thuốc nhanh tại Edge.

#### Module 9: Deterministic Clinical Safety Engine (4 bảng)
- `safety_reports`: Báo cáo an toàn lâm sàng tổng hợp cho đơn thuốc (đếm số cảnh báo Critical, High, Warning, kiểm tra Stale).
- `safety_findings`: Chi tiết từng phát hiện nguy cơ lâm sàng (Dị ứng thuốc, Tương tác thuốc bất lợi, Quá liều, Trùng lặp hoạt chất).
- `safety_rule_executions`: Nhật ký thực thi các quy tắc kiểm tra an toàn phục vụ đối soát chất lượng y khoa.
- `user_allergy_profiles`: Hồ sơ tiền sử dị ứng thuốc và hoạt chất của bệnh nhân.

---

## 3. QUAN HỆ LOGICAL GIỮA HAI DATABASE (CROSS-DATABASE LOGICAL RELATIONS)

Do hai database tách biệt về mặt vật lý, không có Foreign Key cứng (Enforced Physical FK) giữa chúng để đảm bảo tính độc lập và khả năng mở rộng (microservices/decoupled monolith). Các quan hệ nghiệp vụ logic được kiểm soát ở tầng ứng dụng:

1. **`prescriptions.userId` (Storefront) $\rightarrow$ `users.id` (API DB)**:
   - *Tính chất*: Khách hàng đăng nhập trên Storefront tải đơn thuốc lên sẽ liên kết với ID tài khoản trong bảng `users` của Core API. Nếu là khách vãng lai, `userId = NULL` và được liên kết tạm qua `sessionId`.
2. **`user_allergy_profiles.userId` (Storefront) $\rightarrow$ `users.id` (API DB)**:
   - *Tính chất*: Hồ sơ dị ứng gắn liền với mã định danh khách hàng.
3. **`prescription_medications.matchedDrugId` (Storefront) $\rightarrow$ `canonical_products.id` (API DB)**:
   - *Tính chất*: Sau khi AI bóc tách tên thuốc thô trên đơn, hệ thống chuẩn hóa liên kết thuốc này sang ID thuốc chính thức trong danh mục `canonical_products` để đặt hàng.
4. **`orders` (API DB) $\leftrightarrow$ `prescriptions` (Storefront DB)**:
   - *Tính chất*: Đơn hàng chứa thuốc kê đơn (Rx) cần có một đơn thuốc đã qua thẩm định y khoa (`SAFETY_CHECKED` / Dược sĩ duyệt), hiện tại đang đối soát qua luồng nghiệp vụ API trước khi tạo đơn hàng.

---

## 4. TECHNICAL DEBT & KHUYẾN NGHỊ HỢP NHẤT KIẾN TRÚC DỮ LIỆU

Trong quá trình audit mã nguồn, các điểm bất hợp lý và nợ kỹ thuật sau được phát hiện:

1. **Trùng lặp Danh mục Dược phẩm (`drug_references` vs `canonical_products`)**:
   - *Hiện trạng*: Storefront duy trì riêng bảng `drug_references` (10 cột) để đối soát đơn thuốc, trong khi Core API đã có bảng `canonical_products` (32 cột) cực kỳ đầy đủ kèm hoạt chất.
   - *Khuyến nghị tương lai*: Hợp nhất `drug_references` làm view hoặc cache đồng bộ từ `canonical_products` để tránh lệch pha dữ liệu thuốc mới.
2. **Liên kết Đơn thuốc - Đơn hàng chưa có khóa ngoại mềm trong `orders`**:
   - *Hiện trạng*: Bảng `orders` hiện chưa có cột `prescription_id` (chỉ lưu ghi chú và thông tin giao hàng). Nếu đơn hàng là thuốc Rx, việc truy vết lại đơn thuốc gốc phải dựa vào log API.
   - *Khuyến nghị tương lai*: Bổ sung cột `prescription_id varchar(50) nullable` vào bảng `orders`.
3. **Hợp nhất cơ sở dữ liệu trên môi trường Production**:
   - *Hiện trạng*: Hai file SQLite độc lập (`pharmatrust.db` và `dev.db`).
   - *Khuyến nghị tương lai*: Khi deploy production lên PostgreSQL, có thể tổ chức thành **2 Schemas riêng biệt trong cùng một PostgreSQL Instance** (ví dụ: `schema "core"` cho 45 bảng API và `schema "storefront"` cho 10 bảng Prescription), cho phép vừa giữ được ranh giới bounded context, vừa có thể join hoặc tạo foreign key vật lý nếu cần thiết.

---

## 5. HƯỚNG DẪN IMPORT VÀO DBDATAGRAM.IO

1. Mở trình duyệt và truy cập: [https://dbdiagram.io/](https://dbdiagram.io/)
2. Mở file [docs/H4CARE_DATABASE_DIAGRAM.dbml](./H4CARE_DATABASE_DIAGRAM.dbml) trong editor.
3. Sao chép (Ctrl+A $\rightarrow$ Ctrl+C) toàn bộ nội dung file DBML.
4. Dán (Ctrl+V) vào khung soạn thảo của dbdiagram.io.
5. Biểu đồ ER Diagram hoàn chỉnh với 55 bảng, 25 Enums, 78 quan hệ vật lý và 9 nhóm TableGroup sẽ lập tức được hiển thị trực quan.
