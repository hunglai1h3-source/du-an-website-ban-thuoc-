import hashlib
import json
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings
from app.services.normalization import extract_registration_number, extract_strengths, normalize_text


class IngredientExtraction(BaseModel):
    name: str
    strength_value: float | None = None
    strength_unit: str | None = None


class ProductExtractionSchema(BaseModel):
    product_name: str | None = None
    registration_number: str | None = None
    ingredients: list[IngredientExtraction] = Field(default_factory=list)
    manufacturer: str | None = None
    manufacturing_country: str | None = None
    dosage_form: str | None = None
    route: str | None = None
    package_description: str | None = None
    rx_otc_status: str = "UNKNOWN"
    field_confidences: dict[str, float] = Field(default_factory=dict)


@dataclass
class AIExtractionResult:
    data: ProductExtractionSchema
    provider: str
    model: str
    prompt_hash: str
    fallback_used: bool = False
    warnings: list[str] = field(default_factory=list)


SYSTEM_PROMPT = """Bạn trích xuất dữ liệu từ tài liệu thuốc tiếng Việt.
Chỉ lấy thông tin xuất hiện trong văn bản. Không suy đoán, không bổ sung kiến thức bên ngoài.
Trường không có phải để null hoặc danh sách rỗng. Không tạo chỉ định, liều dùng hay lời khuyên y khoa.
Trả về JSON đúng schema được yêu cầu."""


class AIProvider(ABC):
    @abstractmethod
    def extract_product(self, text: str) -> AIExtractionResult:
        raise NotImplementedError

    @abstractmethod
    def health(self) -> dict:
        raise NotImplementedError


class RuleBasedAIProvider(AIProvider):
    def extract_product(self, text: str) -> AIExtractionResult:
        lines = [normalize_text(line) for line in text.splitlines() if normalize_text(line)]
        registration = extract_registration_number(text)
        manufacturer = _find_after_label(text, ["Nhà sản xuất", "Sản xuất bởi"])
        ingredient_text = _find_after_label(text, ["Thành phần", "Hoạt chất"])
        strengths = extract_strengths(ingredient_text)
        ingredients = []
        if ingredient_text:
            ingredients.append(
                IngredientExtraction(
                    name=ingredient_text.split(strengths[0].display.split()[0])[0].strip(" :-,") if strengths else ingredient_text,
                    strength_value=strengths[0].value if strengths else None,
                    strength_unit=strengths[0].unit if strengths else None,
                )
            )
        data = ProductExtractionSchema(
            product_name=lines[0] if lines else None,
            registration_number=registration,
            manufacturer=manufacturer,
            ingredients=ingredients,
            dosage_form=_find_after_label(text, ["Dạng bào chế"]),
            route=_find_after_label(text, ["Đường dùng"]),
            package_description=_find_after_label(text, ["Quy cách"]),
            field_confidences={"product_name": 0.45, "registration_number": 0.8 if registration else 0.0},
        )
        return AIExtractionResult(
            data=data,
            provider="rule_based",
            model="regex-v1",
            prompt_hash=hashlib.sha256(b"rule-based-v1").hexdigest(),
        )

    def health(self) -> dict:
        return {"provider": "rule_based", "status": "available", "model": "regex-v1"}


class OllamaAIProvider(AIProvider):
    def __init__(self):
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
        self.client = httpx.Client(timeout=15)

    def extract_product(self, text: str) -> AIExtractionResult:
        prompt_hash = hashlib.sha256((SYSTEM_PROMPT + text).encode()).hexdigest()
        payload = {
            "model": self.model,
            "stream": False,
            "format": ProductExtractionSchema.model_json_schema(),
            "options": {"temperature": 0},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": text[:16000]},
            ],
        }
        last_error = None
        for _ in range(3):
            try:
                response = self.client.post(f"{self.base_url}/api/chat", json=payload)
                response.raise_for_status()
                content = response.json()["message"]["content"]
                data = ProductExtractionSchema.model_validate(json.loads(content))
                return AIExtractionResult(data=data, provider="ollama", model=self.model, prompt_hash=prompt_hash)
            except (httpx.HTTPError, KeyError, json.JSONDecodeError, ValidationError) as exc:
                last_error = exc
        raise RuntimeError(f"Ollama extraction failed: {type(last_error).__name__}")

    def health(self) -> dict:
        try:
            response = self.client.get(f"{self.base_url}/api/tags", timeout=3)
            response.raise_for_status()
            models = [item.get("name") for item in response.json().get("models", [])]
            return {"provider": "ollama", "status": "available", "model": self.model, "installed": self.model in models}
        except httpx.HTTPError:
            return {"provider": "ollama", "status": "unavailable", "model": self.model}


class FallbackAIProvider(AIProvider):
    def __init__(self, primary: AIProvider, fallback: AIProvider):
        self.primary = primary
        self.fallback = fallback

    def extract_product(self, text: str) -> AIExtractionResult:
        try:
            return self.primary.extract_product(text)
        except RuntimeError as exc:
            result = self.fallback.extract_product(text)
            result.fallback_used = True
            result.warnings.append(str(exc))
            return result

    def health(self) -> dict:
        return {"primary": self.primary.health(), "fallback": self.fallback.health()}


def get_ai_provider() -> AIProvider:
    fallback = RuleBasedAIProvider()
    if settings.ai_provider.lower() == "ollama":
        return FallbackAIProvider(OllamaAIProvider(), fallback)
    return fallback


def _find_after_label(text: str, labels: list[str]) -> str | None:
    for label in labels:
        match = re.search(rf"{re.escape(label)}\s*[:\-]\s*([^\n\r]+)", text, re.IGNORECASE)
        if match:
            return normalize_text(match.group(1))
    return None

