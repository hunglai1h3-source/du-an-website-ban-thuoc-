import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { AlertCircle, Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">404 - Không Tìm Thấy Trang</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nội dung bạn đang tìm kiếm không tồn tại hoặc đã được cập nhật sang danh mục mới.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue-600 text-white font-bold text-xs hover:bg-brand-blue-700 transition-colors shadow-xs"
            >
              <Home className="w-4 h-4" />
              <span>Về Trang Chủ</span>
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Giỏ Hàng</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
