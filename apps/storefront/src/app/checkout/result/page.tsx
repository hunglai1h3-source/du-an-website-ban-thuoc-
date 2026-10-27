"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShoppingBag,
  RotateCcw,
  ShieldCheck,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface PaymentStatusResponse {
  order_code: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  customer_name: string;
  created_at: string;
  can_retry?: boolean;
  transactions?: Array<{
    id: number;
    transaction_code: string;
    provider: string;
    amount: number;
    status: string;
    provider_trans_id?: string;
  }>;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("pharmatrust_access_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("h4care_auth_token") ||
    localStorage.getItem("pharmatrust_token")
  );
}

function CheckoutResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("order_code") || searchParams.get("orderCode") || "";
  const resultCode = searchParams.get("resultCode") || searchParams.get("code");
  const statusParam = (searchParams.get("status") || "").toUpperCase();
  const message = searchParams.get("message") || "";
  const transId = searchParams.get("transId") || searchParams.get("id") || "";
  const amountStr = searchParams.get("amount") || "";

  // Extract clean order_code if orderId has format "ORDERCODE_momo_..."
  const cleanOrderCode = orderId.includes("_momo_")
    ? orderId.split("_momo_")[0]
    : orderId;

  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Xác định người dùng hoặc cổng thanh toán có yêu cầu hủy hay không
  const cancelParam = (searchParams.get("cancel") || "").toLowerCase();
  const isCancelled =
    cancelParam === "true" ||
    statusParam === "CANCELLED" ||
    resultCode === "1006" ||
    orderData?.order_status === "CANCELLED" ||
    orderData?.payment_status === "CANCELLED";

  // CHỈ THÀNH CÔNG KHI KHÔNG BỊ HỦY VÀ CÓ XÁC NHẬN PAID TỪ DATABASE
  const isSuccess = !isCancelled && orderData?.payment_status === "PAID";

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    const token = getStoredToken();
    const orderToken =
      typeof window !== "undefined"
        ? localStorage.getItem(`h4care_order_token_${cleanOrderCode}`) ||
          localStorage.getItem("h4care_latest_order_token") ||
          searchParams.get("token") ||
          searchParams.get("order_token") ||
          ""
        : "";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (orderToken) headers["X-Order-Token"] = orderToken;
    return headers;
  }, [cleanOrderCode, searchParams]);

  const fetchStatus = useCallback(
    async (isAutoPoll = false) => {
      if (!cleanOrderCode) {
        setIsLoading(false);
        return;
      }

      if (!isAutoPoll) setIsLoading(true);

      try {
        const phone =
          searchParams.get("phone") ||
          (typeof window !== "undefined" ? localStorage.getItem("h4care_checkout_phone") || "" : "");
        const headers = getAuthHeaders();

        const queryParts = [];
        if (phone) queryParts.push(`phone_verify=${encodeURIComponent(phone)}`);
        const queryParam = queryParts.length ? `?${queryParts.join("&")}` : "";

        // Nếu là payOS hoặc MoMo và chưa có xác nhận PAID, thử tra cứu đối soát nhanh
        if (cleanOrderCode && !isCancelled) {
          try {
            await fetch(`/api/v1/payments/payos/check/${encodeURIComponent(cleanOrderCode)}${queryParam}`, {
              method: "POST",
              headers,
            });
          } catch (_) {}

          try {
            await fetch(`/api/v1/payments/momo/check/${encodeURIComponent(cleanOrderCode)}${queryParam}`, {
              method: "POST",
              headers,
            });
          } catch (_) {}
        }

        const res = await fetch(`/api/v1/payments/orders/${encodeURIComponent(cleanOrderCode)}/status${queryParam}`, { headers });
        if (res.ok) {
          const data: PaymentStatusResponse = await res.json();
          setOrderData(data);
          setError(null);

          // Nếu đã thanh toán thành công: dọn dẹp giỏ hàng
          if (data.payment_status === "PAID") {
            if (typeof window !== "undefined") {
              localStorage.removeItem("pharmatrust_cart");
              window.dispatchEvent(new Event("cart-updated"));
            }
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.detail || "Không thể tra cứu thông tin thanh toán từ hệ thống.");
        }
      } catch (err: any) {
        setError(err.message || "Lỗi kết nối");
      } finally {
        setIsLoading(false);
      }
    },
    [cleanOrderCode, isCancelled, searchParams, getAuthHeaders]
  );

  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  // Tự động kiểm tra đối soát thêm một vài lần (mỗi 2.5s tối đa 6 lần = 15s) nếu khách vừa chuyển khoản xong mà hệ thống đang chờ webhook
  useEffect(() => {
    if (!cleanOrderCode || isCancelled || isSuccess || isLoading) return;
    if (pollCount >= 6) return;

    const timer = setTimeout(() => {
      setPollCount((prev) => prev + 1);
      fetchStatus(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [cleanOrderCode, isCancelled, isSuccess, isLoading, pollCount, fetchStatus]);

  // Switch to COD with 1-click retry
  const handleSwitchToCod = async () => {
    if (!cleanOrderCode) return;
    setIsRetrying(true);
    setRetryMessage(null);
    try {
      const phone =
        searchParams.get("phone") ||
        (typeof window !== "undefined" ? localStorage.getItem("h4care_checkout_phone") || "" : "");
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const orderToken =
        typeof window !== "undefined"
          ? localStorage.getItem(`h4care_order_token_${cleanOrderCode}`) ||
            localStorage.getItem("h4care_latest_order_token") ||
            ""
          : "";

      const res = await fetch("/api/v1/payments/retry", {
        method: "POST",
        headers,
        body: JSON.stringify({
          order_code: cleanOrderCode,
          new_payment_method: "COD",
          phone_verify: phone || undefined,
          order_token: orderToken || undefined,
        }),
      });
      if (res.ok) {
        setRetryMessage("Đã chuyển thành công sang Thanh toán khi nhận hàng (COD)! Đơn sẽ được xuất kho giao tới bạn.");
        await fetchStatus(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Không thể chuyển phương thức thanh toán");
      }
    } catch (e: any) {
      alert("Lỗi khi xử lý: " + (e.message || "Unknown"));
    } finally {
      setIsRetrying(false);
    }
  };

  // Hủy hẳn đơn hàng và giải phóng tồn kho
  const handleCancelEntireOrder = async () => {
    if (!cleanOrderCode) return;
    if (!confirm("Bạn có chắc chắn muốn hủy bỏ đơn hàng này không? Lượng thuốc giữ chỗ sẽ được giải phóng hoàn trả lại kho.")) return;
    setIsCancellingOrder(true);
    setRetryMessage(null);
    try {
      const phone =
        searchParams.get("phone") ||
        (typeof window !== "undefined" ? localStorage.getItem("h4care_checkout_phone") || "" : "");
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const orderToken =
        typeof window !== "undefined"
          ? localStorage.getItem(`h4care_order_token_${cleanOrderCode}`) ||
            localStorage.getItem("h4care_latest_order_token") ||
            ""
          : "";

      const res = await fetch(`/api/v1/payments/orders/${cleanOrderCode}/cancel`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          reason: "Khách hàng hủy sau khi không thanh toán trực tuyến",
          phone_verify: phone || undefined,
          order_token: orderToken || undefined,
        }),
      });
      if (res.ok) {
        setRetryMessage("Đã hủy bỏ đơn hàng thành công và giải phóng tồn kho!");
        await fetchStatus(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Không thể hủy đơn hàng");
      }
    } catch (e: any) {
      alert("Lỗi khi xử lý: " + (e.message || "Unknown"));
    } finally {
      setIsCancellingOrder(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {isLoading && !orderData ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-xs">
          <div className="w-12 h-12 border-4 border-brand-blue-200 border-t-brand-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-700">Đang đối soát kết quả giao dịch thanh toán...</p>
        </div>
      ) : isSuccess ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Thanh toán thành công &amp; Đã xác nhận
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Giao dịch thanh toán được xác nhận!
          </h1>

          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            Hệ thống nhà thuốc H4CARE đã nhận đủ số tiền thanh toán. Đơn thuốc của quý khách đã chuyển sang trạng thái sẵn sàng xuất kho theo tiêu chuẩn FEFO.
          </p>

          {/* Details Card */}
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-sm">
              <span className="text-slate-500">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-brand-blue-700 text-base">
                {orderData?.order_code || cleanOrderCode}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Phương thức thanh toán:</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 text-xs">
                {orderData?.payment_method === "PAYOS"
                  ? "Cổng thanh toán payOS"
                  : orderData?.payment_method === "SEPAY"
                  ? "Chuyển khoản VietQR MBBank (SePay)"
                  : orderData?.payment_method === "MOMO"
                  ? "Ví điện tử MoMo"
                  : orderData?.payment_method === "BANK_TRANSFER" || orderData?.payment_method === "VIETQR"
                  ? "Chuyển khoản VietQR Napas 247"
                  : "Thanh toán khi nhận hàng (COD)"}
              </span>
            </div>

            {(transId || orderData?.transactions?.[0]?.provider_trans_id) && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Mã giao dịch đối soát:</span>
                <span className="font-mono text-xs text-slate-800 font-semibold">
                  {transId || orderData?.transactions?.[0]?.provider_trans_id}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Trạng thái thanh toán:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ĐÃ THANH TOÁN (PAID)
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-base">
              <span className="font-bold text-slate-900">Số tiền quyết toán:</span>
              <span className="font-black text-rose-600 text-lg">
                {(orderData?.total_amount || (amountStr ? Number(amountStr) : 0)).toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/account?order=${encodeURIComponent(cleanOrderCode)}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Xem tiến độ đơn thuốc</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/products"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tiếp tục mua sắm</span>
            </Link>
          </div>
        </div>
      ) : isCancelled ? (
        /* CANCELLED SCREEN */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs text-center">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50">
            <XCircle className="w-10 h-10" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 mb-3">
            <XCircle className="w-3.5 h-3.5" />
            Giao dịch đã hủy / Chưa thanh toán
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {orderData?.order_status === "CANCELLED"
              ? "Đơn hàng đã được hủy bỏ"
              : "Bạn đã hủy thanh toán đơn hàng"}
          </h1>

          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            {orderData?.order_status === "CANCELLED"
              ? "Đơn thuốc này đã được hủy bỏ và lượng tồn kho giữ chỗ đã được giải phóng hoàn trả lại kho dược."
              : "Bạn đã thao tác hủy trên cổng thanh toán. Đơn thuốc chưa được thanh toán và kho chưa xử lý soạn hàng. Quý khách có thể chuyển sang hình thức thanh toán khi nhận hàng (COD), thanh toán lại hoặc hủy hẳn đơn."}
          </p>

          {retryMessage && (
            <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{retryMessage}</span>
            </div>
          )}

          {/* Details Card */}
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3.5 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-slate-500">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-slate-800 text-base">
                {orderData?.order_code || cleanOrderCode || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Phương thức đã chọn:</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 text-xs">
                {orderData?.payment_method === "PAYOS"
                  ? "Cổng thanh toán payOS"
                  : orderData?.payment_method === "SEPAY"
                  ? "Chuyển khoản VietQR MBBank (SePay)"
                  : orderData?.payment_method === "MOMO"
                  ? "Ví điện tử MoMo"
                  : orderData?.payment_method || "Trực tuyến"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Trạng thái thanh toán:</span>
              <span className="inline-flex items-center gap-1 font-bold text-rose-600 text-xs">
                <XCircle className="w-3.5 h-3.5" />
                ĐÃ HỦY GIAO DỊCH (CHƯA THANH TOÁN)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Trạng thái xử lý kho:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 text-xs">
                {orderData?.order_status === "CANCELLED"
                  ? "ĐÃ HỦY ĐƠN (KHÔNG SOẠN HÀNG)"
                  : "TẠM GIỮ CHỖ (CHỜ THANH TOÁN - CHƯA XUẤT KHO)"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-base">
              <span className="font-bold text-slate-900">Số tiền đơn hàng:</span>
              <span className="font-black text-rose-600 text-lg">
                {(orderData?.total_amount || (amountStr ? Number(amountStr) : 0)).toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            {orderData?.order_status === "CANCELLED" ? (
              <>
                <Link
                  href={`/account?order=${encodeURIComponent(cleanOrderCode)}`}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Xem chi tiết đơn hàng</span>
                </Link>
                <Link
                  href="/products"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Tiếp tục mua hàng</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/checkout/payment/${encodeURIComponent(cleanOrderCode)}`}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Trang thanh toán trực tuyến</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  disabled={isRetrying || isCancellingOrder}
                  onClick={handleSwitchToCod}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang chuyển sang COD...</span>
                    </>
                  ) : (
                    <>
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Chuyển sang trả khi nhận hàng (COD)</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/account?order=${encodeURIComponent(cleanOrderCode)}`}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Mở chi tiết &amp; Thanh toán lại</span>
                </Link>

                <button
                  type="button"
                  disabled={isRetrying || isCancellingOrder}
                  onClick={handleCancelEntireOrder}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-rose-300 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCancellingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang hủy đơn...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Hủy bỏ đơn hàng này</span>
                    </>
                  )}
                </button>

                <Link
                  href="/products"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Tiếp tục mua hàng</span>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        /* FAILED OR PENDING SCREEN */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs text-center">
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-6 ring-8 ring-amber-50/50">
            <Clock className="w-10 h-10" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 mb-3">
            <Clock className="w-3.5 h-3.5" />
            Chờ thanh toán / Chưa quyết toán
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Giao dịch đang chờ xác nhận
          </h1>

          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
            {message || "Giao dịch trực tuyến chưa ghi nhận hoàn tất. Thuốc trong đơn của quý khách vẫn đang được giữ chỗ trong kho."}
          </p>

          {/* Phản hồi trạng thái tức thời nếu URL từ cổng thanh toán báo đã chuyển khoản thành công */}
          {(statusParam === "PAID" || resultCode === "00") && (
            <div className="mt-4 p-3.5 bg-sky-50 text-sky-900 rounded-xl border border-sky-200 text-xs font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
              <span>Cổng thanh toán đã phản hồi chuyển khoản thành công (PAID). Hệ thống đang kiểm tra đối soát tự động...</span>
            </div>
          )}

          {retryMessage && (
            <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{retryMessage}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-slate-800">{cleanOrderCode || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phương thức đã chọn:</span>
              <span className="font-semibold text-slate-800">
                {orderData?.payment_method === "PAYOS"
                  ? "Cổng thanh toán payOS"
                  : orderData?.payment_method === "SEPAY"
                  ? "Chuyển khoản VietQR MBBank (SePay)"
                  : orderData?.payment_method || "Trực tuyến"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái thanh toán:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 text-xs">
                <Clock className="w-3.5 h-3.5" />
                CHỜ THANH TOÁN (KHO CHƯA XỬ LÝ)
              </span>
            </div>
            {orderData?.total_amount && (
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Tổng tiền cần thanh toán:</span>
                <span className="font-black text-rose-600">{orderData.total_amount.toLocaleString("vi-VN")} đ</span>
              </div>
            )}
          </div>

          {/* Action buttons including Re-check button & 1-click switch to COD */}
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setPollCount(0);
                fetchStatus(false);
              }}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Đang kiểm tra đối soát..." : "Kiểm tra lại trạng thái thanh toán"}</span>
            </button>

            <Link
              href={`/checkout/payment/${encodeURIComponent(cleanOrderCode)}`}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Trang thanh toán trực tuyến</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              disabled={isRetrying || isCancellingOrder}
              onClick={handleSwitchToCod}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Chuyển sang trả khi nhận hàng (COD)</span>
                </>
              )}
            </button>

            <Link
              href={`/account?order=${encodeURIComponent(cleanOrderCode)}`}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Mở chi tiết &amp; Thanh toán lại</span>
            </Link>

            <button
              type="button"
              disabled={isRetrying || isCancellingOrder}
              onClick={handleCancelEntireOrder}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-rose-300 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCancellingOrder ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang hủy đơn...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Hủy bỏ đơn hàng này</span>
                </>
              )}
            </button>

            <Link
              href="/products"
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Tiếp tục mua hàng</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-md mx-auto py-24 text-center text-slate-500 text-sm">
              Đang tải kết quả thanh toán...
            </div>
          }
        >
          <CheckoutResultContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
