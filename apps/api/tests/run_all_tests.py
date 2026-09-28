import sys
import unittest
from pathlib import Path

# Add apps/api to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.normalization import (
    extract_registration_number,
    extract_strengths,
    normalize_for_match,
    normalize_registration_number,
)
from app.services.matching import match_products
from app.core.security import hash_password, verify_password


class TestPharmaTrustCore(unittest.TestCase):
    def test_normalization(self):
        self.assertEqual(normalize_for_match("  Viên nén Paracétamol  "), "vien nen paracetamol")
        self.assertEqual(normalize_registration_number(" vd - 1234-26 "), "VD-1234-26")
        self.assertEqual(extract_registration_number("Số đăng ký: VD-1234-26"), "VD-1234-26")
        strengths = extract_strengths("Mỗi viên chứa hoạt chất 0,5 g và tá dược 10 mg")
        self.assertEqual(strengths[0].display, "500 mg")
        self.assertEqual(strengths[1].display, "10 mg")

    def test_matching(self):
        candidate = {
            "name": "DemoMed 001 hộp 100 viên",
            "registration_number": "VD-1000-26",
            "manufacturer": "Công ty Demo",
            "ingredients": [{"name": "Hoạt chất A", "strength_value": 500, "strength_unit": "mg"}],
        }
        product = {
            "name": "DemoMed 001",
            "registration_number": "VD-1000-26",
            "manufacturer": "Công ty Demo",
            "ingredients": [{"name": "Hoạt chất A", "strength_value": 500, "strength_unit": "mg"}],
        }
        res = match_products(candidate, product)
        self.assertTrue(res.is_same_product)
        self.assertGreaterEqual(res.confidence, 0.90)

    def test_security_hash(self):
        pwd = "AdminSecure@123"
        hashed = hash_password(pwd)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPwd", hashed))


if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = loader.discover(str(Path(__file__).resolve().parent), pattern="test_*.py")
    suite.addTests(loader.loadTestsFromTestCase(TestPharmaTrustCore))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
