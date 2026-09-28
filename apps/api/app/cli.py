"""
PharmaTrust Data Hub - Command Line Interface (CLI)
Ho tro thao tac truc tiep tren Terminal:
  - Xem trang thai he thong (status)
  - Cao du lieu thuoc tu nguon uy tin (crawl)
  - Xuat du lieu chuan hoa ra Excel / CSV cho App chinh (export)
  - Tra cuu thong tin thuoc (search)
  - Nhap du lieu thuoc tu file ngoai vao he thong (import)
"""

import argparse
import csv
from datetime import UTC, datetime
from pathlib import Path


from app.db.session import SessionLocal
from app.models import (
    CanonicalProduct,
    CrawlRun,
    DataSource,
    PriceObservation,
    ProductCandidate,
    RegulatoryRecord,
)
from app.models.enums import ConfidenceLabel, PublishStatus, RunStatus, SourceType
from app.tasks.jobs import execute_crawl


def format_ingredients(product: CanonicalProduct) -> str:
    """Format danh sach hoat chat va ham luong."""
    parts = []
    for item in product.ingredients:
        name = item.ingredient.normalized_name if item.ingredient else ""
        if item.strength_value is not None and item.strength_unit:
            val = f"{item.strength_value:g}"
            parts.append(f"{name} {val}{item.strength_unit}".strip())
        elif name:
            parts.append(name)
    return ", ".join(parts)


def get_latest_price(db, product_id: int) -> float | None:
    """Lay gia ban le moi nhat quan sat duoc."""
    obs = (
        db.query(PriceObservation)
        .filter(PriceObservation.product_id == product_id)
        .order_by(PriceObservation.observed_at.desc())
        .first()
    )
    return float(obs.observed_price) if obs and obs.observed_price is not None else None


# ---------------------------------------------------------------------------
# COMMAND: status
# ---------------------------------------------------------------------------
def cmd_status(args):
    db = SessionLocal()
    try:
        total_products = db.query(CanonicalProduct).count()
        total_reg = db.query(RegulatoryRecord).count()
        total_prices = db.query(PriceObservation).count()
        total_candidates = db.query(ProductCandidate).count()
        total_runs = db.query(CrawlRun).count()

        print("\n" + "=" * 65)
        print("       PHARMATRUST DATA HUB - TỔNG QUAN HỆ THỐNG")
        print("=" * 65)
        print(f"  * Tổng số thuốc chuẩn hóa (Canonical Products) : {total_products}")
        print(f"  * Tổng số hồ sơ Cục Quản lý Dược (DAV)         : {total_reg}")
        print(f"  * Dữ liệu giá bán lẻ đối chiếu (Pharmacity...)  : {total_prices}")
        print(f"  * Ứng viên thuốc trích xuất từ web              : {total_candidates}")
        print(f"  * Lịch sử các phiên cào dữ liệu (Crawl Runs)    : {total_runs}")
        print("-" * 65)

        # Thong ke theo muc do tin cay
        print("  PHÂN BỔ ĐỘ TIN CẬY DỮ LIỆU:")
        labels = [
            (ConfidenceLabel.HIGH_OFFICIAL_MATCH, "Khớp chính thức DAV (>= 85đ)"),
            (ConfidenceLabel.REVIEW_REQUIRED, "Cần kiểm duyệt (70 - 84đ)"),
            (ConfidenceLabel.INSUFFICIENT_EVIDENCE, "Chưa đủ dữ liệu (< 70đ)"),
            (ConfidenceLabel.BLOCKED, "Bị chặn / Thu hồi"),
        ]
        for label, desc in labels:
            cnt = db.query(CanonicalProduct).filter(CanonicalProduct.confidence_label == label).count()
            pct = (cnt / total_products * 100) if total_products > 0 else 0
            print(f"    - {desc:<35} : {cnt:>4} sản phẩm ({pct:.1f}%)")

        print("-" * 65)
        print("  DANH SÁCH NGUỒN DỮ LIỆU THỰC TẾ:")
        sources = db.query(DataSource).all()
        print(f"  {'ID':<4} {'Mã nguồn':<18} {'Tên nguồn':<32} {'Trạng thái'}")
        print(f"  {'-'*4} {'-'*18} {'-'*32} {'-'*10}")
        for s in sources:
            st = "Bật" if s.enabled else "Tắt"
            print(f"  {s.id:<4} {s.code:<18} {s.name[:30]:<32} {st}")
        print("=" * 65 + "\n")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# COMMAND: crawl
# ---------------------------------------------------------------------------
def cmd_crawl(args):
    db = SessionLocal()
    try:
        source_filter = (args.source or "ALL").upper()
        query = db.query(DataSource).filter(
            DataSource.enabled.is_(True),
            DataSource.base_url.is_not(None),
            DataSource.source_type.notin_([SourceType.MANUAL_UPLOAD, SourceType.DEMO]),
        )

        if source_filter != "ALL":
            query = query.filter(DataSource.code.ilike(f"%{source_filter}%"))

        sources = query.all()
        if not sources:
            print(f"[!] Không tìm thấy nguồn dữ liệu phù hợp với bộ lọc: '{source_filter}'")
            return

        print(f"\n[*] Bắt đầu tiến trình cào dữ liệu cho {len(sources)} nguồn:")
        for s in sources:
            print(f"\n---> Nguồn: {s.code} ({s.name})")
            print(f"     URL gốc: {s.base_url}")

            # Tạo CrawlRun
            run = CrawlRun(
                source_id=s.id,
                status=RunStatus.QUEUED,
                configuration_snapshot={"cli": True, "timestamp": datetime.now(UTC).isoformat()},
            )
            db.add(run)
            db.commit()
            db.refresh(run)

            print(f"     Đang thực thi phiên cào #{run.id}...")
            execute_crawl(run.id)

            db.refresh(run)
            print(f"     Kết quả: {run.status.value}")
            print(f"     - Số trang yêu cầu : {run.pages_requested}")
            print(f"     - Thành công       : {run.pages_success}")
            print(f"     - Thất bại         : {run.pages_failed}")
            print(f"     - Thuốc phát hiện  : {run.products_discovered}")
            if run.error_message:
                print(f"     - Lưu ý            : {run.error_message}")

        total_canonical = db.query(CanonicalProduct).count()
        print(f"\n[OK] Hoàn tất thu thập! Hiện có {total_canonical} thuốc chuẩn hóa trong cơ sở dữ liệu.")
        print("     Để xuất dữ liệu cho App chính, gõ: .\\pt-cli.bat export --format xlsx\n")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# COMMAND: export
# ---------------------------------------------------------------------------
def cmd_export(args):
    db = SessionLocal()
    try:
        export_format = (args.format or "xlsx").lower()
        output_path = args.output or f"du_lieu_thuoc_chuan.{export_format}"
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        min_score = args.min_score or 0

        query = db.query(CanonicalProduct).filter(CanonicalProduct.overall_score >= min_score)
        if getattr(args, "only_published", False):
            query = query.filter(CanonicalProduct.publish_status == PublishStatus.PUBLISHED)

        products = query.order_by(CanonicalProduct.overall_score.desc(), CanonicalProduct.canonical_name).all()

        if not products:
            print(f"[!] Không có sản phẩm nào thỏa mãn điều kiện lọc (điểm >= {min_score}).")
            return

        print(f"[*] Đang xuất {len(products)} bản ghi thuốc chuẩn hóa sang '{output_path}'...")

        rows = []
        for p in products:
            price = get_latest_price(db, p.id)
            rows.append({
                "Mã ID": p.id,
                "Hình ảnh (URL)": p.image_url or "",
                "Tên thuốc chuẩn": p.canonical_name,
                "Số đăng ký (SĐK)": p.registration_number or "",
                "Hoạt chất & Hàm lượng": format_ingredients(p),
                "Chỉ định / Công dụng": p.indications or "",
                "Hướng dẫn sử dụng & Liều dùng": p.usage_instructions or "",
                "Chống chỉ định": p.contraindications or "",
                "Tác dụng phụ": p.side_effects or "",
                "Bảo quản": p.storage_conditions or "",
                "Mô tả chi tiết": p.description or "",
                "Nhà sản xuất": p.manufacturer or "",
                "Nước sản xuất": p.manufacturing_country or "",
                "Dạng bào chế": p.dosage_form or "",
                "Đường dùng": p.route or "",
                "Quy cách đóng gói": p.package_description or "",
                "Phân loại (OTC/Rx)": p.rx_otc_status.value if p.rx_otc_status else "",
                "Trạng thái cấp phép": p.regulatory_status.value if p.regulatory_status else "",
                "Điểm tin cậy": p.overall_score,
                "Mức tin cậy": p.confidence_label.value if p.confidence_label else "",
                "Giá bán lẻ đối chiếu (VNĐ)": f"{price:,.0f}" if price else "Chưa có",
                "Hạn giấy phép": p.registration_valid_to.isoformat() if p.registration_valid_to else "",
            })

        if export_format == "xlsx":
            try:
                import openpyxl
                from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
                from openpyxl.utils import get_column_letter

                wb = openpyxl.Workbook()
                ws = wb.active
                ws.title = "DuLieuThuocChuan"

                headers = list(rows[0].keys())

                # Style header
                header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
                header_fill = PatternFill(start_color="1B5E20", end_color="1B5E20", fill_type="solid")
                thin_border = Border(
                    left=Side(style="thin", color="CCCCCC"),
                    right=Side(style="thin", color="CCCCCC"),
                    top=Side(style="thin", color="CCCCCC"),
                    bottom=Side(style="thin", color="CCCCCC"),
                )

                for col_idx, h in enumerate(headers, 1):
                    cell = ws.cell(row=1, column=col_idx, value=h)
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

                row_font = Font(name="Arial", size=10)
                for row_idx, r in enumerate(rows, 2):
                    for col_idx, h in enumerate(headers, 1):
                        cell = ws.cell(row=row_idx, column=col_idx, value=r[h])
                        cell.font = row_font
                        cell.border = thin_border
                        if h in {"Mã ID", "Số đăng ký (SĐK)", "Phân loại (OTC/Rx)", "Điểm tin cậy", "Hạn giấy phép"}:
                            cell.alignment = Alignment(horizontal="center", vertical="center")
                        elif h == "Giá bán lẻ đối chiếu (VNĐ)":
                            cell.alignment = Alignment(horizontal="right", vertical="center")
                        else:
                            cell.alignment = Alignment(horizontal="left", vertical="center")

                # Auto adjust column width
                for col in ws.columns:
                    max_len = 0
                    col_letter = get_column_letter(col[0].column)
                    for cell in col:
                        val_str = str(cell.value or "")
                        if len(val_str) > max_len:
                            max_len = len(val_str)
                    ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 45)

                ws.row_dimensions[1].height = 28
                wb.save(output_path)
            except ImportError:
                print("[!] Cần cài đặt openpyxl để xuất file Excel. Vui lòng chạy: pip install openpyxl")
                return
        else:
            # CSV with UTF-8 BOM
            with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                writer.writerows(rows)

        file_size = Path(output_path).stat().st_size
        print(f"[OK] Xuất thành công file: {output_path} ({file_size:,} bytes, {len(rows)} bản ghi)")
        print("     Bạn có thể nạp file này trực tiếp cho App chính của mình.\n")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# COMMAND: search
# ---------------------------------------------------------------------------
def cmd_search(args):
    db = SessionLocal()
    try:
        q = (args.query or "").strip()
        if not q:
            print("[!] Vui lòng nhập từ khóa tìm kiếm (Tên thuốc, SĐK hoặc hoạt chất).")
            return

        print(f"\n[*] Kết quả tra cứu thuốc với từ khóa: '{q}'\n")

        products = (
            db.query(CanonicalProduct)
            .filter(
                (CanonicalProduct.canonical_name.ilike(f"%{q}%"))
                | (CanonicalProduct.registration_number.ilike(f"%{q}%"))
                | (CanonicalProduct.manufacturer.ilike(f"%{q}%"))
            )
            .all()
        )

        if not products:
            print("  Không tìm thấy sản phẩm nào khớp với từ khóa.")
            print("  Thử cào thêm dữ liệu: .\\pt-cli.bat crawl --source DAV\n")
            return

        print(f"  Tìm thấy {len(products)} sản phẩm:")
        print(f"  {'SĐK':<14} {'Tên thuốc':<25} {'Hoạt chất':<30} {'Điểm':<6} {'Nhà sản xuất'}")
        print(f"  {'-'*14} {'-'*25} {'-'*30} {'-'*6} {'-'*30}")
        for p in products:
            sdk = p.registration_number or "Chưa có"
            name = p.canonical_name[:24]
            ing = format_ingredients(p)[:29]
            mfr = (p.manufacturer or "")[:30]
            print(f"  {sdk:<14} {name:<25} {ing:<30} {p.overall_score:<6} {mfr}")
        print("\n")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# MAIN PARSER
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        prog="pt-cli",
        description="PharmaTrust Data Hub CLI - Quản lý, cào dữ liệu và xuất danh bạ thuốc chuẩn",
    )
    subparsers = parser.add_subparsers(dest="command", help="Lệnh thực thi")

    # status
    subparsers.add_parser("status", help="Xem tổng quan hệ thống và các nguồn dữ liệu")

    # crawl
    p_crawl = subparsers.add_parser("crawl", help="Cào dữ liệu thuốc từ các nguồn uy tín")
    p_crawl.add_argument("--source", "-s", default="ALL", help="Mã nguồn (DAV, PHARMACITY, LONG_CHAU, DRUGBANK hoặc ALL)")

    # export
    p_export = subparsers.add_parser("export", help="Xuất danh bạ thuốc chuẩn sang Excel hoặc CSV cho App chính")
    p_export.add_argument("--format", "-f", default="xlsx", choices=["xlsx", "csv"], help="Định dạng xuất (xlsx hoặc csv)")
    p_export.add_argument("--output", "-o", default="du_lieu_thuoc_chuan.xlsx", help="Đường dẫn file xuất")
    p_export.add_argument("--min-score", "-m", type=int, default=0, help="Điểm tin cậy tối thiểu (0-100)")
    p_export.add_argument("--only-published", action="store_true", help="Chỉ xuất các thuốc ở trạng thái Đã duyệt (PUBLISHED)")

    # search
    p_search = subparsers.add_parser("search", help="Tra cứu nhanh thông tin thuốc")
    p_search.add_argument("query", help="Tên thuốc, số đăng ký hoặc hoạt chất")

    args = parser.parse_args()

    if args.command == "status":
        cmd_status(args)
    elif args.command == "crawl":
        cmd_crawl(args)
    elif args.command == "export":
        cmd_export(args)
    elif args.command == "search":
        cmd_search(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
