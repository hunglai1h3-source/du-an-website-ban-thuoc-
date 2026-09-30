import json
import sys
from datetime import datetime, timezone

# Ensure utf-8 encoding on Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.db.session import SessionLocal
from app.models.inventory import ProductReview, SeasonalCampaign


def seed_campaigns_and_reviews():
    db = SessionLocal()
    try:
        # 1. Seed Seasonal Campaigns
        existing_campaigns = db.query(SeasonalCampaign).count()
        if existing_campaigns == 0:
            campaigns = [
                SeasonalCampaign(
                    slug="phong-ngua-sot-xuat-huyet",
                    title="Phòng Ngừa & Chăm Sóc Sốt Xuất Huyết Mùa Mưa",
                    disease_name="Sốt Xuất Huyết Dengue",
                    season="MUA_MUA",
                    symptoms="Sốt cao đột ngột liên tục từ 39-40°C, đau hốc mắt, đau mỏi cơ khớp, xuất hiện nốt xuất huyết dưới da, chảy máu cam.",
                    prevention="Diệt lăng quăng, bọ gậy; nằm màn chống muỗi; sử dụng thuốc hạ sốt Paracetamol đúng liều lượng chỉ định; tuyệt đối không tự ý dùng Aspirin hay Ibuprofen vì gây nguy cơ xuất huyết tiêu hóa; bù điện giải Oresol đầy đủ.",
                    recommended_product_ids=json.dumps([72, 230, 43]),
                    status="ACTIVE",
                    banner_image_url="https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=1200&auto=format&fit=crop&q=80",
                ),
                SeasonalCampaign(
                    slug="cam-cum-mua-dong-ho-hap",
                    title="Chăm Sóc & Phòng Ngừa Viêm Đường Hô Hấp Mùa Lạnh",
                    disease_name="Cảm Cúm & Viêm Phế Quản",
                    season="DONG",
                    symptoms="Hắt hơi, nghẹt mũi, chảy nước mũi trong, đau rát cổ họng, ho có đờm hoặc ho khan, ớn lạnh, đau đầu mệt mỏi.",
                    prevention="Giữ ấm cổ họng và ngực, súc họng bằng nước muối sinh lý hàng ngày, bổ sung Vitamin C tăng sức đề kháng tự nhiên, dùng siro thảo dược giảm ho an toàn theo khuyến cáo GPP.",
                    recommended_product_ids=json.dumps([195, 72, 43]),
                    status="ACTIVE",
                    banner_image_url="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80",
                ),
                SeasonalCampaign(
                    slug="tang-suc-de-khang-mua-he",
                    title="Giải Nhiệt & Tăng Cường Vi Chất Mùa Nắng Nóng",
                    disease_name="Say Nắng & Rối Loạn Điện Giải Mùa Hè",
                    season="HA",
                    symptoms="Mệt mỏi suy nhược, mất nước nhanh, khô rát miệng, chuột rút cơ bắp, chóng mặt khi làm việc dưới thời tiết nắng nóng.",
                    prevention="Uống đủ 2-2.5 lít nước mỗi ngày, bổ sung viên sủi vi chất và khoáng chất hòa tan, tránh tiếp xúc trực tiếp với ánh nắng gắt giờ trưa từ 11h - 15h.",
                    recommended_product_ids=json.dumps([43, 230]),
                    status="ACTIVE",
                    banner_image_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80",
                ),
            ]
            db.add_all(campaigns)
            db.commit()
            print("[OK] Da seed 3 Chien dich benh theo mua (Seasonal Campaigns) thanh cong!")
        else:
            print(f"[INFO] Da co {existing_campaigns} chien dich trong CSDL, bo qua seed campaign.")

        # 2. Seed Verified Reviews
        existing_reviews = db.query(ProductReview).count()
        if existing_reviews == 0:
            reviews = [
                ProductReview(
                    canonical_product_id=72,
                    customer_name="Chị Thu Hằng",
                    rating=5,
                    comment="Bột hạ sốt Hapacol này vị cam rất thơm ngọt, bé nhà mình chịu uống không bị nôn trớ như dạng viên. Thuốc hạ sốt nhanh sau khoảng 30 phút. Giao hàng từ kho gần nhà rất nhanh.",
                    is_verified_purchase=True,
                    is_approved=True,
                ),
                ProductReview(
                    canonical_product_id=72,
                    customer_name="Anh Minh Trí",
                    rating=5,
                    comment="Hộp thuốc đóng gói cẩn thận, hạn sử dụng còn rất xa tới tận cuối năm 2026. Có dán tem niêm phong chuẩn GPP của nhà thuốc.",
                    is_verified_purchase=True,
                    is_approved=True,
                ),
                ProductReview(
                    canonical_product_id=43,
                    customer_name="Trần Hoàng Nam",
                    rating=5,
                    comment="Viên sủi Berocca vị cam thơm ngon, uống vào thấy tỉnh táo và đỡ mệt hẳn sau những ngày làm việc căng thẳng. Giá tốt hơn mua ngoài tiệm thuốc lẻ.",
                    is_verified_purchase=True,
                    is_approved=True,
                ),
                ProductReview(
                    canonical_product_id=43,
                    customer_name="Phạm Thị Bích",
                    rating=4,
                    comment="Sản phẩm chính hãng, uống rất tốt, mình mua định kỳ cho cả nhà dùng tăng đề kháng. Chỉ tiếc là hộp sủi hơi to mang đi du lịch hơi cồng kềnh tí.",
                    is_verified_purchase=True,
                    is_approved=True,
                ),
                ProductReview(
                    canonical_product_id=195,
                    customer_name="Nguyễn Văn Đức",
                    rating=5,
                    comment="Siro Mekobee chanh đào mật ong vị dịu họng rất dễ chịu, mình bị ho khan mùa lạnh ngậm vào êm hẳn cổ họng. Đóng gói thuốc có túi khí chống sốc chuyên dụng.",
                    is_verified_purchase=True,
                    is_approved=True,
                ),
                ProductReview(
                    canonical_product_id=230,
                    customer_name="Lê Hồng Nhung",
                    rating=5,
                    comment="Efferalgan sủi của Pháp dùng từ xưa giờ vẫn là êm nhất, không xót ruột. Rất hài lòng với dịch vụ tư vấn của Dược sĩ PharmaTrust.",
                    is_verified_purchase=True,
                    is_approved=True,
                ),
            ]
            db.add_all(reviews)
            db.commit()
            print("[OK] Da seed 6 Danh gia xac thuc (Verified Reviews) cho cac san pham tieu bieu thanh cong!")
        else:
            print(f"[INFO] Da co {existing_reviews} danh gia trong CSDL, bo qua seed reviews.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_campaigns_and_reviews()
