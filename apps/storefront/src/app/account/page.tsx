"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { redirectToAdminPortal } from "@/lib/auth/admin-redirect";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  FileText,
  Clock,
  Award,
  LogOut,
  ChevronRight,
  Package,
  HeartPulse,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  X,
  MapPin,
  CheckCircle2,
  Edit3,
  Truck,
  PhoneCall,
} from "lucide-react";

interface CustomerOrder {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  order_status: string;
  payment_method: string;
  payment_status?: string;
  created_at: string | null;
  items_count: number;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editAddress, setEditAddress] = useState<string>("123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/account");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setEditName(user.fullName);
      setEditEmail(user.email || "");
    }
  }, [user]);

  // Load customer-specific orders isolated by phone number
  useEffect(() => {
    if (user?.phone) {
      setLoadingOrders(true);
      fetch(`http://localhost:8000/api/v1/store/orders/customer/${encodeURIComponent(user.phone)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setOrders(data);
        })
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
    }
  }, [user?.phone]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
        Đang tải thông tin thành viên H4CARE...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Loyalty tier computation
  const points = user.points || 0;
  const tier = user.isAdmin
    ? {
        label: "Quản trị viên",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        nextTarget: 0,
        nextLabel: "",
      }
    : points >= 300
    ? {
        label: "Hội viên VIP",
        badgeClass: "bg-amber-100/80 text-amber-800 border-amber-300 font-extrabold shadow-xs shadow-amber-200",
        nextTarget: 500,
        nextLabel: "Kim Cương",
      }
    : points >= 100
    ? {
        label: "Hội viên Thân thiết",
        badgeClass: "bg-brand-blue-50 text-brand-blue-700 border-brand-blue-200 font-bold",
        nextTarget: 300,
        nextLabel: "Hội viên VIP",
      }
    : {
        label: "Tân hội viên",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
        nextTarget: 100,
        nextLabel: "Hội viên Thân thiết",
      };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const updatedUser = {
        ...user,
        fullName: editName.trim() || user.fullName,
        email: editEmail.trim() || user.email,
      };
      try {
        localStorage.setItem("h4care_auth_session", JSON.stringify(updatedUser));
      } catch (err) {
        console.warn("Failed to persist updated profile", err);
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditingProfile(false);
        window.location.reload();
      }, 700);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-10">
        
        {/* Admin Direct Banner for Admin Users */}
        {user.isAdmin && (
          <div className="bg-gradient-to-r from-slate-900 via-brand-blue-900 to-slate-900 text-white rounded-2xl p-6 border border-brand-blue-500/30 shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 text-white border border-white/20 flex items-center justify-center font-black">
                <ShieldCheck className="w-6 h-6 text-brand-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-tight text-white">
                    Tài Khoản Quản Trị Viên (PharmaTrust Data Hub)
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    ADMIN
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Bạn có đầy đủ quyền quản trị dữ liệu thuốc, duyệt cào tự động và quản lý đơn hàng.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => redirectToAdminPortal()}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span>Vào Cổng Admin</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <Link
                href="/admin"
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/15"
              >
                Portal nội bộ
              </Link>
            </div>
          </div>
        )}

        {/* Top Member Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-xs">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : "A"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {user.fullName}
                  </h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs border ${tier.badgeClass}`}>
                    {tier.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.phone}</span>
                    </span>
                  )}
                  {user.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{user.email}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Points & Loyalty with Progress */}
            <div className="flex flex-col gap-2 bg-brand-blue-50/70 p-4 rounded-xl border border-brand-blue-100 sm:self-center w-full sm:w-72 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium">Điểm tích lũy H4Care</span>
                  <span className="text-lg font-black text-brand-blue-700">{points} điểm</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              {tier.nextTarget > 0 && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (points / tier.nextTarget) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 flex justify-between">
                    <span>{points}/{tier.nextTarget} điểm</span>
                    <span>Lên {tier.nextLabel}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Navigation Sidebar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs h-fit space-y-1">
            <Link
              href="/account"
              className="flex items-center justify-between p-3 rounded-xl bg-brand-blue-50 text-brand-blue-700 font-bold text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>Hồ sơ thành viên</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setIsEditingProfile(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>Chỉnh sửa thông tin cá nhân</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {user.isAdmin && (
              <button
                type="button"
                onClick={() => redirectToAdminPortal()}
                className="w-full text-left flex items-center justify-between p-3 rounded-xl text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 font-bold text-xs transition-colors border border-indigo-200/60"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Cổng Quản Trị Hệ Thống</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
              </button>
            )}

            <a
              href="#prescriptions"
              className="flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-4 h-4 text-slate-500" />
                <span>Toa thuốc điện tử của tôi</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>

            <a
              href="#orders"
              className="flex items-center justify-between p-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-slate-500" />
                <span>Lịch sử đơn hàng ({orders.length})</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>

            <div className="pt-3 mt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="w-full flex items-center gap-2.5 p-3 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Health Records Section */}
            <div id="prescriptions" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-extrabold text-base text-slate-900">Toa thuốc điện tử gần nhất</h2>
                  <p className="text-xs text-slate-500">Lưu trữ đơn thuốc của bạn và gia đình chuẩn GPP</p>
                </div>
                <span className="text-xs font-bold text-brand-blue-700 bg-brand-blue-50 px-2.5 py-1 rounded-lg border border-brand-blue-100">
                  1 Toa thuốc đang dùng
                </span>
              </div>

              {/* Sample Prescription Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Đơn thuốc: Điều trị cảm cúm & tăng đề kháng</span>
                  <span className="text-slate-500">Kê ngày: 20/09/2026</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>• Paracetamol 500mg (Hộp 50 viên) - Uống sau ăn</p>
                  <p>• Vitamin C 1000mg Tuýp sủi - 1 viên/ngày</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Dược sĩ tư vấn: DS. Nguyễn Minh Anh
                  </span>
                  <a href="tel:18006868" className="text-brand-blue-600 font-bold hover:underline">
                    Gọi tư vấn lại
                  </a>
                </div>
              </div>
            </div>

            {/* Orders Section - Real Isolated Orders */}
            <div id="orders" className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-extrabold text-base text-slate-900">Đơn hàng gần đây</h2>
                  <p className="text-xs text-slate-500">
                    Dữ liệu đơn hàng riêng biệt theo số điện thoại: <strong className="text-slate-700">{user.phone}</strong>
                  </p>
                </div>
                <Link href="/products" className="text-xs font-bold text-brand-blue-600 hover:underline">
                  Mua sắm tiếp →
                </Link>
              </div>

              {loadingOrders ? (
                <div className="p-6 text-center text-xs text-slate-500">Đang tải lịch sử đơn hàng...</div>
              ) : orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.order_code}
                      onClick={() => setSelectedOrder(order)}
                      className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition-colors group"
                      title="Bấm để xem chi tiết đơn hàng"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-brand-blue-600 transition-colors">
                            Đơn hàng #{order.order_code}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString("vi-VN") : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {order.items_count} sản phẩm • Tổng tiền:{" "}
                          <strong className="text-brand-blue-600">{order.total_amount.toLocaleString("vi-VN")} đ</strong>
                        </p>
                        {order.items && order.items.length > 0 && (
                          <p className="text-[10.5px] text-slate-500 mt-1 italic line-clamp-1">
                            {order.items.map((it) => `${it.product_name} (x${it.quantity})`).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          {order.order_status === "PENDING"
                            ? "Chờ xử lý"
                            : order.order_status === "CONFIRMED"
                            ? "Đã xác nhận"
                            : order.order_status === "SHIPPING"
                            ? "Đang giao 2h"
                            : order.order_status === "COMPLETED"
                            ? "Đã hoàn thành"
                            : order.order_status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/60 text-center space-y-2">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Tài khoản này chưa có đơn hàng nào.</p>
                  <p className="text-[11px] text-slate-400">
                    Mỗi tài khoản lưu trữ lịch sử đơn hàng và điểm tích lũy hoàn toàn độc lập.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block mt-2 px-3.5 py-2 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Xem danh mục thuốc
                  </Link>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* POPUP: Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-black text-slate-900">Chi tiết đơn hàng #{selectedOrder.order_code}</h3>
            </div>

            {/* Tracking Progress */}
            <div className="p-3.5 bg-brand-blue-50 border border-brand-blue-100 rounded-xl mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-brand-blue-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Vận chuyển Siêu Tốc 2H
                </span>
                <span>
                  {selectedOrder.order_status === "COMPLETED"
                    ? "Đã giao thành công"
                    : "Đang tiến hành"}
                </span>
              </div>
              <div className="w-full bg-brand-blue-100 h-2 rounded-full overflow-hidden flex gap-1">
                <div className="bg-brand-blue-600 h-full flex-1 rounded-full" />
                <div className="bg-brand-blue-600 h-full flex-1 rounded-full" />
                <div className={`h-full flex-1 rounded-full ${selectedOrder.order_status === "COMPLETED" ? "bg-brand-blue-600" : "bg-brand-blue-200"}`} />
              </div>
            </div>

            {/* Shipping address & buyer */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl mb-4 text-xs space-y-1">
              <p className="text-slate-700">
                <strong>Người nhận:</strong> {selectedOrder.customer_name} ({selectedOrder.customer_phone})
              </p>
              <p className="text-slate-700 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span><strong>Địa chỉ giao:</strong> {selectedOrder.shipping_address}</span>
              </p>
              <p className="text-slate-500">
                <strong>Thanh toán:</strong> {selectedOrder.payment_method === "COD" ? "Thanh toán khi nhận hàng (COD)" : selectedOrder.payment_method}
              </p>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh mục sản phẩm ({selectedOrder.items?.length || 0})</h4>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items && selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{it.product_name}</p>
                      <p className="text-slate-400 text-[11px]">Số lượng: x{it.quantity} • Đơn giá: {it.price.toLocaleString("vi-VN")} đ</p>
                    </div>
                    <span className="font-bold text-slate-900">{it.subtotal.toLocaleString("vi-VN")} đ</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 font-medium">Tổng thanh toán:</span>
              <span className="text-base font-black text-brand-blue-600">{selectedOrder.total_amount.toLocaleString("vi-VN")} đ</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:18006868"
                className="flex-1 py-2.5 rounded-xl bg-brand-blue-50 text-brand-blue-700 hover:bg-brand-blue-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Tư vấn lại về đơn này</span>
              </a>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl relative">
            <button
              onClick={() => setIsEditingProfile(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">Cập nhật hồ sơ thành viên</h3>
            <p className="text-xs text-slate-500 mb-4">Thông tin lưu trữ riêng biệt theo tài khoản của bạn.</p>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Cập nhật hồ sơ thành công!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại (Cố định theo tài khoản)</label>
                <input
                  type="text"
                  value={user.phone || ""}
                  disabled
                  className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email nhận đơn thuốc & hóa đơn</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ nhận thuốc mặc định</label>
                <textarea
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 font-semibold text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800 text-white font-bold transition-colors shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
