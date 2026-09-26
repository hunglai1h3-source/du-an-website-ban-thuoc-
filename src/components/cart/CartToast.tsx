"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart/cart-context";
import { formatVND } from "@/lib/utils";
import { CheckCircle2, ShoppingBag, X, ArrowRight } from "lucide-react";

export const CartToast: React.FC = () => {
  const { showToast, lastAddedItem, closeToast, totalItems } = useCart();

  if (!lastAddedItem) return null;

  const currentPrice =
    lastAddedItem.product.salePrice || lastAddedItem.product.price;

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] bg-white rounded-2xl shadow-depth-4 border border-slate-200/90 p-3.5 select-none"
        >
          <div className="flex items-start gap-3">
            {/* Product image stage thumbnail */}
            <div className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
              <span className="text-xl">💊</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Đã thêm vào giỏ hàng!</span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 truncate">
                {lastAddedItem.product.name}
              </h4>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span className="font-semibold text-brand-blue-700">
                  {formatVND(currentPrice)}
                </span>
                <span>•</span>
                <span>Số lượng: +{lastAddedItem.quantity}</span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={closeToast}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick link button to /cart */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Giỏ hàng ({totalItems} sản phẩm)
            </span>

            <Link
              href="/cart"
              onClick={closeToast}
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue-600 hover:text-brand-blue-800 transition-colors"
            >
              <span>Xem giỏ hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
