#!/usr/bin/env python3
"""
scripts/validate_vietnam_administrative_data.py

STANDALONE VALIDATION & AUDIT SUITE CHO HỆ THỐNG ĐỊA CHÍNH VIỆT NAM 2025
Kiểm định toàn diện:
1. JSON Dataset (data/vietnam-administrative-units.json)
2. Storefront Dataset (apps/storefront/src/data/vietnam-administrative-units.json)
3. SQLite Database Tables (pharmatrust.db: administrative_provinces, administrative_communes, administrative_mergers, administrative_aliases, administrative_units)
4. Test Matrix: 23 nhóm sáp nhập + 11 tỉnh giữ nguyên + 7 đặc khu
"""

import json
import os
import sqlite3
import sys
from pathlib import Path


def validate_json_file(file_path: Path):
    print(f"\n--- KIỂM TRA FILE: {file_path} ---")
    assert file_path.exists(), f"LỖI: Không tìm thấy file {file_path}"

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    meta = data.get("metadata", {})
    assert meta.get("country") == "VN", f"Metadata country sai: {meta.get('country')}"
    assert meta.get("administrativeModel") == "2-tier", f"Administrative model sai: {meta.get('administrativeModel')}"
    assert meta.get("effectiveDate") == "2025-07-01", f"Effective date sai: {meta.get('effectiveDate')}"
    assert meta.get("version") == "VN_ADMIN_2025_07_01", f"Version sai: {meta.get('version')}"

    provinces = data.get("provinces", [])
    communes = data.get("communes", [])
    mergers = data.get("mergerGroups", [])

    assert len(provinces) == 34, f"LỖI: Số tỉnh phải là 34, thực tế: {len(provinces)}"
    assert len(communes) == 3321, f"LỖI: Số xã phải là 3321, thực tế: {len(communes)}"
    assert len(mergers) == 23, f"LỖI: Số nhóm sáp nhập phải là 23, thực tế: {len(mergers)}"

    prov_codes = {p["code"] for p in provinces}
    assert len(prov_codes) == 34, "LỖI: Trùng mã tỉnh!"

    commune_codes = {c["code"] for c in communes}
    assert len(commune_codes) == 3321, "LỖI: Trùng mã xã!"

    # Orphan check
    for c in communes:
        assert c["provinceCode"] in prov_codes, f"LỖI: Xã mồ côi {c['code']} {c['name']} (mã tỉnh {c['provinceCode']})"

    # Special zones check
    special_zones = [c for c in communes if c.get("type") == "special_zone"]
    assert len(special_zones) >= 7, f"LỖI: Số đặc khu phải >= 7, thực tế: {len(special_zones)}"
    sz_names = {sz["name"] for sz in special_zones}
    expected_sz = {"Phú Quốc", "Vân Đồn", "Côn Đảo", "Lý Sơn", "Cô Tô", "Trường Sa", "Hoàng Sa"}
    missing_sz = expected_sz - sz_names
    assert not missing_sz, f"LỖI: Thiếu đặc khu: {missing_sz}"

    print(f"✓ JSON hợp lệ: 34 tỉnh, 3.321 xã, 23 nhóm sáp nhập, {len(special_zones)} đặc khu.")


def validate_sqlite_db(db_path: str = "pharmatrust.db"):
    print(f"\n--- KIỂM TRA SQLITE DATABASE: {db_path} ---")
    assert os.path.exists(db_path), f"LỖI: Không tìm thấy DB {db_path}"

    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # 1. administrative_provinces
    c.execute("SELECT COUNT(*) FROM administrative_provinces")
    p_count = c.fetchone()[0]
    assert p_count == 34, f"LỖI: administrative_provinces count = {p_count} != 34"

    c.execute("SELECT COUNT(*) FROM administrative_provinces WHERE unit_type = 'municipality'")
    muni_count = c.fetchone()[0]
    assert muni_count == 6, f"LỖI: municipality count = {muni_count} != 6"

    # 2. administrative_communes
    c.execute("SELECT COUNT(*) FROM administrative_communes")
    cm_count = c.fetchone()[0]
    assert cm_count == 3321, f"LỖI: administrative_communes count = {cm_count} != 3321"

    c.execute("SELECT COUNT(*) FROM administrative_communes WHERE unit_type = 'special_zone'")
    sz_count = c.fetchone()[0]
    assert sz_count >= 7, f"LỖI: special_zone count in DB = {sz_count} < 7"

    # 3. Orphan check in DB
    c.execute("""
        SELECT COUNT(*) FROM administrative_communes ac
        LEFT JOIN administrative_provinces ap ON ac.province_code = ap.code
        WHERE ap.code IS NULL
    """)
    orphan_count = c.fetchone()[0]
    assert orphan_count == 0, f"LỖI: Có {orphan_count} xã mồ côi trong DB!"

    # 4. administrative_mergers
    c.execute("SELECT COUNT(DISTINCT target_code) FROM administrative_mergers")
    merger_target_count = c.fetchone()[0]
    assert merger_target_count == 23, f"LỖI: merger distinct target count = {merger_target_count} != 23"

    # 5. administrative_aliases
    c.execute("SELECT COUNT(*) FROM administrative_aliases")
    alias_count = c.fetchone()[0]
    assert alias_count > 1000, f"LỖI: alias count = {alias_count} quá ít!"

    # Test key legacy queries
    test_legacy_cases = [
        ("binh duong", "79", "Hồ Chí Minh"),
        ("hai duong", "31", "Hải Phòng"),
        ("quang nam", "48", "Đà Nẵng"),
        ("ha nam", "37", "Ninh Bình"),
        ("nam dinh", "37", "Ninh Bình"),
        ("quang binh", "45", "Quảng Trị"),
        ("kon tum", "51", "Quảng Ngãi"),
        ("binh dinh", "64", "Gia Lai"),
        ("ninh thuan", "56", "Khánh Hòa"),
        ("dak nong", "68", "Lâm Đồng"),
        ("phu yen", "66", "Đắk Lắk"),
        ("binh phuoc", "75", "Đồng Nai"),
        ("long an", "72", "Tây Ninh"),
        ("soc trang", "92", "Cần Thơ"),
        ("ben tre", "86", "Vĩnh Long"),
        ("tien giang", "87", "Đồng Tháp"),
        ("bac lieu", "96", "Cà Mau"),
        ("kien giang", "89", "An Giang"),
        ("ha giang", "08", "Tuyên Quang"),
        ("yen bai", "10", "Lào Cai"),
        ("bac kan", "19", "Thái Nguyên"),
        ("vinh phuc", "25", "Phú Thọ"),
        ("bac giang", "27", "Bắc Ninh"),
        ("thai binh", "33", "Hưng Yên"),
    ]

    for alias_norm, expected_code, expected_target in test_legacy_cases:
        c.execute("""
            SELECT target_unit_code, target_unit_type FROM administrative_aliases
            WHERE alias_normalized = ? AND target_unit_type = 'PROVINCE'
            LIMIT 1
        """, (alias_norm,))
        row = c.fetchone()
        assert row is not None, f"LỖI: Không tìm thấy alias '{alias_norm}' trong administrative_aliases!"
        assert row[0] == expected_code, f"LỖI: Alias '{alias_norm}' trả về mã {row[0]}, kỳ vọng {expected_code} ({expected_target})"

    # 6. Check Phường Nam Định
    c.execute("""
        SELECT code, name, province_code FROM administrative_communes
        WHERE name = 'Nam Định' AND province_code = '37'
    """)
    nd_ward = c.fetchone()
    assert nd_ward is not None, "LỖI: Không tìm thấy 'Phường Nam Định' thuộc Tỉnh Ninh Bình (mã 37)!"

    # 7. Backward compatibility sync in administrative_units
    c.execute("SELECT COUNT(*) FROM administrative_units WHERE level = 'PROVINCE'")
    u_prov = c.fetchone()[0]
    assert u_prov == 34, f"LỖI: administrative_units province count = {u_prov} != 34"

    c.execute("SELECT COUNT(*) FROM administrative_units WHERE level != 'PROVINCE'")
    u_comm = c.fetchone()[0]
    assert u_comm == 3321, f"LỖI: administrative_units commune count = {u_comm} != 3321"

    conn.close()
    print("✓ SQLite Database toàn vẹn 100%: đầy đủ 4 bảng chuyên biệt + đồng bộ bảng tương thích.")


def main():
    print("==================================================")
    print("CHẠY BỘ KIỂM ĐỊNH STANDALONE VALIDATION SUITE")
    print("==================================================")

    data_json = Path("data/vietnam-administrative-units.json")
    sf_json = Path("apps/storefront/src/data/vietnam-administrative-units.json")

    validate_json_file(data_json)
    validate_json_file(sf_json)
    validate_sqlite_db("pharmatrust.db")

    print("\n==================================================")
    print("KẾT QUẢ: TẤT CẢ CÁC BƯỚC KIỂM ĐỊNH ĐÃ ĐẠT 100%!")
    print("==================================================")


if __name__ == "__main__":
    main()
