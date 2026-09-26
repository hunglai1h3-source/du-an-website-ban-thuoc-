"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/cart/cart-context";
import { useAuth } from "@/lib/auth/auth-context";
import { formatVND } from "@/lib/utils";
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Truck,
  CheckCircle2,
  CreditCard,
  Banknote,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Phone,
  User,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalItems, totalPrice, shippingFee, finalTotal, clearCart } =
    useCart();

  // Form Fields
  const [fullName, setFullName] = useState(user?.fullName || "Nguyễn Văn An");
  const [phone, setPhone] = useState(user?.phone || "0901234567");
  const [email, setEmail] = useState(user?.email || "an.nguyen@example.com");
  const [city, setCity] = useState("Hồ Chí Minh");
  const [district, setDistrict] = useState("Quận 1");
  const [ward, setWard] = useState("Phường Bến Nghé");
  const [address, setAddress] = useState("123 Lê Duẩn");
  const [shippingMethod, setShippingMethod] = useState<"fast2h" | "store">("fast2h");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "vietqr">("cod");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg("Vui lòng nhập họ và tên người nhận thuốc.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setErrorMsg("Vui lòng nhập số điện thoại người nhận hợp lệ.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ giao hàng cụ thể.");
      return;
    }

    setIsSubmitting(true);

    // Generate realistic order ID
    const randomCode = "H4C-" + Math.floor(100000 + Math.random() * 900000);

    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      router.push(
        `/checkout/success?orderId=${randomCode}&name=${encodeURIComponent(
          fullName
        )}&phone=${encodeURIComponent(phone)}&total=${finalTotal}&method=${paymentMethod}`
      );
    }, 700);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-16 text-center space-y-4 my-auto">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-brand-blue-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Chưa có sản phẩm để thanh toán
          </h2>
          <p className="text-xs text-slate-500">
            Giỏ hàng của bạn đang trống. Vui lòng chọn sản phẩm thuốc trước khi tiến hành đặt hàng.
          </p>
          <Link href="/products">
            <Button variant="primary" size="md">
              Xem Danh Mục Sản Phẩm
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/" className="hover:text-brand-blue-600 transition-colors">
            Trang Chủ
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-brand-blue-600 transition-colors">
            Giỏ Hàng
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Thanh Toán & Đặt Hàng</span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Form: Receiver, Shipping, Payment (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Thông tin người nhận */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-brand-blue-50 text-brand-blue-700 text-xs font-black flex items-center justify-center">
                  1
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Thông Tin Người Nhận Thuốc
                </h2>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên người nhận <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0901 234 567"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email nhận hóa đơn & đơn thuốc điện tử (Tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten@email.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Địa chỉ giao thuốc */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-brand-blue-50 text-brand-blue-700 text-xs font-black flex items-center justify-center">
                  2
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Địa Chỉ Nhận Hàng
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tỉnh / Thành phố
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phường / Xã
                  </label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue-500"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số nhà, tên đường cụ thể <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ví dụ: 123 Lê Duẩn, Tòa nhà Bitexco..."
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Phương thức giao hàng & Thanh toán */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-full bg-brand-blue-50 text-brand-blue-700 text-xs font-black flex items-center justify-center">
                  3
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Phương Thức Giao & Thanh Toán
                </h2>
              </div>

              {/* Shipping options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Hình thức giao nhận thuốc:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      shippingMethod === "fast2h"
                        ? "border-brand-blue-600 bg-brand-blue-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === "fast2h"}
                      onChange={() => setShippingMethod("fast2h")}
                      className="mt-1 accent-brand-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-brand-blue-600" />
                        Giao Hỏa Tốc 2 Giờ (Nội thành)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Dược sĩ đóng gói bảo quản chuẩn GSP, giao tận nơi nhanh chóng.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      shippingMethod === "store"
                        ? "border-brand-blue-600 bg-brand-blue-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethod === "store"}
                      onChange={() => setShippingMethod("store")}
                      className="mt-1 accent-brand-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-brand-blue-600" />
                        Nhận Tại Nhà Thuốc H4CARE
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Nhà thuốc chuẩn bị sẵn thuốc, ghé nhận trực tiếp miễn phí.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Payment options */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-700">
                  Phương thức thanh toán:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === "cod"
                        ? "border-brand-blue-600 bg-brand-blue-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="mt-1 accent-brand-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        Thanh Toán Khi Nhận Hàng (COD)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Kiểm tra thuốc đúng quy cách trước khi thanh toán tiền mặt.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      paymentMethod === "vietqr"
                        ? "border-brand-blue-600 bg-brand-blue-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "vietqr"}
                      onChange={() => setPaymentMethod("vietqr")}
                      className="mt-1 accent-brand-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-cyan-600" />
                        Chuyển Khoản Qua Quét Mã VietQR
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Xác nhận thanh toán tự động không cần gửi bill thủ công.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Right Summary Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Đơn Hàng ({totalItems} món)
                </h3>
                <Link
                  href="/cart"
                  className="text-xs font-bold text-brand-blue-600 hover:underline"
                >
                  Sửa giỏ hàng
                </Link>
              </div>

              {/* Items overview preview */}
              <div className="max-h-48 overflow-y-auto space-y-3 pr-1 text-xs">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center gap-2">
                    <div className="truncate flex-1">
                      <span className="font-bold text-slate-800">{item.product.name}</span>
                      <span className="text-slate-400 block text-[10px]">x{item.quantity} {item.product.packaging}</span>
                    </div>
                    <span className="font-semibold text-slate-900 shrink-0">
                      {formatVND((item.product.salePrice || item.product.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính tiền thuốc:</span>
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
                <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                  <span className="text-2xl font-black text-brand-blue-700">
                    {formatVND(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full shadow-medical bg-gradient-to-r from-brand-blue-600 via-brand-blue-700 to-cyan-600"
              >
                {isSubmitting ? "Đang tạo đơn hàng..." : "Xác Nhận & Đặt Hàng"}
              </Button>

              <p className="text-[11px] text-center text-slate-400 leading-tight">
                Nhấn đặt hàng đồng nghĩa bạn đồng ý với chính sách tư vấn y khoa và bảo mật của H4CARE.
              </p>
            </div>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
}
