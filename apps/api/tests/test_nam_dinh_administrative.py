"""
apps/api/tests/test_nam_dinh_administrative.py

Bộ kiểm định tự động dữ liệu hành chính Tỉnh Ninh Bình / Nam Định sau sáp nhập 2025
(Nghị quyết 202/2025/QH15) và Legacy Address Search Engine.
"""

import pytest
import sqlite3
from app.services.administrative_service import AdministrativeDataService
from app.services.places_service import PlacesService


class TestNamDinhAdministrativeV2:
    def setup_method(self):
        AdministrativeDataService.initialize()

    def test_province_37_ninh_binh_and_legacy_aliases(self):
        """Kiểm tra Tỉnh Ninh Bình (mã 37) chứa các bí danh Nam Định, Hà Nam, Ninh Bình."""
        prov = AdministrativeDataService.get_province_by_code("37")
        assert prov is not None
        assert prov["code"] == "37"
        assert prov["name"] == "Ninh Bình"
        assert prov["fullName"] == "Tỉnh Ninh Bình"

        aliases = prov.get("aliases", [])
        aliases_lower = [a.lower() for a in aliases]
        assert "nam định" in aliases_lower
        assert "tỉnh nam định" in aliases_lower
        assert "hà nam" in aliases_lower
        assert "ninh bình" in aliases_lower

    def test_phuong_nam_dinh_exists_with_all_required_units(self):
        """
        Kiểm tra Phường Nam Định bắt buộc phải tồn tại trong Tỉnh Ninh Bình
        và chứa đầy đủ 8 đơn vị cũ: Quang Trung, Vị Xuyên, Lộc Vượng, Cửa Bắc,
        Trần Hưng Đạo, Năng Tĩnh, Cửa Nam, Mỹ Phúc.
        """
        communes = AdministrativeDataService.get_communes("37", search="Nam Định")
        phuong_nam_dinh = next((c for c in communes if c["name"] == "Nam Định"), None)
        assert phuong_nam_dinh is not None, "Phường Nam Định không tồn tại trong dataset Tỉnh Ninh Bình!"
        assert phuong_nam_dinh["type"] == "ward"
        assert phuong_nam_dinh["fullName"] == "Phường Nam Định"
        assert phuong_nam_dinh["provinceCode"] == "37"

        # Kiểm tra 8 đơn vị cũ bắt buộc trong aliases
        p_aliases = [a.lower() for a in phuong_nam_dinh.get("aliases", [])]
        required_legacy_units = [
            "quang trung", "vị xuyên", "lộc vượng", "cửa bắc",
            "trần hưng đạo", "năng tĩnh", "cửa nam", "mỹ phúc"
        ]
        for unit in required_legacy_units:
            assert any(unit in a for a in p_aliases), f"Thiếu đơn vị cũ '{unit}' trong bí danh của Phường Nam Định!"

    def test_8_core_wards_of_tp_nam_dinh_exist(self):
        """
        Kiểm tra 8 phường cốt lõi khu vực TP Nam Định cũ sau sáp nhập 2025:
        1. Phường Nam Định
        2. Phường Thiên Trường (Lộc Hạ, Mỹ Tân, Mỹ Trung)
        3. Phường Đông A (Lộc Hòa, Mỹ Thắng, Mỹ Hà)
        4. Phường Vị Khê (Nam Điền, Nam Phong)
        5. Phường Thành Nam (Mỹ Xá, Đại An)
        6. Phường Trường Thi (Trường Thi, Thành Lợi)
        7. Phường Hồng Quang (Hồng Quang, Nghĩa An, Nam Vân)
        8. Phường Mỹ Lộc (Hưng Lộc, Mỹ Thuận, TT Mỹ Lộc)
        """
        expected_wards = [
            ("Nam Định", ["quang trung", "vị xuyên", "mỹ phúc"]),
            ("Thiên Trường", ["lộc hạ", "mỹ tân", "mỹ trung"]),
            ("Đông A", ["lộc hòa", "mỹ thắng", "mỹ hà"]),
            ("Vị Khê", ["nam điền", "nam phong"]),
            ("Thành Nam", ["mỹ xá", "đại an"]),
            ("Trường Thi", ["trường thi", "thành lợi"]),
            ("Hồng Quang", ["hồng quang", "nam vân"]),
            ("Mỹ Lộc", ["hưng lộc", "mỹ lộc"]),
        ]

        all_communes = AdministrativeDataService.get_communes("37")
        communes_by_name = {c["name"]: c for c in all_communes}

        for ward_name, key_legacy in expected_wards:
            assert ward_name in communes_by_name, f"Thiếu phường '{ward_name}' trong Tỉnh Ninh Bình!"
            w = communes_by_name[ward_name]
            assert w["type"] == "ward"
            assert w["legacyDistrictName"] == "TP. Nam Định (cũ)"

            aliases_lower = [a.lower() for a in w.get("aliases", [])]
            for leg in key_legacy:
                assert any(leg in a for a in aliases_lower), f"Thiếu alias '{leg}' trong phường '{ward_name}'!"

    def test_dropdown_commune_search_8_test_cases(self):
        """
        Kiểm tra 8 test cases bắt buộc từ yêu cầu người dùng:
        Test case 1: Tìm 'Nam Định' -> Phải thấy 'Phường Nam Định'
        Test case 2: Tìm 'Thiên Trường' -> Phải thấy 'Phường Thiên Trường'
        Test case 3: Tìm 'Mỹ Phúc' -> Phải map/gợi ý 'Phường Nam Định'
        Test case 4: Tìm 'Vị Xuyên' -> Phải map/gợi ý 'Phường Nam Định'
        Test case 5: Tìm 'Mỹ Xá' -> Phải map/gợi ý 'Phường Thành Nam'
        Test case 6: Tìm 'Nam Vân' -> Phải map/gợi ý 'Phường Hồng Quang'
        Test case 7: Tìm 'Mỹ Lộc' -> Phải map/gợi ý 'Phường Mỹ Lộc'
        Test case 8: Tìm 'Tỉnh Nam Định' -> Map sang Tỉnh Ninh Bình
        """
        # Test 1
        res1 = AdministrativeDataService.get_communes("37", search="Nam Định")
        assert any(c["name"] == "Nam Định" for c in res1)

        # Test 2
        res2 = AdministrativeDataService.get_communes("37", search="Thiên Trường")
        assert any(c["name"] == "Thiên Trường" for c in res2)

        # Test 3
        res3 = AdministrativeDataService.get_communes("37", search="Mỹ Phúc")
        assert any(c["name"] == "Nam Định" for c in res3)

        # Test 4
        res4 = AdministrativeDataService.get_communes("37", search="Vị Xuyên")
        assert any(c["name"] == "Nam Định" for c in res4)

        # Test 5
        res5 = AdministrativeDataService.get_communes("37", search="Mỹ Xá")
        assert any(c["name"] == "Thành Nam" for c in res5)

        # Test 6
        res6 = AdministrativeDataService.get_communes("37", search="Nam Vân")
        assert any(c["name"] == "Hồng Quang" for c in res6)

        # Test 7
        res7 = AdministrativeDataService.get_communes("37", search="Mỹ Lộc")
        assert any(c["name"] == "Mỹ Lộc" for c in res7)

        # Test 8
        provs = AdministrativeDataService.get_provinces("Tỉnh Nam Định")
        assert len(provs) > 0
        assert provs[0]["code"] == "37"
        assert provs[0]["name"] == "Ninh Bình"

    @pytest.mark.asyncio
    async def test_places_autocomplete_legacy_search(self):
        """
        Kiểm tra Autocomplete Place Search cho các truy vấn địa danh cũ:
        - "Mỹ Phúc, Nam Định" -> Phường Nam Định, Tỉnh Ninh Bình
        - "Vị Xuyên Nam Định" -> Phường Nam Định, Tỉnh Ninh Bình
        - "Lộc Hạ Nam Định" -> Phường Thiên Trường, Tỉnh Ninh Bình
        - "Mỹ Xá Nam Định" -> Phường Thành Nam, Tỉnh Ninh Bình
        - "Nam Vân Nam Định" -> Phường Hồng Quang, Tỉnh Ninh Bình
        - "Mỹ Lộc Nam Định" -> Phường Mỹ Lộc, Tỉnh Ninh Bình
        - "Tỉnh Nam Định" -> Tỉnh Ninh Bình
        """
        # 1. Mỹ Phúc, Nam Định
        r1 = await PlacesService.autocomplete_places("Mỹ Phúc, Nam Định")
        assert len(r1) > 0
        assert any("Phường Nam Định" in item["formatted_address"] or "Phường Nam Định" in item["name"] for item in r1)
        assert any(item["province_code"] == "37" for item in r1)

        # 2. Vị Xuyên Nam Định
        r2 = await PlacesService.autocomplete_places("Vị Xuyên Nam Định")
        assert len(r2) > 0
        assert any("Phường Nam Định" in item["formatted_address"] or "Phường Nam Định" in item["name"] for item in r2)

        # 3. Lộc Hạ Nam Định
        r3 = await PlacesService.autocomplete_places("Lộc Hạ Nam Định")
        assert len(r3) > 0
        assert any("Phường Thiên Trường" in item["formatted_address"] or "Phường Thiên Trường" in item["name"] for item in r3)

        # 4. Mỹ Xá Nam Định
        r4 = await PlacesService.autocomplete_places("Mỹ Xá Nam Định")
        assert len(r4) > 0
        assert any("Phường Thành Nam" in item["formatted_address"] or "Phường Thành Nam" in item["name"] for item in r4)

        # 5. Nam Vân Nam Định
        r5 = await PlacesService.autocomplete_places("Nam Vân Nam Định")
        assert len(r5) > 0
        assert any("Phường Hồng Quang" in item["formatted_address"] or "Phường Hồng Quang" in item["name"] for item in r5)

        # 6. Mỹ Lộc Nam Định
        r6 = await PlacesService.autocomplete_places("Mỹ Lộc Nam Định")
        assert len(r6) > 0
        assert any("Phường Mỹ Lộc" in item["formatted_address"] or "Phường Mỹ Lộc" in item["name"] for item in r6)

        # 7. Tỉnh Nam Định
        r7 = await PlacesService.autocomplete_places("Tỉnh Nam Định")
        assert len(r7) > 0
        assert any(item["province_code"] == "37" for item in r7)

    def test_administrative_selection_validation(self):
        """Kiểm tra xác thực lựa chọn cấp xã thuộc Tỉnh Ninh Bình (mã 37)."""
        all_communes = AdministrativeDataService.get_communes("37")
        assert len(all_communes) == 104, f"Số xã/phường Tỉnh Ninh Bình phải đúng 104, thực tế: {len(all_communes)}"

        for c in all_communes:
            valid, err = AdministrativeDataService.validate_selection("37", c["code"])
            assert valid is True, f"Lỗi xác thực cho {c['fullName']}: {err}"

        # Kiểm tra chọn sai tỉnh phải báo lỗi
        invalid, err = AdministrativeDataService.validate_selection("01", all_communes[0]["code"])
        assert invalid is False
        assert err is not None

    def test_database_sqlite_consistency(self):
        """Kiểm tra tính nhất quán giữa cơ sở dữ liệu SQLite và bộ dữ liệu JSON."""
        conn = sqlite3.connect("pharmatrust.db")
        c = conn.cursor()

        # Tổng số tỉnh
        c.execute("SELECT COUNT(*) FROM administrative_units WHERE level = 'PROVINCE'")
        p_count = c.fetchone()[0]
        assert p_count == 34, f"Số tỉnh trong SQLite phải là 34, thực tế: {p_count}"

        # Tổng số xã toàn quốc
        c.execute("SELECT COUNT(*) FROM administrative_units WHERE level != 'PROVINCE'")
        c_count = c.fetchone()[0]
        assert c_count == 3321, f"Tổng số xã toàn quốc trong SQLite phải là 3321, thực tế: {c_count}"

        # Số xã của Tỉnh Ninh Bình
        c.execute("SELECT COUNT(*) FROM administrative_units WHERE parent_code = '37'")
        nb_count = c.fetchone()[0]
        assert nb_count == 104, f"Số xã Tỉnh Ninh Bình trong SQLite phải là 104, thực tế: {nb_count}"

        # Phường Nam Định trong DB
        c.execute("SELECT code, name, full_name, aliases FROM administrative_units WHERE parent_code = '37' AND name = 'Nam Định'")
        nd_row = c.fetchone()
        assert nd_row is not None
        assert nd_row[1] == "Nam Định"
        assert nd_row[2] == "Phường Nam Định"
        assert "Mỹ Phúc" in nd_row[3]
        assert "Vị Xuyên" in nd_row[3]

        conn.close()
