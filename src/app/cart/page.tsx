"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/cart/cart-context";
import { formatVND } from "@/lib/utils";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
    shippingFee,
    finalTotal,
    freeShippingThreshold,
    freeShippingRemaining,
  } = useCart();

  const [pharmacistNote, setPharmacistNote] = useState("");

  const freeShippingProgress = Math.min(
    100,
    Math.round((totalPrice / freeShippingThreshold) * 100)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/" className="hover:text-brand-blue-600 transition-colors">
            Trang Chủ
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Giỏ Hàng</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Giỏ Hàng Của Bạn
              </h1>
              <p className="text-xs text-slate-500">
                Đang có <strong className="text-brand-blue-600">{totalItems}</strong> sản phẩm y tế trong giỏ
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi giỏ hàng?")) {
                  clearCart();
                }
              }}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* ================= EMPTY CART STATE ================= */
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 text-brand-blue-500 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Bạn chưa chọn sản phẩm nào. Hãy khám phá danh mục thuốc chính hãng, thiết bị y tế và TPCN chuẩn GPP tại H4CARE.
            </p>
            <div className="pt-2">
              <Link href="/products">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Khám Phá Danh Mục Thuốc
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* ================= ACTIVE CART CONTENT ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Column (Items List & Notes) - 8 cols */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Free Shipping Progress Indicator */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  {freeShippingRemaining === 0 ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Chúc mừng! Đơn hàng được MIỄN PHÍ VẬN CHUYỂN toàn quốc!
                    </span>
                  ) : (
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-brand-blue-600 shrink-0" />
                      Mua thêm{" "}
                      <strong className="text-brand-blue-700">
                        {formatVND(freeShippingRemaining)}
                      </strong>{" "}
                      để được MIỄN PHÍ SHIP!
                    </span>
                  )}
                  <span className="text-slate-400 font-semibold">{freeShippingProgress}%</span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-blue-600 to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                {items.map((item) => {
                  const currentPrice =
                    item.product.salePrice || item.product.price;
                  const itemSubtotal = currentPrice * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50"
                    >
                      {/* Product details */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 text-2xl select-none">
                          💊
                        </div>

                        <div className="space-y-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {item.product.brand}
                          </span>
                          <Link
                            href={`/product/${item.product.slug}`}
                            className="text-sm font-bold text-slate-900 hover:text-brand-blue-600 transition-colors line-clamp-1 block"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            Quy cách: {item.product.packaging}
                          </p>
                          {item.product.isPrescription && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              Thuốc kê đơn (Cần toa Bác sĩ)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controller & Price */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-xl transition-colors cursor-pointer"
                            title="Giảm số lượng"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-xl transition-colors cursor-pointer"
                            title="Tăng số lượng"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right min-w-[90px]">
                          <span className="text-sm font-extrabold text-brand-blue-700 block">
                            {formatVND(itemSubtotal)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {formatVND(currentPrice)} / đv
                          </span>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pharmacist Consultation Note */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <FileText className="w-4 h-4 text-brand-blue-600" />
                  <span>Ghi chú hướng dẫn cho Dược sĩ chuẩn bị thuốc:</span>
                </label>
                <textarea
                  rows={2}
                  value={pharmacistNote}
                  onChange={(e) => setPharmacistNote(e.target.value)}
                  placeholder="Ví dụ: Người bệnh có tiền sử đau dạ dày, vui lòng hướng dẫn cách uống chi tiết..."
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400 resize-none"
                />
              </div>

              {/* Continue Shopping Link */}
              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue-600 hover:text-brand-blue-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Tiếp tục chọn thêm sản phẩm y tế</span>
                </Link>
              </div>
            </div>

            {/* Right Column (Order Summary Card) - 4 cols */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                  Tóm Tắt Đơn Hàng
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính ({totalItems} sản phẩm):</span>
                    <span className="font-bold text-slate-900">{formatVND(totalPrice)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển:</span>
                    {shippingFee === 0 ? (
                      <span className="font-bold text-emerald-600">MIỄN PHÍ</span>
                    ) : (
                      <span className="font-bold text-slate-900">{formatVND(shippingFee)}</span>
                    )}
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Tích lũy hội viên (+2%):</span>
                    <span className="font-bold text-brand-blue-600">
                      +{formatVND(Math.round(totalPrice * 0.02))}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-brand-blue-700 block">
                        {formatVND(finalTotal)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        (Đã bao gồm thuế VAT nếu có)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Checkout Button */}
                <Link href="/checkout" className="block pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full shadow-medical bg-gradient-to-r from-brand-blue-600 via-brand-blue-700 to-cyan-600"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Tiến Hành Đặt Hàng
                  </Button>
                </Link>

                {/* Pharmacy Security Badges */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-brand-blue-600 shrink-0" />
                    <span>100% Thuốc chính hãng có nguồn gốc rõ ràng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-blue-600 shrink-0" />
                    <span>Giao thuốc hỏa tốc 2 giờ nội thành</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-brand-blue-600 shrink-0" />
                    <span>Đổi trả 30 ngày tận nhà nếu có lỗi</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
