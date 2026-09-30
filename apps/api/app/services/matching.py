import re
from dataclasses import dataclass

from rapidfuzz.fuzz import partial_ratio, ratio, token_set_ratio

from app.services.normalization import normalize_for_match, normalize_registration_number


@dataclass
class MatchResult:
    is_same_product: bool
    confidence: float
    reasons: list[str]
    conflicts: list[str]
    requires_review: bool


def _clean_ing_name(name: str) -> str:
    cleaned = re.sub(r"\b\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|ml|%|iu|ui)\b", "", name, flags=re.IGNORECASE)
    return normalize_for_match(cleaned)


def _ingredient_map(items: list[dict]) -> dict[str, str]:
    result: dict[str, str] = {}
    for item in items or []:
        name = _clean_ing_name(str(item.get("name", "")))
        if not name:
            continue
        value = item.get("strength_value") or item.get("value") or ""
        unit = item.get("strength_unit") or item.get("unit") or ""
        result[name] = f"{value}{str(unit).lower()}"
    return result


def match_products(candidate: dict, product: dict) -> MatchResult:
    reasons: list[str] = []
    conflicts: list[str] = []
    score = 0.0

    cand_reg = normalize_registration_number(candidate.get("registration_number"))
    product_reg = normalize_registration_number(product.get("registration_number"))
    if cand_reg and product_reg:
        if cand_reg == product_reg:
            score += 0.55
            reasons.append("registration_number_exact_match")
        else:
            conflicts.append("registration_number_conflict")
    elif not cand_reg and product_reg:
        cand_name_norm = normalize_for_match(candidate.get("name"))
        prod_name_norm = normalize_for_match(product.get("name"))
        token_ratio = token_set_ratio(cand_name_norm, prod_name_norm) / 100
        if token_ratio >= 0.85:
            score += 0.48 * token_ratio
            reasons.append(f"retail_name_token_match_{token_ratio:.2f}")

    cand_name_norm = normalize_for_match(candidate.get("name"))
    prod_name_norm = normalize_for_match(product.get("name"))
    name_score = max(
        ratio(cand_name_norm, prod_name_norm),
        token_set_ratio(cand_name_norm, prod_name_norm),
        partial_ratio(cand_name_norm, prod_name_norm),
    ) / 100
    score += name_score * 0.25
    reasons.append(f"name_similarity_{name_score:.2f}")

    cand_ingredients = _ingredient_map(candidate.get("ingredients", []))
    product_ingredients = _ingredient_map(product.get("ingredients", []))
    if cand_ingredients and product_ingredients:
        cand_names = set(cand_ingredients.keys())
        prod_names = set(product_ingredients.keys())
        common_names = cand_names.intersection(prod_names)

        if not common_names:
            conflicts.append("ingredient_conflict")
        else:
            has_strength_conflict = False
            for name in common_names:
                c_str = cand_ingredients[name]
                p_str = product_ingredients[name]
                if c_str and p_str and c_str != p_str:
                    has_strength_conflict = True
                    break

            if has_strength_conflict:
                conflicts.append("strength_conflict")
            else:
                score += 0.2
                reasons.append("ingredient_strength_match")

            if cand_names != prod_names:
                conflicts.append("ingredient_conflict")

    manufacturer_score = ratio(
        normalize_for_match(candidate.get("manufacturer")),
        normalize_for_match(product.get("manufacturer")),
    ) / 100
    if manufacturer_score >= 0.8:
        score += 0.05
        reasons.append("manufacturer_match")
    elif candidate.get("manufacturer") and product.get("manufacturer"):
        conflicts.append("manufacturer_conflict")

    score = min(round(score, 4), 1.0)
    hard_conflict = any(item in conflicts for item in ("registration_number_conflict", "ingredient_conflict", "strength_conflict"))
    is_same = score >= 0.92 and not hard_conflict
    return MatchResult(
        is_same_product=is_same,
        confidence=score,
        reasons=reasons,
        conflicts=conflicts,
        requires_review=(0.75 <= score < 0.92) or hard_conflict,
    )

