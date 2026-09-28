from app.services.matching import match_products


def test_exact_registration_and_ingredient_match():
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
    result = match_products(candidate, product)
    assert result.is_same_product is True
    assert result.confidence >= 0.92


def test_strength_conflict_prevents_automatic_merge():
    candidate = {
        "name": "DemoMed 001",
        "registration_number": "VD-1000-26",
        "manufacturer": "Công ty Demo",
        "ingredients": [{"name": "Hoạt chất A", "strength_value": 50, "strength_unit": "mg"}],
    }
    product = {
        "name": "DemoMed 001",
        "registration_number": "VD-1000-26",
        "manufacturer": "Công ty Demo",
        "ingredients": [{"name": "Hoạt chất A", "strength_value": 500, "strength_unit": "mg"}],
    }
    result = match_products(candidate, product)
    assert result.is_same_product is False
    assert "strength_conflict" in result.conflicts

