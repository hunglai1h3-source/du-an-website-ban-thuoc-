import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestVietnamPlacesSearch(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_fpt_polytechnic(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "FPT Polytechnic", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 1, "FPT Polytechnic phải trả về nhiều cơ sở/gợi ý khác nhau trên toàn quốc")
        names = [it["name"] for it in items]
        self.assertTrue(any("FPT" in n for n in names))

    def test_02_72_tran_duy_hung(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "72 Trần Duy Hưng", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 0, "72 Trần Duy Hưng phải trả về gợi ý phố/số nhà")
        self.assertTrue(any("Trần Duy Hưng" in it["name"] or "Trần Duy Hưng" in it["formatted_address"] for it in items))

    def test_03_benh_vien_bach_mai(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "Bệnh viện Bạch Mai", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 1, "Bệnh viện Bạch Mai phải trả về nhiều kết quả")
        self.assertTrue(any("Bạch Mai" in it["name"] for it in items))

    def test_04_keangnam(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "Keangnam", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 1, "Keangnam phải trả về nhiều kết quả tại Việt Nam")
        self.assertTrue(any("Landmark" in it["name"] or "Keangnam" in it["name"] or "Kênh Nam" in it["name"] for it in items))

    def test_05_thach_that(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "Thạch Thất", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 1, "Thạch Thất phải trả về nhiều địa điểm huyện/xã/công trình")
        self.assertTrue(any("Thạch Thất" in it["name"] for it in items))

    def test_06_ho_guom(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "Hồ Gươm", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 1, "Hồ Gươm phải trả về nhiều gợi ý")
        self.assertTrue(any("Hồ Gươm" in it["name"] or "Hồ Hoàn Kiếm" in it["name"] for it in items))

    def test_07_times_city(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "Times City", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 1, "Times City phải trả về nhiều gợi ý")
        self.assertTrue(any("Times" in it["name"] for it in items))

    def test_08_dai_hoc_bach_khoa_ha_noi(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "Đại học Bách Khoa Hà Nội", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 1, "Đại học Bách Khoa Hà Nội phải trả về nhiều gợi ý")
        self.assertTrue(any("Bách Khoa" in it["name"] for it in items))

    def test_09_da_nang(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "Đà Nẵng", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 1, "Đà Nẵng phải trả về nhiều địa điểm tại Đà Nẵng")
        self.assertTrue(any("Đà Nẵng" in it["name"] or "Da Nang" in it.get("formatted_address", "") for it in items))

    def test_10_quan_1_ho_chi_minh(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "Quận 1 Hồ Chí Minh", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreater(len(items), 1, "Quận 1 Hồ Chí Minh phải trả về nhiều địa điểm tại TP.HCM")
        self.assertTrue(any("Hồ Chí Minh" in it["name"] or "Ho Chi Minh" in it["formatted_address"] or "Quận 1" in it.get("district_name", "") for it in items))

    def test_11_nguyen_trai_generic(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "Nguyễn Trãi", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertGreaterEqual(len(items), 3, "Nguyễn Trãi phải trả về nhiều kết quả (phố, phường, địa danh)")
        self.assertTrue(any("Nguyễn Trãi" in it["name"] for it in items))

    def test_12_empty_state_for_unknown_place(self):
        res = self.client.get("/api/v1/addresses/places/autocomplete", params={"q": "zzzzxyqwerty987", "limit": 8})
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertEqual(len(items), 0, "Không được fallback về FPT hay mock khi search không có kết quả")

    def test_13_reverse_geocoding_real(self):
        # Tọa độ tại Landmark 72 Phạm Hùng: 21.0169, 105.7841
        res = self.client.get("/api/v1/addresses/reverse-geocode", params={"lat": 21.0169, "lng": 105.7841})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["is_verified"])
        self.assertEqual(data["province_code"], "01")
        self.assertIn("Hà Nội", data["formatted_address"])


if __name__ == "__main__":
    unittest.main()
