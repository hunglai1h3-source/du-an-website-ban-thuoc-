"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Truck,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  CreditCard,
  Banknote,
  FileText,
  MapPin,
  Navigation,
  ExternalLink,
  QrCode,
  X,
  RefreshCw,
} from "lucide-react";
import { PRODUCTS_DATA } from "@/data/products";

interface CartItem {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  quantity: number;
  image: string;
  unit: string;
  isPrescription: boolean;
  dbId?: number;
}

interface AdminDistrict {
  code: string;
  name: string;
  full_name: string;
  level: string;
  parent_code: string;
}

interface AdminProvince {
  code: string;
  name: string;
  full_name: string;
  level: string;
  districts: AdminDistrict[];
}

interface NearestWarehouseInfo {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_address: string;
  distance_km: number;
  estimated_delivery_time: string;
  navigation_url: string;
}

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Cart state
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Checkout form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("TP. Hồ Chí Minh");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [orderNote, setOrderNote] = useState("");

  // MoMo Sandbox modal & simulation state
  const [momoModal, setMomoModal] = useState<{
    isOpen: boolean;
    orderCode: string;
    amount: number;
    payUrl?: string;
    qrCodeUrl?: string;
    deeplink?: string;
    status: "PENDING" | "PAID" | "FAILED";
    message?: string;
  } | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // 2-tier Administrative Address & Geolocation state
  const [adminTree, setAdminTree] = useState<AdminProvince[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("79");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>("760");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestWarehouse, setNearestWarehouse] = useState<NearestWarehouseInfo | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{
    order_code: string;
    total: number;
    customer_name: string;
    shipping_address: string;
    payment_method: string;
  } | null>(null);

  // Polling MoMo payment status
  useEffect(() => {
    if (!momoModal?.isOpen || momoModal.status !== "PENDING" || !momoModal.orderCode) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/payments/orders/${momoModal.orderCode}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.payment_status === "PAID") {
            setMomoModal((prev) =>
              prev
                ? {
                    ...prev,
                    status: "PAID",
                    message: "Giao dịch MoMo đã được xác nhận thành công!",
                  }
                : null
            );
            clearInterval(intervalId);
          }
        }
      } catch (e) {
        // silent error during background polling
      }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [momoModal?.isOpen, momoModal?.status, momoModal?.orderCode]);

  // Initialize cart from localStorage or load default essentials
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pharmatrust_cart");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not parse cart from localStorage:", e);
    }

    // Default empty cart if no localStorage
    setItems([]);
    setIsLoaded(true);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("pharmatrust_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  // Autofill user details
  useEffect(() => {
    if (user) {
      if (user.fullName && !customerName) setCustomerName(user.fullName);
      if (user.phone && !customerPhone) setCustomerPhone(user.phone);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  // Cart operations
  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("pharmatrust_cart");
  };

  // Load 2-tier administrative units
  useEffect(() => {
    async function loadAdminTree() {
      try {
        const res = await fetch("/api/v1/addresses/administrative-units?tree=true");
        if (res.ok) {
          const data: AdminProvince[] = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAdminTree(data);
            const defaultProv = data.find((p) => p.code === "79") || data[0];
            setSelectedProvinceCode(defaultProv.code);
            if (defaultProv.districts && defaultProv.districts.length > 0) {
              setSelectedDistrictCode(defaultProv.districts[0].code);
            }
          }
        }
      } catch (e) {
        console.warn("Could not load administrative tree:", e);
      }
    }
    loadAdminTree();
  }, []);

  // Compute nearest warehouse on address/location change
  useEffect(() => {
    async function fetchNearestWarehouse() {
      try {
        const bodyPayload: any = {
          province_code: selectedProvinceCode,
          district_code: selectedDistrictCode,
        };
        if (coords) {
          bodyPayload.lat = coords.lat;
          bodyPayload.lng = coords.lng;
        }
        const res = await fetch("/api/v1/addresses/nearest-warehouse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.nearest_warehouse) {
            setNearestWarehouse(data.nearest_warehouse);
          }
        }
      } catch (e) {
        console.warn("Could not compute nearest warehouse:", e);
      }
    }
    fetchNearestWarehouse();
  }, [selectedProvinceCode, selectedDistrictCode, coords]);

  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation warning:", err);
      },
      { timeout: 8000 }
    );
  };

  // Pricing calculations
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = subtotal >= 200000 || subtotal === 0 ? 0 : 25000;
  const grandTotal = subtotal + shippingFee;

  // Handle Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (items.length === 0) {
      setErrorMessage("Giỏ hàng của bạn đang trống. Vui lòng thêm thuốc trước khi thanh toán.");
      return;
    }

    const currProv = adminTree.find((p) => p.code === selectedProvinceCode);
    const currDist = currProv?.districts?.find((d) => d.code === selectedDistrictCode);
    const provName = currProv ? currProv.full_name : shippingCity;
    const distName = currDist ? currDist.full_name : "";
    const detailAddress = streetAddress.trim() || shippingAddress.trim();

    if (!customerName.trim() || !customerPhone.trim() || !detailAddress) {
      setErrorMessage("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao nhận chi tiết.");
      return;
    }

    const fullShippingAddress = `${detailAddress}, ${distName ? distName + ", " : ""}${provName}`;

    setIsSubmitting(true);
    try {
      const checkoutItems = items.map((it) => {
        let dbId = it.dbId;
        if (!dbId && it.id.startsWith("pt-")) {
          dbId = parseInt(it.id.replace("pt-", ""), 10);
        } else if (!dbId && it.id.startsWith("prod-")) {
          dbId = parseInt(it.id.replace("prod-", ""), 10) || 1;
        }
        return {
          product_id: dbId || 1,
          quantity: it.quantity,
        };
      });

      const res = await fetch("/api/v1/store/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || undefined,
          shipping_address: fullShippingAddress,
          shipping_city: provName,
          payment_method: paymentMethod,
          note: orderNote.trim() || undefined,
          items: checkoutItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = "Không thể khởi tạo đơn hàng. Vui lòng thử lại.";
        if (typeof data.detail === "string") {
          msg = data.detail;
        } else if (Array.isArray(data.detail)) {
          msg = data.detail
            .map((d: any) => {
              if (typeof d === "string") return d;
              const field = d.loc ? d.loc[d.loc.length - 1] : "";
              const m = d.msg || "dữ liệu không hợp lệ";
              return field ? `${field}: ${m}` : m;
            })
            .join("; ");
        } else if (data.message && typeof data.message === "string") {
          msg = data.message;
        }
        throw new Error(msg);
      }

      // If user selected MoMo payment, create MoMo transaction and open payment dialog
      if (paymentMethod === "MOMO") {
        const returnUrl = typeof window !== "undefined" ? `${window.location.origin}/checkout/result` : "";
        try {
          const momoRes = await fetch("/api/v1/payments/momo/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_code: data.order_code,
              return_url: returnUrl,
            }),
          });
          const momoData = await momoRes.json();
          if (momoRes.ok && momoData) {
            setItems([]);
            localStorage.removeItem("pharmatrust_cart");
            setMomoModal({
              isOpen: true,
              orderCode: data.order_code,
              amount: data.total_amount || grandTotal,
              payUrl: momoData.pay_url,
              qrCodeUrl: momoData.qr_code_url,
              deeplink: momoData.deeplink,
              status: "PENDING",
            });
            return;
          }
        } catch (mErr) {
          console.warn("Lỗi khi kết nối cổng MoMo, chuyển về trang đơn hàng:", mErr);
        }
      }

      // Standard Order created successfully (COD or fallback)
      setOrderSuccess({
        order_code: data.order_code,
        total: data.total_amount || grandTotal,
        customer_name: customerName.trim(),
        shipping_address: fullShippingAddress,
        payment_method: paymentMethod,
      });

      // Clear local cart
      setItems([]);
      localStorage.removeItem("pharmatrust_cart");
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi khi xử lý đơn hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-brand-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tiếp tục tìm kiếm thuốc</span>
          </Link>

          {items.length > 0 && !orderSuccess && (
            <button
              onClick={clearCart}
              className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa toàn bộ giỏ hàng</span>
            </button>
          )}
        </div>

        {/* 1. ORDER SUCCESS SCREEN */}
        {orderSuccess ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Đặt hàng thành công
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cảm ơn quý khách đã tin chọn H4CARE
            </h1>

            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              Đơn hàng của quý khách đã được ghi nhận vào hệ thống quản lý dược phẩm. Dược sĩ phụ trách sẽ liên hệ xác nhận đơn trong 15 phút.
            </p>

            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-sm">
                <span className="text-slate-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-brand-blue-700 text-base">{orderSuccess.order_code}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Người nhận:</span>
                <span className="font-bold text-slate-800">{orderSuccess.customer_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Địa chỉ giao:</span>
                <span className="font-medium text-slate-800 text-right max-w-[240px] truncate">{orderSuccess.shipping_address}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Hình thức thanh toán:</span>
                <span className="font-semibold text-slate-800">
                  {orderSuccess.payment_method === "MOMO" ? (
                    <span className="inline-flex items-center gap-1 font-bold text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200 text-xs">
                      Ví điện tử MoMo Sandbox (ĐÃ THANH TOÁN)
                    </span>
                  ) : orderSuccess.payment_method === "COD" ? (
                    "Thanh toán khi nhận hàng (COD)"
                  ) : (
                    "Chuyển khoản ngân hàng"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-base">
                <span className="font-bold text-slate-900">Tổng thanh toán:</span>
                <span className="font-black text-rose-600 text-lg">
                  {orderSuccess.total.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAuthenticated ? (
                <Link
                  href="/account#orders"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-sm transition-all"
                >
                  Xem lịch sử đơn thuốc của tôi
                </Link>
              ) : (
                <Link
                  href={`/account?phone=${encodeURIComponent(customerPhone)}`}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-sm transition-all"
                >
                  Tra cứu tiến độ đơn thuốc
                </Link>
              )}

              <Link
                href="/products"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
              >
                Tiếp tục mua thuốc
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* 2. EMPTY CART STATE */
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Giỏ hàng của bạn đang trống</h2>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
              Chưa có sản phẩm thuốc hoặc thực phẩm chức năng nào trong giỏ hàng. Hãy khám phá danh mục thuốc chính hãng ngay.
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-sm transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Khám phá danh mục thuốc ngay</span>
              </Link>
            </div>
          </div>
        ) : (
          /* 3. ACTIVE CART & CHECKOUT TWO-COLUMN LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-brand-blue-600" />
                    <h1 className="text-lg font-bold text-slate-900">
                      Giỏ hàng của bạn ({items.reduce((s, it) => s + it.quantity, 0)} sản phẩm)
                    </h1>
                  </div>
                  <span className="text-xs text-brand-emerald-700 font-semibold bg-brand-emerald-50 px-2.5 py-1 rounded-full border border-brand-emerald-200">
                    Thuốc chuẩn GPP
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="py-4 flex gap-4 items-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-50 border border-slate-100 p-1.5 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs sm:text-sm font-black text-brand-blue-700">
                            {item.price.toLocaleString("vi-VN")} đ
                          </span>
                          <span className="text-[11px] text-slate-400">/{item.unit}</span>
                          {item.isPrescription && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Thuốc kê đơn (Cần toa)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Modifier */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l transition-colors"
                            aria-label="Giảm"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-r transition-colors"
                            aria-label="Tăng"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Xóa khỏi giỏ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality & Delivery Commitments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center shrink-0 border border-brand-blue-100">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">100% Chính hãng</p>
                    <p className="text-[10.5px] text-slate-500">Chuẩn GPP & GSP</p>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-emerald-50 text-brand-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Giao hàng nhanh</p>
                    <p className="text-[10.5px] text-slate-500">Miễn phí từ 200.000đ</p>
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-100">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Dược sĩ tư vấn</p>
                    <p className="text-[10.5px] text-slate-500">Xác nhận trước khi gửi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Checkout Details & Order Summary */}
            <div className="lg:col-span-5 space-y-4">
              <form onSubmit={handleCheckout} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-blue-600" />
                    <span>Thông tin giao nhận thuốc</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dược sĩ sẽ gọi xác minh đơn thuốc và hướng dẫn sử dụng
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên người nhận <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ví dụ: 0901234567"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Địa chỉ Email (nhận mã đơn & hóa đơn)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Ví dụ: khachhang@gmail.com"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all"
                    />
                  </div>

                  {/* Địa chỉ hành chính 2 cấp (Tỉnh / Thành & Quận / Huyện) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tỉnh / Thành phố <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedProvinceCode}
                        onChange={(e) => {
                          const pCode = e.target.value;
                          setSelectedProvinceCode(pCode);
                          const pObj = adminTree.find((p) => p.code === pCode);
                          if (pObj && pObj.districts && pObj.districts.length > 0) {
                            setSelectedDistrictCode(pObj.districts[0].code);
                          } else {
                            setSelectedDistrictCode("");
                          }
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all bg-white font-medium"
                      >
                        {adminTree.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.full_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quận / Huyện <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedDistrictCode}
                        onChange={(e) => setSelectedDistrictCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all bg-white font-medium"
                      >
                        {adminTree
                          .find((p) => p.code === selectedProvinceCode)
                          ?.districts?.map((d) => (
                            <option key={d.code} value={d.code}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Số nhà, tên đường, phường/xã <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="text-[11px] text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1 font-semibold hover:underline"
                      >
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{isLocating ? "Đang định vị..." : "Lấy vị trí GPS"}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="Ví dụ: 123 Đường Lê Lợi, Phường Bến Nghé"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all"
                    />
                    {coords && (
                      <p className="text-[10px] text-emerald-600 font-mono mt-1">
                        ✓ Tọa độ GPS đã nhận diện: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </p>
                    )}
                  </div>

                  {/* Kho phục vụ gần nhất & Ước tính giao hàng */}
                  {nearestWarehouse && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center justify-between font-bold text-brand-blue-900">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-blue-600 shrink-0" />
                          <span>Kho phục vụ: {nearestWarehouse.warehouse_code}</span>
                        </span>
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                          Cách ~{nearestWarehouse.distance_km} km
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        {nearestWarehouse.warehouse_name} ({nearestWarehouse.warehouse_address})
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 text-[11px]">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {nearestWarehouse.estimated_delivery_time}
                        </span>
                        {nearestWarehouse.navigation_url && (
                          <a
                            href={nearestWarehouse.navigation_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-blue-600 hover:underline flex items-center gap-1 font-medium text-[10.5px]"
                          >
                            <span>Google Maps</span>
                            <Navigation className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phương thức thanh toán
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          paymentMethod === "COD"
                            ? "border-brand-blue-600 bg-brand-blue-50/50 text-brand-blue-900 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="COD"
                          checked={paymentMethod === "COD"}
                          onChange={() => setPaymentMethod("COD")}
                          className="sr-only"
                        />
                        <Banknote className="w-4 h-4 text-brand-blue-600 shrink-0" />
                        <span className="text-xs">Tiền mặt (COD)</span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          paymentMethod === "MOMO"
                            ? "border-pink-500 bg-pink-50/70 text-pink-900 font-bold shadow-xs"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="MOMO"
                          checked={paymentMethod === "MOMO"}
                          onChange={() => setPaymentMethod("MOMO")}
                          className="sr-only"
                        />
                        <span className="w-4 h-4 rounded-full bg-[#d82d8b] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          M
                        </span>
                        <span className="text-xs">Ví MoMo Sandbox</span>
                      </label>

                      <label
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          paymentMethod === "BANK_TRANSFER"
                            ? "border-brand-blue-600 bg-brand-blue-50/50 text-brand-blue-900 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="BANK_TRANSFER"
                          checked={paymentMethod === "BANK_TRANSFER"}
                          onChange={() => setPaymentMethod("BANK_TRANSFER")}
                          className="sr-only"
                        />
                        <CreditCard className="w-4 h-4 text-brand-blue-600 shrink-0" />
                        <span className="text-xs">Chuyển khoản</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Ghi chú thêm cho Dược sĩ (nếu có)
                    </label>
                    <input
                      type="text"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Ví dụ: Giao giờ hành chính, cần tư vấn liều dùng..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all"
                    />
                  </div>
                </div>

                {/* Price Summary Breakdown */}
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính thuốc:</span>
                    <span className="font-bold text-slate-800">{subtotal.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển chuẩn GSP:</span>
                    <span className={shippingFee === 0 ? "text-brand-emerald-700 font-bold" : "text-slate-800 font-bold"}>
                      {shippingFee === 0 ? "Miễn phí (Đơn >= 200k)" : `${shippingFee.toLocaleString("vi-VN")} đ`}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm">
                    <span className="font-bold text-slate-900">Tổng thanh toán:</span>
                    <span className="font-black text-rose-600 text-lg">
                      {grandTotal.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800 text-white font-bold text-sm shadow-xs hover:shadow-depth-1 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang tạo đơn thuốc...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận Đặt thuốc ngay</span>
                    </>
                  )}
                </button>

                <p className="text-[10.5px] text-slate-400 text-center leading-tight">
                  Nhấn "Xác nhận Đặt thuốc ngay" đồng nghĩa với việc bạn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật y tế của H4CARE.
                </p>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MoMo Sandbox Payment Modal */}
      {momoModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#a50064] to-[#d82d8b] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white text-[#a50064] flex items-center justify-center font-black text-sm">
                  M
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Cổng thanh toán MoMo Sandbox</h3>
                  <p className="text-[11px] text-pink-100 font-mono">Đơn hàng: {momoModal.orderCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMomoModal(null);
                  setOrderSuccess({
                    order_code: momoModal.orderCode,
                    total: momoModal.amount,
                    customer_name: customerName,
                    shipping_address: streetAddress,
                    payment_method: "MOMO",
                  });
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Đóng popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center space-y-4">
              {momoModal.status === "PAID" ? (
                <div className="py-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900">Thanh toán thành công!</h4>
                  <p className="text-xs text-slate-600">
                    Cổng MoMo Sandbox đã ghi nhận giao dịch thành công. Đơn hàng của bạn đã chuyển sang trạng thái ĐÃ THANH TOÁN (PAID).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMomoModal(null);
                      setOrderSuccess({
                        order_code: momoModal.orderCode,
                        total: momoModal.amount,
                        customer_name: customerName,
                        shipping_address: streetAddress,
                        payment_method: "MOMO",
                      });
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wide transition-all cursor-pointer"
                  >
                    Xem biên nhận đơn hàng
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 inline-block">
                    {momoModal.qrCodeUrl ? (
                      <img
                        src={momoModal.qrCodeUrl}
                        alt="MoMo QR Code"
                        className="w-48 h-48 mx-auto rounded-xl object-contain bg-white p-2 shadow-xs"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                        Đang tạo mã QR...
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Số tiền cần thanh toán:</div>
                    <div className="text-2xl font-black text-[#a50064]">
                      {momoModal.amount.toLocaleString("vi-VN")} đ
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    Mở <strong>App MoMo</strong> quét mã QR trên màn hình hoặc chọn các phương án dưới đây:
                  </p>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    {momoModal.payUrl && (
                      <a
                        href={momoModal.payUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#a50064] hover:bg-[#880052] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Mở Cổng thanh toán MoMo Sandbox</span>
                      </a>
                    )}

                    {/* Interactive Sandbox Simulator button for testing & presentation */}
                    <button
                      type="button"
                      disabled={isSimulatingPayment}
                      onClick={async () => {
                        if (!momoModal.orderCode) return;
                        setIsSimulatingPayment(true);
                        try {
                          const res = await fetch("/api/v1/payments/momo/simulate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              order_code: momoModal.orderCode,
                              success: true,
                            }),
                          });
                          if (res.ok) {
                            setMomoModal((prev) =>
                              prev ? { ...prev, status: "PAID", message: "Đã mô phỏng thanh toán MoMo thành công!" } : null
                            );
                          }
                        } catch (simErr) {
                          console.error("Simulation error:", simErr);
                        } finally {
                          setIsSimulatingPayment(false);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isSimulatingPayment ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang gửi Webhook giả lập...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ Mô phỏng quét mã thành công (Sandbox)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Polling indicator */}
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                    <span>Hệ thống đang tự động lắng nghe Webhook MoMo...</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
