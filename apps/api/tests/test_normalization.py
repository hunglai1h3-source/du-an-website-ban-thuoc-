from app.services.normalization import (
    extract_registration_number,
    extract_strengths,
    normalize_for_match,
    normalize_registration_number,
)


def test_vietnamese_name_normalization():
    assert normalize_for_match("  Viên nén Paracétamol  ") == "vien nen paracetamol"


def test_strength_conversion():
    strengths = extract_strengths("Mỗi viên chứa hoạt chất 0,5 g và tá dược 10 mg")
    assert strengths[0].display == "500 mg"
    assert strengths[1].display == "10 mg"


def test_registration_number_normalization_and_extraction():
    assert normalize_registration_number(" vd - 1234-26 ") == "VD-1234-26"
    assert extract_registration_number("Số đăng ký: VD-1234-26") == "VD-1234-26"

