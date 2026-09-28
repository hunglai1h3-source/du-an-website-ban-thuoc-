import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from app.core.config import settings


@dataclass
class CategoryClassificationResult:
    category_slug: str | None
    category_name: str | None
    subcategory_slug: str | None
    subcategory_name: str | None
    confidence: float
    reasoning: str
    model_version: str = "pharmatrust-cat-v1.0"
    requires_review: bool = False


# Danh mục tiêu chuẩn duy nhất của hệ thống PharmaTrust Storefront
VALID_CATEGORIES = {
    "thuoc-khong-ke-don": {
        "name": "Thuốc Không Kê Đơn",
        "subcategories": {
            "giam-dau-ha-sot": "Giảm đau & Hạ sốt",
            "tri-ho-cam-cum": "Trị ho, Cảm cúm & Viêm họng",
            "da-day-tieu-hoa": "Dạ dày & Tiêu hóa",
            "nho-mat-mui-tai": "Thuốc nhỏ mắt & Mũi tai",
            "say-xe-di-ung": "Chống say xe & Dị ứng",
            "khang-viem": "Kháng viêm & Phù nề",
            "ho-tro-dieu-tri": "Hỗ trợ điều trị chuyên khoa",
            "cham-soc-suc-khoe": "Chăm sóc sức khỏe thông thường",
        },
    },
    "thuoc-ke-don": {
        "name": "Thuốc Kê Đơn (Rx)",
        "subcategories": {
            "khang-sinh": "Kháng sinh & Kháng nấm",
            "tim-mach-huyet-ap": "Thuốc Tim mạch & Huyết áp",
            "tieu-duong": "Thuốc Trị Tiểu đường",
            "co-xuong-khop": "Cơ - Xương - Khớp",
            "than-kinh-giac-ngu": "Thần kinh & Giấc ngủ",
            "ho-hap-chuyen-sau": "Hô hấp chuyên sâu",
        },
    },
    "thuc-pham-chuc-nang": {
        "name": "Vitamin & Thực Phẩm Chức Năng",
        "subcategories": {
            "vitamin-khoang-chat": "Vitamin & Khoáng chất tổng hợp",
            "tang-mien-dich": "Tăng cường Miễn dịch",
            "bo-nao": "Bổ Não & Tăng trí nhớ",
            "bo-khop": "Glucosamine & Khớp xương",
            "omega-3": "Omega 3 & Sức khỏe Tim",
            "giai-doc-gan": "Thanh nhiệt & Giải độc gan",
        },
    },
    "duoc-my-pham": {
        "name": "Dược Mỹ Phẩm & Chăm Sóc Da",
        "subcategories": {
            "kem-chong-nang": "Kem chống nắng Y khoa",
            "sua-rua-mat": "Sữa rửa mặt dịu nhẹ",
            "tri-mun-phuc-hoi": "Trị mụn & Phục hồi da",
            "duong-am": "Kem dưỡng ẩm chuyên sâu",
            "serum-dac-tri": "Serum đặc trị thâm nám",
        },
    },
    "thiet-bi-y-te": {
        "name": "Thiết Bị & Dụng Cụ Y Tế",
        "subcategories": {
            "may-do-huyet-ap": "Máy đo Huyết áp điện tử",
            "may-do-duong-huyet": "Máy & Que đo Đường huyết",
            "nhiet-ke-spo2": "Nhiệt kế hồng ngoại & SpO2",
            "may-xong-khi-dung": "Máy xông khí dung mũi họng",
            "bang-gac-sat-trung": "Băng gạc & Sát trùng vết thương",
        },
    },
}


def _normalize(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text).lower().strip()
    return re.sub(r"\s+", " ", text)


# Tập luật nhận diện hoạt chất & từ khóa y khoa đã kiểm chứng
KEYWORD_RULES = [
    # 1. Kháng sinh kê đơn
    {
        "keywords": ["amoxicillin", "clavulanic", "augmentin", "zinnat", "cefuroxime", "cefixim", "ciprofloxacin", "clarithromycin", "klacid", "azithromycin", "zithromax", "kháng sinh"],
        "cat": "thuoc-ke-don",
        "sub": "khang-sinh",
        "confidence": 0.96,
        "reason": "Chứa hoạt chất kháng sinh phổ rộng theo danh mục kê đơn bắt buộc",
    },
    # 2. Tim mạch & Huyết áp
    {
        "keywords": ["concor", "bisoprolol", "amlor", "amlodipine", "coversyl", "perindopril", "lipitor", "atorvastatin", "crestor", "rosuvastatin", "plavix", "clopidogrel", "huyết áp", "tim mạch", "suy tim", "daflon", "diosmin"],
        "cat": "thuoc-ke-don",
        "sub": "tim-mach-huyet-ap",
        "confidence": 0.95,
        "reason": "Hoạt chất điều trị tim mạch, huyết áp hoặc bảo vệ thành mạch",
    },
    # 3. Tiểu đường
    {
        "keywords": ["glucophage", "metformin", "gliclazide", "diamicron", "tiểu đường", "hạ đường huyết", "insulin"],
        "cat": "thuoc-ke-don",
        "sub": "tieu-duong",
        "confidence": 0.95,
        "reason": "Hoạt chất kiểm soát đường huyết và đái tháo đường",
    },
    # 4. Cơ xương khớp kê đơn
    {
        "keywords": ["celebrex", "celecoxib", "mobic", "meloxicam", "voltaren", "diclofenac", "medrol", "methylprednisolone"],
        "cat": "thuoc-ke-don",
        "sub": "co-xuong-khop",
        "confidence": 0.93,
        "reason": "Kháng viêm NSAID hoặc Corticoid liều chỉ định",
    },
    # 5. Giảm đau & Hạ sốt OTC
    {
        "keywords": ["paracetamol", "efferalgan", "panadol", "hapacol", "acetaminophen", "hạ sốt", "giảm đau đầu"],
        "cat": "thuoc-khong-ke-don",
        "sub": "giam-dau-ha-sot",
        "confidence": 0.96,
        "reason": "Hoạt chất Paracetamol tiêu chuẩn giảm đau hạ sốt không kê đơn",
    },
    # 6. Dạ dày & Tiêu hóa OTC
    {
        "keywords": ["phosphalugel", "gaviscon", "duphalac", "lactulose", "smecta", "diosmectite", "nexium", "esomeprazole", "omeprazole", "trào ngược", "đau dạ dày", "tiêu chảy", "táo bón", "berberin"],
        "cat": "thuoc-khong-ke-don",
        "sub": "da-day-tieu-hoa",
        "confidence": 0.94,
        "reason": "Thuốc kháng acid, tráng niêm mạc, nhuận tràng hoặc cầm tiêu chảy",
    },
    # 7. Trị ho, Cảm cúm & Viêm họng OTC
    {
        "keywords": ["strepsils", "viên ngậm", "rát họng", "viêm họng", "bổ phế", "nam hà", "prospan", "siro ho", "eugica", "cảm cúm", "long đờm"],
        "cat": "thuoc-khong-ke-don",
        "sub": "tri-ho-cam-cum",
        "confidence": 0.94,
        "reason": "Chế phẩm trị ho thảo dược, viên ngậm sát khuẩn hoặc siro cảm cúm",
    },
    # 8. Nhỏ mắt mũi tai & Dị ứng OTC
    {
        "keywords": ["telfast", "fexofenadine", "clarityne", "loratadine", "cetirizine", "say xe", "dị ứng", "mày đay", "otrivin", "nhỏ mắt", "nước mắt nhân tạo"],
        "cat": "thuoc-khong-ke-don",
        "sub": "say-xe-di-ung",
        "confidence": 0.92,
        "reason": "Thuốc kháng histamin chống dị ứng hoặc chế phẩm nhỏ mắt mũi",
    },
    # 9. Vitamin & Khoáng chất
    {
        "keywords": ["berocca", "vitamin c", "vitamin b", "vitamin tổng hợp", "kẽm zinc", "canxi corbiere", "d3", "khoáng chất", "multivitamin"],
        "cat": "thuc-pham-chuc-nang",
        "sub": "vitamin-khoang-chat",
        "confidence": 0.93,
        "reason": "Chế phẩm bổ sung vi chất dinh dưỡng, vitamin và khoáng chất",
    },
    # 10. Hỗ trợ điều trị chuyên khoa OTC
    {
        "keywords": ["orlistat", "giảm béo", "giảm cân"],
        "cat": "thuoc-khong-ke-don",
        "sub": "ho-tro-dieu-tri",
        "confidence": 0.90,
        "reason": "Chế phẩm hỗ trợ điều trị thừa cân, béo phì",
    },
]


class AICategoryClassifier:
    """
    Module AI phân loại sản phẩm vào cây danh mục hiện có của PharmaTrust.
    Tuyệt đối không tự tạo danh mục mới, không ép vào danh mục gần nhất nếu không chắc chắn.
    """

    def __init__(self, threshold: float | None = None):
        self.threshold = threshold if threshold is not None else settings.category_ai_threshold

    def classify(
        self,
        name: str,
        ingredients: list[dict[str, Any]] | None = None,
        dosage_form: str | None = None,
        indications: str | None = None,
        source_category: str | None = None,
        is_rx: bool | None = None,
    ) -> CategoryClassificationResult:
        # Tổng hợp ngữ cảnh văn bản để phân tích
        ing_text = " ".join([str(i.get("name", "")) for i in (ingredients or [])])
        combined = _normalize(f"{name} {ing_text} {dosage_form or ''} {indications or ''} {source_category or ''}")

        best_match = None
        best_score = 0.0

        for rule in KEYWORD_RULES:
            matched_keywords = [kw for kw in rule["keywords"] if kw in combined]
            if matched_keywords:
                # Tăng điểm nếu khớp nhiều từ khóa hoạt chất cụ thể
                score = rule["confidence"]
                if len(matched_keywords) > 1:
                    score = min(0.99, score + 0.02 * (len(matched_keywords) - 1))
                
                # Cân nhắc cờ kê đơn (Rx)
                if is_rx is True and rule["cat"] == "thuoc-ke-don":
                    score = min(0.99, score + 0.02)
                elif is_rx is False and rule["cat"] == "thuoc-khong-ke-don":
                    score = min(0.99, score + 0.02)

                if score > best_score:
                    best_score = score
                    best_match = rule

        # Nếu tìm thấy luật phân loại với độ tin cậy >= threshold
        if best_match and best_score >= self.threshold:
            cat_slug = best_match["cat"]
            sub_slug = best_match["sub"]
            cat_info = VALID_CATEGORIES.get(cat_slug, {})
            cat_name = cat_info.get("name")
            sub_name = cat_info.get("subcategories", {}).get(sub_slug)

            return CategoryClassificationResult(
                category_slug=cat_slug,
                category_name=cat_name,
                subcategory_slug=sub_slug,
                subcategory_name=sub_name,
                confidence=round(best_score, 2),
                reasoning=best_match["reason"],
                requires_review=False,
            )

        # TRƯỜNG HỢP KHÔNG ĐỦ CHẮC CHẮN HOẶC KHÔNG CÓ DANH MỤC PHÙ HỢP:
        # Không ép vào danh mục gần nhất, đánh dấu cần Admin duyệt
        return CategoryClassificationResult(
            category_slug=None,
            category_name=None,
            subcategory_slug=None,
            subcategory_name=None,
            confidence=round(best_score, 2) if best_match else 0.0,
            reasoning="Độ chắc chắn của AI dưới ngưỡng quy định (0.85) hoặc không có từ khóa y khoa phù hợp.",
            requires_review=True,
        )


# Singleton
classifier = AICategoryClassifier()
