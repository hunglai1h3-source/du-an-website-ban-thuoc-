import re
import unicodedata
from dataclasses import dataclass


SPACE_RE = re.compile(r"\s+")
REGISTRATION_RE = re.compile(r"\b(?:VD|VN|QLĐB|QLSP|GC|SP|VS)[-\s]?[0-9]{2,6}[-\s]?[0-9]{2}\b", re.IGNORECASE)
STRENGTH_RE = re.compile(r"(?P<value>\d+(?:[.,]\d+)?)\s*(?P<unit>mcg|µg|ug|mg|g|ml|mL|%|IU|UI)\b", re.IGNORECASE)


def strip_accents(value: str) -> str:
    value = value.replace("đ", "d").replace("Đ", "D")
    normalized = unicodedata.normalize("NFD", value)
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn")


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = unicodedata.normalize("NFKC", value).strip()
    return SPACE_RE.sub(" ", value)


def normalize_for_match(value: str | None) -> str:
    if not value:
        return ""
    value = strip_accents(normalize_text(value) or "").lower()
    value = re.sub(r"[^a-z0-9%]+", " ", value)
    return SPACE_RE.sub(" ", value).strip()


def normalize_registration_number(value: str | None) -> str | None:
    if not value:
        return None
    compact = re.sub(r"\s+", "", value).upper()
    compact = compact.replace("–", "-").replace("—", "-")
    return compact or None


@dataclass(frozen=True)
class Strength:
    value: float
    unit: str
    display: str


def normalize_strength(value: float, unit: str) -> Strength:
    unit_key = unit.lower().replace("µ", "u")
    if unit_key == "g":
        normalized_value, normalized_unit = value * 1000, "mg"
    elif unit_key in {"mcg", "ug"}:
        normalized_value, normalized_unit = value, "mcg"
    elif unit_key in {"ml"}:
        normalized_value, normalized_unit = value, "mL"
    elif unit_key == "ui":
        normalized_value, normalized_unit = value, "IU"
    else:
        normalized_value, normalized_unit = value, unit
    shown = int(normalized_value) if float(normalized_value).is_integer() else normalized_value
    return Strength(float(normalized_value), normalized_unit, f"{shown} {normalized_unit}")


def extract_strengths(text: str | None) -> list[Strength]:
    if not text:
        return []
    results: list[Strength] = []
    for match in STRENGTH_RE.finditer(text):
        numeric = float(match.group("value").replace(",", "."))
        results.append(normalize_strength(numeric, match.group("unit")))
    return results


def extract_registration_number(text: str | None) -> str | None:
    if not text:
        return None
    match = REGISTRATION_RE.search(text)
    return normalize_registration_number(match.group(0)) if match else None

