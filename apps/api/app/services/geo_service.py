import math
from typing import Any, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Warehouse, AdministrativeUnit


PROVINCE_DEFAULT_COORDINATES: dict[str, tuple[float, float]] = {
    "79": (10.7769, 106.7009),   # TP. Hồ Chí Minh
    "01": (21.0285, 105.8542),   # Hà Nội
    "48": (16.0544, 108.2022),   # Đà Nẵng
    "92": (10.0452, 105.7469),   # Cần Thơ
    "31": (20.8449, 106.6881),   # Hải Phòng
}

# Tọa độ mặc định cho một số quận trung tâm
DISTRICT_DEFAULT_COORDINATES: dict[str, tuple[float, float]] = {
    # HCM
    "760": (10.7756, 106.7004),  # Quận 1
    "761": (10.8672, 106.6413),  # Quận 12
    "765": (10.8038, 106.7118),  # Bình Thạnh
    "769": (10.8494, 106.7537),  # TP Thủ Đức
    "770": (10.7844, 106.6844),  # Quận 3
    "771": (10.7672, 106.6669),  # Quận 10
    # HN
    "001": (21.0341, 105.8277),  # Ba Đình
    "002": (21.0307, 105.8524),  # Hoàn Kiếm
    "004": (21.0181, 105.8267),  # Đống Đa
    "005": (21.0090, 105.8548),  # Hai Bà Trưng
    "009": (21.0362, 105.7906),  # Cầu Giấy
}


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Tính khoảng cách giữa 2 điểm tọa độ địa lý (kinh độ, vĩ độ) bằng công thức Haversine.
    Kết quả trả về theo đơn vị Kilometers (km), làm tròn 2 chữ số thập phân.
    """
    R = 6371.0  # Bán kính Trái Đất (km)

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return round(distance, 2)


def get_estimated_delivery_time(distance_km: float) -> str:
    """
    Ước tính thời gian giao hàng dựa trên khoảng cách địa lý đến kho.
    """
    if distance_km <= 10.0:
        return "Giao siêu tốc 1 - 2 giờ (Nội thành cùng kho)"
    elif distance_km <= 35.0:
        return "Giao trong ngày 3 - 6 giờ (Khu vực lân cận)"
    elif distance_km <= 150.0:
        return "Giao trong 24 giờ (Ngoại thành / Tỉnh lân cận)"
    else:
        return "Giao 24 - 48 giờ (Chuyển phát tiêu chuẩn liên tỉnh)"


class GeoService:
    @classmethod
    def resolve_customer_coordinates(
        cls,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        province_code: Optional[str] = None,
        district_code: Optional[str] = None,
    ) -> tuple[float, float, str]:
        """
        Xác định tọa độ giao hàng từ GPS/Map Pin hoặc tra cứu fallback theo Quận/Huyện/Tỉnh.
        Trả về (lat, lng, resolution_source).
        """
        if lat is not None and lng is not None and -90 <= lat <= 90 and -180 <= lng <= 180:
            return float(lat), float(lng), "GPS_EXACT"

        if district_code and district_code in DISTRICT_DEFAULT_COORDINATES:
            d_lat, d_lng = DISTRICT_DEFAULT_COORDINATES[district_code]
            return d_lat, d_lng, "DISTRICT_CENTROID"

        if province_code and province_code in PROVINCE_DEFAULT_COORDINATES:
            p_lat, p_lng = PROVINCE_DEFAULT_COORDINATES[province_code]
            return p_lat, p_lng, "PROVINCE_CENTROID"

        # Tọa độ mặc định: Trung tâm TP. Hồ Chí Minh
        return 10.7769, 106.7009, "FALLBACK_DEFAULT"

    @classmethod
    def find_nearest_warehouses(
        cls,
        db: Session,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        province_code: Optional[str] = None,
        district_code: Optional[str] = None,
        address_text: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Tìm kiếm và xếp hạng các kho hàng đang hoạt động theo khoảng cách địa lý đến khách hàng.
        """
        cust_lat, cust_lng, source = cls.resolve_customer_coordinates(
            lat=lat, lng=lng, province_code=province_code, district_code=district_code
        )

        warehouses = db.scalars(
            select(Warehouse).where(Warehouse.is_active == True).order_by(Warehouse.id.asc())
        ).all()

        results = []
        for wh in warehouses:
            wh_lat = float(wh.lat) if wh.lat is not None else (10.7872 if "HCM" in wh.code else 21.0253)
            wh_lng = float(wh.lng) if wh.lng is not None else (106.7001 if "HCM" in wh.code else 105.8552)

            dist = calculate_haversine_distance(cust_lat, cust_lng, wh_lat, wh_lng)
            eta = get_estimated_delivery_time(dist)

            results.append({
                "warehouse_id": wh.id,
                "warehouse_code": wh.code,
                "warehouse_name": wh.name,
                "warehouse_address": wh.address,
                "lat": wh_lat,
                "lng": wh_lng,
                "distance_km": dist,
                "estimated_delivery_time": eta,
                "is_central": wh.is_central,
                "navigation_url": f"https://www.google.com/maps/dir/?api=1&origin={cust_lat},{cust_lng}&destination={wh_lat},{wh_lng}",
            })

        # Sắp xếp theo khoảng cách tăng dần
        results.sort(key=lambda x: x["distance_km"])

        nearest = results[0] if results else None

        return {
            "customer_location": {
                "lat": cust_lat,
                "lng": cust_lng,
                "source": source,
                "address": address_text or "",
            },
            "nearest_warehouse": nearest,
            "warehouses": results,
            "google_maps_view_url": f"https://www.google.com/maps/search/?api=1&query={cust_lat},{cust_lng}",
        }
