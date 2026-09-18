"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { PRODUCTS_DATA } from "@/data/products";
import { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { RxConsultModal } from "@/components/product/RxConsultModal";
import { ProductQuickViewModal } from "@/components/product/ProductQuickViewModal";
import { FptPolyBadge } from "@/components/branding/FptPolyBadge";
import { Button } from "@/components/ui/Button";
import { formatVND } from "@/lib/utils";
import {
  ChevronRight,
  Home,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Stethoscope,
  ShoppingBag,
  Heart,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  Pill,
  FileText,
  Clock,
  Check,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const product = PRODUCTS_DATA.find((p) => p.slug === slug);

  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "overview" | "ingredients" | "indications" | "usage" | "precautions" | "storage"
  >("overview");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal state
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="max-w-lg mx-auto my-auto text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Không Tìm Thấy Sản Phẩm</h2>
          <p className="text-xs text-slate-500">
            Sản phẩm này có thể đã ngừng kinh doanh hoặc đường dẫn không chính xác.
          </p>
          <Link href="/products">
            <Button variant="primary" size="md">
              Khám Phá Danh Mục Thuốc
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Related products from same category
  const relatedProducts = PRODUCTS_DATA.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const discountPercent =
    product.salePrice && product.salePrice < product.price
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  const currentPrice = product.salePrice || product.price;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/80 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-brand-blue-600 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link href="/products" className="hover:text-brand-blue-600 transition-colors">
              Sản phẩm
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <Link
              href={`/category/${product.category}`}
              className="hover:text-brand-blue-600 transition-colors"
            >
              {product.categoryName}
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-semibold text-slate-800 line-clamp-1 max-w-xs">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Product Presentation Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-10">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* ================= CỘT TRÁI: GALLERY ẢNH SẢN PHẨM (5 CỘT) ================= */}
            <div className="lg:col-span-5 flex flex-col items-center">
              {/* Main Image Container */}
              <div className="relative w-full aspect-square rounded-3xl bg-slate-50/80 border border-slate-200 p-8 flex items-center justify-center overflow-hidden group">
                {/* Status Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                  {product.isPrescription ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      Thuốc kê đơn (Rx)
                    </span>
                  ) : (
                    <>
                      {discountPercent > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm">
                          Giảm {discountPercent}%
                        </span>
                      )}
                      {product.isBestSeller && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Bán chạy hàng đầu
                        </span>
                      )}
                    </>
                  )}
                </div>

                <img
                  src={product.images[selectedImgIdx] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Thumbnail Bar */}
              {product.images.length > 1 && (
                <div className="flex gap-3 mt-4 w-full overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImgIdx(idx)}
                      className={`w-18 h-18 rounded-2xl border-2 p-1.5 bg-slate-50 shrink-0 overflow-hidden transition-all ${
                        selectedImgIdx === idx
                          ? "border-brand-blue-600 shadow-sm"
                          : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Service Promises */}
              <div className="grid grid-cols-2 gap-3 mt-6 w-full pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">100% Chính Hãng</span>
                    <span className="text-[10px] text-slate-400">Kiểm định chuẩn GPP</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">Giao Nhanh 2H</span>
                    <span className="text-[10px] text-slate-400">Bảo quản lạnh GSP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= CỘT PHẢI: CHI TIẾT & HÀNH ĐỘNG MUA HÀNG (7 CỘT) ================= */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                {/* Brand & SKU Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-black text-brand-blue-700 uppercase tracking-wider">
                      {product.brand}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">Mã SKU: {product.sku}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsWishlisted(!isWishlisted)}
                      className={`p-2 rounded-full border transition-colors ${
                        isWishlisted
                          ? "bg-rose-50 text-rose-500 border-rose-200"
                          : "text-slate-400 hover:text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                      title="Lưu yêu thích"
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
                      title="Chia sẻ sản phẩm"
                    >
                      {copiedLink ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Product Title */}
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight mb-3">
                  {product.name}
                </h1>

                {/* Rating & Stock Status */}
                <div className="flex items-center gap-4 text-xs mb-5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(product.rating) ? "fill-current" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-slate-800">{product.rating}</span>
                    <span className="text-slate-400">({product.reviewCount} lượt đánh giá)</span>
                  </div>

                  <span className="text-slate-300">|</span>

                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Còn hàng tại hệ thống nhà thuốc
                  </span>
                </div>

                {/* Pricing Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-cyan-50/40 border border-blue-100 mb-6 flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-brand-blue-700">
                      {formatVND(currentPrice)}
                    </span>
                    {product.salePrice && (
                      <span className="text-base text-slate-400 line-through">
                        {formatVND(product.price)}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-600">
                      / {product.packaging}
                    </span>
                  </div>

                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                      Tiết kiệm {formatVND(product.price - product.salePrice!)}
                    </span>
                  )}
                </div>

                {/* Fast Medical Specs Card */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/90 rounded-2xl p-4 border border-slate-100 mb-6">
                  <div>
                    <span className="text-slate-400 block font-normal mb-0.5">Hoạt chất chính:</span>
                    <span className="font-bold text-slate-800">{product.activeIngredient}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal mb-0.5">Dạng bào chế:</span>
                    <span className="font-bold text-slate-800">{product.dosageForm}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal mb-0.5">Xuất xứ:</span>
                    <span className="font-bold text-slate-800">{product.origin}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-normal mb-0.5">Nhà sản xuất:</span>
                    <span className="font-bold text-slate-800 line-clamp-1">{product.manufacturer}</span>
                  </div>
                </div>

                {/* ================= QUY TẮC THUỐC KÊ ĐƠN / KHÔNG KÊ ĐƠN ================= */}
                {product.isPrescription ? (
                  /* GIAO DIỆN THUỐC KÊ ĐƠN (Rx) */
                  <div className="space-y-4 pt-2">
                    {/* Cảnh báo y tế bắt buộc theo quy định Bộ Y Tế */}
                    <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <p className="font-bold text-rose-800 uppercase tracking-wide mb-1">
                          Cảnh Báo Thuốc Kê Đơn (Rx)
                        </p>
                        <p>
                          Thuốc này chỉ được sử dụng khi có đơn chỉ định hợp lệ của Bác sĩ. Vui lòng gửi toa thuốc để Dược sĩ Đại học xác thực liều lượng và hỗ trợ cấp phát thuốc đúng quy định.
                        </p>
                      </div>
                    </div>

                    {/* CTA Tư Vấn & Gửi Đơn Thuốc */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full sm:flex-1 shadow-medical bg-gradient-to-r from-brand-blue-700 to-cyan-600"
                        leftIcon={<Stethoscope className="w-5 h-5" />}
                        onClick={() => setIsRxModalOpen(true)}
                      >
                        Gửi Đơn Thuốc & Nhận Tư Vấn
                      </Button>

                      <a href="tel:18006868" className="w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full border-brand-blue-300 text-brand-blue-700 hover:bg-brand-blue-50"
                        >
                          Hotline 1800 6868
                        </Button>
                      </a>
                    </div>
                  </div>
                ) : (
                  /* GIAO DIỆN THUỐC KHÔNG KÊ ĐƠN & TPCN BÌNH THƯỜNG */
                  <div className="space-y-5 pt-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Số lượng:
                      </span>
                      <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-xl transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-sm font-bold text-slate-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity((q) => q + 1)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-xl transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons: Add to Cart & Buy Now */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full sm:flex-1"
                        leftIcon={<ShoppingBag className="w-5 h-5" />}
                        onClick={() => {
                          alert(`Đã thêm ${quantity} sản phẩm ${product.name} vào giỏ hàng demo!`);
                        }}
                      >
                        Thêm Vào Giỏ Hàng
                      </Button>

                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full sm:flex-1 shadow-medical"
                        onClick={() => {
                          alert(`Chuyển đến trang thanh toán demo cho ${product.name}!`);
                        }}
                      >
                        Mua Ngay
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABS THÔNG TIN DƯỢC KHOA CHUYÊN SÂU ================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-10 shadow-sm space-y-6">
          <div className="border-b border-slate-200">
            <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto custom-scrollbar pb-px">
              {[
                { key: "overview", label: "Thông Tin Chung" },
                { key: "ingredients", label: "Thành Phần Hoạt Chất" },
                { key: "indications", label: "Chỉ Định & Công Dụng" },
                { key: "usage", label: "Cách Dùng & Liều Dùng" },
                { key: "precautions", label: "Chống Chỉ Định & Thận Trọng" },
                { key: "storage", label: "Bảo Quản & Nhà Sản Xuất" },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-3 px-1 text-xs sm:text-sm font-bold shrink-0 transition-all border-b-2 -mb-px ${
                      isActive
                        ? "border-brand-blue-600 text-brand-blue-700"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl space-y-4">
            {activeTab === "overview" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Mô tả sản phẩm</h3>
                <p>{product.description}</p>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1">Công dụng tóm tắt:</span>
                  <p className="text-slate-600">{product.usage}</p>
                </div>
              </div>
            )}

            {activeTab === "ingredients" && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Thành phần chi tiết</h3>
                <p className="font-semibold text-brand-blue-900 bg-brand-blue-50/80 p-3 rounded-xl border border-brand-blue-100">
                  {product.activeIngredient}
                </p>
                <p className="text-slate-500 text-xs">
                  Dạng bào chế: <span className="font-semibold text-slate-800">{product.dosageForm}</span> | Quy cách đóng gói: <span className="font-semibold text-slate-800">{product.packaging}</span>.
                </p>
              </div>
            )}

            {activeTab === "indications" && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Chỉ định điều trị</h3>
                <p>{product.indications}</p>
              </div>
            )}

            {activeTab === "usage" && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Hướng dẫn sử dụng & Liều dùng</h3>
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-emerald-950">
                  <p className="font-semibold mb-1">Khuyến cáo từ Dược sĩ:</p>
                  <p>{product.usage}</p>
                </div>
              </div>
            )}

            {activeTab === "precautions" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-rose-700 text-sm mb-1">Chống chỉ định:</h4>
                  <p>{product.contraindications}</p>
                </div>
                <div>
                  <h4 className="font-bold text-amber-700 text-sm mb-1">Thận trọng khi sử dụng:</h4>
                  <p>{product.precautions}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">Tác dụng phụ không mong muốn:</h4>
                  <p>{product.sideEffects}</p>
                </div>
              </div>
            )}

            {activeTab === "storage" && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">Bảo quản & Xuất xứ</h3>
                <p>
                  <span className="font-semibold">Bảo quản: </span>
                  {product.storage}
                </p>
                <p>
                  <span className="font-semibold">Nhà sản xuất: </span>
                  {product.manufacturer}
                </p>
                <p>
                  <span className="font-semibold">Nước sản xuất: </span>
                  {product.origin}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= SẢN PHẨM CÙNG DANH MỤC ================= */}
        {relatedProducts.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Sản Phẩm Cùng Danh Mục
                </h3>
                <p className="text-xs text-slate-500">
                  Các sản phẩm thuộc nhóm {product.categoryName} được người dùng tin chọn
                </p>
              </div>

              <Link
                href={`/category/${product.category}`}
                className="text-xs font-bold text-brand-blue-600 hover:underline"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  onOpenRxConsult={() => setIsRxModalOpen(true)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rx Consultation Modal */}
      <RxConsultModal
        product={product}
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
      />

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onOpenRxConsult={() => setIsRxModalOpen(true)}
      />

      {/* Academic Project Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 text-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <FptPolyBadge variant="dark" />
          <p className="text-[11px] text-slate-400">
            H4CARE Pharmacy • Đồ án sinh viên FPT Polytechnic • Hùng - Đức Anh - Hoàn - Cường
          </p>
        </div>
      </footer>
    </div>
  );
}
