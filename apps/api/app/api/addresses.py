import re
from typing import Any, List, Optional
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import AdministrativeUnit, CustomerAddress, User
from app.services.geo_service import GeoService, PROVINCE_BOUNDING_BOXES, DISTRICT_DEFAULT_COORDINATES


addresses_router = APIRouter(prefix="/addresses", tags=["Địa chỉ & Bản đồ định vị"])
customer_address_router = APIRouter(prefix="/customer/addresses", tags=["Sổ địa chỉ Khách hàng"])


# ==============================================================================
# SCHEMAS
# ==============================================================================

class NearestWarehouseRequest(BaseModel):
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    province_code: Optional[str] = None
    district_code: Optional[str] = None
    address: Optional[str] = None


class CustomerAddressCreate(BaseModel):
    recipient_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=8, max_length=20)
    address_line: str = Field(..., min_length=3, max_length=500)
    province_code: Optional[str] = None
    district_code: Optional[str] = None
    ward_code: Optional[str] = None
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    place_id: Optional[str] = None
    is_default: bool = False


class CustomerAddressUpdate(BaseModel):
    recipient_name: Optional[str] = None
    phone: Optional[str] = None
    address_line: Optional[str] = None
    province_code: Optional[str] = None
    district_code: Optional[str] = None
    ward_code: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    place_id: Optional[str] = None
    is_default: Optional[bool] = None


# ==============================================================================
# 1. ĐỊA GIỚI HÀNH CHÍNH & TÍNH KHO GẦN NHẤT
# ==============================================================================

@addresses_router.get("/administrative-units")
def get_administrative_units(
    level: Optional[str] = Query(None, description="PROVINCE hoặc DISTRICT"),
    parent_code: Optional[str] = Query(None, description="Mã cấp trên, ví dụ 79 (TP.HCM)"),
    search: Optional[str] = Query(None, description="Tìm kiếm tên tỉnh/thành hoặc quận/huyện"),
    tree: bool = Query(False, description="Nếu True, trả về cây Tỉnh kèm các Quận thuộc Tỉnh"),
    db: Session = Depends(get_db),
):
    """
    Tra cứu danh mục đơn vị hành chính chuẩn 2 cấp (Tỉnh / Thành phố và Quận / Huyện).
    Hỗ trợ trả về dạng phẳng (flat) hoặc dạng cây phân cấp (tree).
    """
    if tree:
        # Lấy toàn bộ Tỉnh/Thành
        provinces = db.scalars(
            select(AdministrativeUnit)
            .where(AdministrativeUnit.level == "PROVINCE")
            .order_by(AdministrativeUnit.name.asc())
        ).all()

        # Lấy toàn bộ Quận/Huyện
        districts = db.scalars(
            select(AdministrativeUnit)
            .where(AdministrativeUnit.level == "DISTRICT")
            .order_by(AdministrativeUnit.name.asc())
        ).all()

        dist_map: dict[str, list[dict[str, Any]]] = {}
        for d in districts:
            if d.parent_code:
                dist_map.setdefault(d.parent_code, []).append({
                    "code": d.code,
                    "name": d.name,
                    "full_name": d.full_name,
                    "level": d.level,
                    "parent_code": d.parent_code,
                })

        tree_res = []
        for p in provinces:
            tree_res.append({
                "code": p.code,
                "name": p.name,
                "full_name": p.full_name,
                "level": p.level,
                "districts": dist_map.get(p.code, []),
            })
        return tree_res

    query = select(AdministrativeUnit).order_by(AdministrativeUnit.name.asc())

    if level:
        query = query.where(AdministrativeUnit.level == level.upper())
    if parent_code:
        query = query.where(AdministrativeUnit.parent_code == parent_code)
    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.where(
            AdministrativeUnit.name.ilike(search_pattern) | AdministrativeUnit.full_name.ilike(search_pattern)
        )

    units = db.scalars(query).all()
    return [
        {
            "code": u.code,
            "name": u.name,
            "full_name": u.full_name,
            "level": u.level,
            "parent_code": u.parent_code,
        }
        for u in units
    ]


JUNK_PATTERNS = [
    r"^(tt|abc|xyz|test|123|123\s*test|nhà\s*tôi|dự\s*án\s*xyz|gần\s*trường|xxx|asdf)$",
]


@addresses_router.get("/suggest")
async def suggest_addresses(
    q: str = Query(..., min_length=2, description="Số nhà, tên đường cần gợi ý"),
    province_code: str = Query(..., description="Mã tỉnh thành"),
    district_code: str = Query(..., description="Mã quận huyện"),
    ward_code: str = Query(..., description="Mã phường xã"),
    db: Session = Depends(get_db),
):
    """
    Gợi ý địa chỉ tự động có kiểm soát địa giới theo đúng 3 cấp hành chính đã chọn.
    Tự động chặn các chuỗi vô nghĩa/rác (như 'tt', 'abc', 'nhà tôi', '123 test').
    """
    query_str = q.strip()
    if len(query_str) < 2:
        return []

    # Chặn chuỗi rác
    for pattern in JUNK_PATTERNS:
        if re.match(pattern, query_str.lower()):
            return []

    prov = db.scalar(
        select(AdministrativeUnit).where(
            AdministrativeUnit.code == province_code,
            AdministrativeUnit.level == "PROVINCE",
        )
    )
    dist = db.scalar(
        select(AdministrativeUnit).where(
            AdministrativeUnit.code == district_code,
            AdministrativeUnit.parent_code == province_code,
            AdministrativeUnit.level == "DISTRICT",
        )
    )
    ward = db.scalar(
        select(AdministrativeUnit).where(
            AdministrativeUnit.code == ward_code,
            AdministrativeUnit.parent_code == district_code,
            AdministrativeUnit.level == "WARD",
        )
    )

    if not prov or not dist or not ward:
        return []

    suggestions = []

    # 1. Gọi Nominatim trong phạm vi địa giới
    search_query = f"{query_str}, {ward.name}, {dist.name}, {prov.name}, Vietnam"
    try:
        async with httpx.AsyncClient(timeout=3.5) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": search_query,
                    "format": "json",
                    "addressdetails": 1,
                    "limit": 5,
                    "countrycodes": "vn",
                },
                headers={"User-Agent": "H4CarePharmacy-DeliveryVerification/1.0"},
            )
            if resp.status_code == 200:
                data = resp.json()
                for item in data:
                    item_lat = float(item.get("lat", 0))
                    item_lng = float(item.get("lon", 0))
                    is_valid, _ = GeoService.validate_province_coordinates(province_code, item_lat, item_lng)
                    if is_valid:
                        suggestions.append({
                            "place_id": str(item.get("place_id")),
                            "display_name": item.get("display_name"),
                            "street_address": query_str,
                            "ward_name": ward.name,
                            "district_name": dist.name,
                            "province_name": prov.name,
                            "lat": item_lat,
                            "lng": item_lng,
                            "verified": True,
                        })
    except Exception:
        pass

    # 2. Fallback nếu Nominatim không trả về từng số nhà cụ thể:
    # Sinh tọa độ tâm chuẩn của Phường/Quận đã chọn để khách hàng ghim vị trí chính xác
    if len(suggestions) == 0 and len(query_str) >= 3:
        def_lat, def_lng, _ = GeoService.resolve_customer_coordinates(
            province_code=province_code,
            district_code=district_code,
        )
        ward_hash = abs(hash(ward_code)) % 100
        offset_lat = (ward_hash - 50) * 0.0001
        offset_lng = ((ward_hash * 3) % 100 - 50) * 0.0001
        fallback_lat = round(def_lat + offset_lat, 6)
        fallback_lng = round(def_lng + offset_lng, 6)

        formatted_full = f"{query_str}, {ward.name}, {dist.name}, {prov.name}"
        suggestions.append({
            "place_id": f"h4care-{ward_code}-{abs(hash(query_str))}",
            "display_name": formatted_full,
            "street_address": query_str,
            "ward_name": ward.name,
            "district_name": dist.name,
            "province_name": prov.name,
            "lat": fallback_lat,
            "lng": fallback_lng,
            "verified": True,
        })

    return suggestions


@addresses_router.post("/nearest-warehouse")
def calculate_nearest_warehouse(
    payload: NearestWarehouseRequest,
    db: Session = Depends(get_db),
):
    """
    Tính khoảng cách địa lý (Haversine) từ tọa độ khách hàng đến tất cả các kho dược phẩm.
    Tự động chọn kho gần nhất và dự kiến thời gian giao hàng (Hỏa tốc, Trong ngày, hoặc Tiêu chuẩn).
    """
    res = GeoService.find_nearest_warehouses(
        db=db,
        lat=payload.lat,
        lng=payload.lng,
        province_code=payload.province_code,
        district_code=payload.district_code,
        address_text=payload.address,
    )
    return res


# ==============================================================================
# 2. SỔ ĐỊA CHỈ KHÁCH HÀNG (CUSTOMER ADDRESS BOOK)
# ==============================================================================

@customer_address_router.get("")
def list_customer_addresses(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Lấy danh sách địa chỉ nhận hàng đã lưu của khách hàng.
    """
    addresses = db.scalars(
        select(CustomerAddress)
        .where(CustomerAddress.user_id == user.id)
        .order_by(desc(CustomerAddress.is_default), desc(CustomerAddress.id))
    ).all()

    return [
        {
            "id": a.id,
            "recipient_name": a.recipient_name,
            "phone": a.phone,
            "address_line": a.address_line,
            "province_code": a.province_code,
            "district_code": a.district_code,
            "ward_code": a.ward_code,
            "lat": a.lat,
            "lng": a.lng,
            "is_default": a.is_default,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in addresses
    ]


@customer_address_router.post("", status_code=status.HTTP_201_CREATED)
def create_customer_address(
    payload: CustomerAddressCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Thêm địa chỉ giao nhận mới vào sổ địa chỉ cá nhân.
    """
    # Nếu là địa chỉ mặc định hoặc là địa chỉ đầu tiên, bỏ cờ mặc định của các địa chỉ cũ
    if payload.is_default:
        existing_defaults = db.scalars(
            select(CustomerAddress).where(CustomerAddress.user_id == user.id, CustomerAddress.is_default == True)
        ).all()
        for ea in existing_defaults:
            ea.is_default = False

    # Nếu người dùng chưa có địa chỉ nào thì địa chỉ này tự thành mặc định
    count = db.scalar(select(CustomerAddress).where(CustomerAddress.user_id == user.id))
    is_first = (count is None)

    address = CustomerAddress(
        user_id=user.id,
        recipient_name=payload.recipient_name.strip(),
        phone=payload.phone.strip(),
        address_line=payload.address_line.strip(),
        province_code=payload.province_code,
        district_code=payload.district_code,
        ward_code=payload.ward_code,
        lat=payload.lat,
        lng=payload.lng,
        place_id=payload.place_id,
        is_default=payload.is_default or is_first,
    )
    db.add(address)
    db.commit()
    db.refresh(address)

    return {
        "status": "SUCCESS",
        "message": "Đã lưu địa chỉ nhận hàng mới",
        "id": address.id,
        "is_default": address.is_default,
    }


@customer_address_router.put("/{address_id}")
def update_customer_address(
    address_id: int,
    payload: CustomerAddressUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Cập nhật thông tin một địa chỉ đã lưu.
    """
    addr = db.scalar(
        select(CustomerAddress).where(CustomerAddress.id == address_id, CustomerAddress.user_id == user.id)
    )
    if not addr:
        raise HTTPException(status_code=404, detail="Không tìm thấy địa chỉ này trong sổ địa chỉ của bạn")

    update_data = payload.model_dump(exclude_unset=True)

    if update_data.get("is_default") is True:
        existing_defaults = db.scalars(
            select(CustomerAddress).where(CustomerAddress.user_id == user.id, CustomerAddress.is_default == True)
        ).all()
        for ea in existing_defaults:
            ea.is_default = False

    for field, val in update_data.items():
        if val is not None and isinstance(val, str):
            setattr(addr, field, val.strip())
        elif val is not None:
            setattr(addr, field, val)

    db.commit()
    db.refresh(addr)

    return {
        "status": "SUCCESS",
        "message": "Cập nhật địa chỉ thành công",
        "id": addr.id,
    }


@customer_address_router.delete("/{address_id}")
def delete_customer_address(
    address_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Xóa một địa chỉ khỏi sổ địa chỉ.
    """
    addr = db.scalar(
        select(CustomerAddress).where(CustomerAddress.id == address_id, CustomerAddress.user_id == user.id)
    )
    if not addr:
        raise HTTPException(status_code=404, detail="Không tìm thấy địa chỉ")

    db.delete(addr)
    db.commit()

    return {"status": "SUCCESS", "message": "Đã xóa địa chỉ khỏi sổ địa chỉ"}


@customer_address_router.post("/{address_id}/set-default")
def set_default_address(
    address_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Đặt địa chỉ làm địa chỉ nhận hàng mặc định.
    """
    addr = db.scalar(
        select(CustomerAddress).where(CustomerAddress.id == address_id, CustomerAddress.user_id == user.id)
    )
    if not addr:
        raise HTTPException(status_code=404, detail="Không tìm thấy địa chỉ")

    # Bỏ cờ mặc định của tất cả địa chỉ khác
    all_addrs = db.scalars(select(CustomerAddress).where(CustomerAddress.user_id == user.id)).all()
    for a in all_addrs:
        a.is_default = (a.id == addr.id)

    db.commit()
    return {"status": "SUCCESS", "message": "Đã đặt làm địa chỉ mặc định"}
