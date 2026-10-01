"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";

interface MobileBottomNavProps {
  onOpenCategories: () => void;
  onOpenSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenCategories,
  onOpenSearch,
}) => {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const raw = localStorage.getItem("pharmatrust_cart");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const count = parsed.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
            setCartCount(count);
            return;
          }
        }
      } catch (e) {}
      setCartCount(0);
    };

    updateCartCount();
    window.addEventListener("cart_updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);
    return () => {
      window.removeEventListener("cart_updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-8px_20px_rgba(0,0,0,0.05)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {/* 1. Trang chủ */}
        <Link
          href="/"
          onClick={() => setActiveTab("home")}
          className="flex flex-col items-center justify-center w-14 py-1 relative text-slate-500 hover:text-brand-blue-600 transition-colors"
        >
          <div className="relative">
            <Home className={`w-5 h-5 transition-transform ${activeTab === "home" ? "text-brand-blue-600 scale-110" : ""}`} />
            {activeTab === "home" && (
              <motion.span
                layoutId="bottomNavDot"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-blue-600"
              />
            )}
          </div>
          <span className={`text-[10px] mt-1 font-medium ${activeTab === "home" ? "text-brand-blue-600 font-bold" : ""}`}>
            Trang chủ
          </span>
        </Link>

        {/* 2. Danh mục */}
        <button
          onClick={() => {
            setActiveTab("categories");
            onOpenCategories();
          }}
          className="flex flex-col items-center justify-center w-14 py-1 relative text-slate-500 hover:text-brand-blue-600 transition-colors"
        >
          <LayoutGrid className={`w-5 h-5 transition-transform ${activeTab === "categories" ? "text-brand-blue-600 scale-110" : ""}`} />
          <span className={`text-[10px] mt-1 font-medium ${activeTab === "categories" ? "text-brand-blue-600 font-bold" : ""}`}>
            Danh mục
          </span>
        </button>

        {/* 3. Tìm kiếm */}
        <button
          onClick={() => {
            setActiveTab("search");
            onOpenSearch();
          }}
          className="flex flex-col items-center justify-center w-14 py-1 relative text-slate-500 hover:text-brand-blue-600 transition-colors"
        >
          <div className="w-10 h-10 -mt-4 rounded-full bg-brand-blue-600 text-white flex items-center justify-center shadow-medical active:scale-95 transition-transform">
            <Search className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-brand-blue-700">
            Tìm thuốc
          </span>
        </button>

        {/* 4. Giỏ hàng */}
        <Link
          href="/cart"
          aria-label="Giỏ hàng"
          onClick={() => setActiveTab("cart")}
          className="flex flex-col items-center justify-center w-14 py-1 relative text-slate-500 hover:text-brand-blue-600 transition-colors"
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 transition-transform ${activeTab === "cart" ? "text-brand-blue-600 scale-110" : ""}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 font-medium ${activeTab === "cart" ? "text-brand-blue-600 font-bold" : ""}`}>
            Giỏ hàng
          </span>
        </Link>

        {/* 5. Tài khoản */}
        <Link
          href="/login"
          onClick={() => setActiveTab("account")}
          className="flex flex-col items-center justify-center w-14 py-1 relative text-slate-500 hover:text-brand-blue-600 transition-colors"
        >
          <User className={`w-5 h-5 transition-transform ${activeTab === "account" ? "text-brand-blue-600 scale-110" : ""}`} />
          <span className={`text-[10px] mt-1 font-medium ${activeTab === "account" ? "text-brand-blue-600 font-bold" : ""}`}>
            Tài khoản
          </span>
        </Link>
      </div>
    </nav>
  );
};
