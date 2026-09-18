"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { formatVND } from "@/lib/utils";
import {
  Star,
  ShoppingBag,
  Stethoscope,
  Heart,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onOpenRxConsult?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onOpenRxConsult,
  onAddToCart,
  className = "",
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discountPercent =
    product.salePrice && product.salePrice < product.price
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  const currentPrice = product.salePrice || product.price;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.isPrescription) {
      if (onOpenRxConsult) onOpenRxConsult(product);
    } else {
      if (onAddToCart) onAddToCart(product);
    }
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-3xl bg-white border border-slate-200/80 p-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover hover:border-brand-blue-200/90 ${className}`}
    >
      {/* Top Image Stage */}
      <div className="relative w-full aspect-square rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center p-3 mb-3 border border-slate-100">
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
          {product.isPrescription ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Thuốc kê đơn (Rx)
            </span>
          ) : (
            <>
              {discountPercent > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm">
                  -{discountPercent}%
                </span>
              )}
              {product.isBestSeller && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Bán chạy
                </span>
              )}
            </>
          )}
        </div>

        {/* Quick Action Floating Buttons (Wishlist & Quick View) */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
          <button
            onClick={handleWishlistToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
              isWishlisted
                ? "bg-rose-50 text-rose-500 border border-rose-200"
                : "bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 border border-slate-200/80"
            }`}
            title="Lưu vào danh sách quan tâm"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
          </button>

          <button
            onClick={handleQuickViewClick}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-brand-blue-600 border border-slate-200/80 flex items-center justify-center transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
            title="Xem nhanh thông tin"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Product Image */}
        <Link href={`/product/${product.slug}`} className="w-full h-full flex items-center justify-center">
          <img
            src={
              imgError
                ? "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80"
                : product.images[0]
            }
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Product Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Stock status */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {product.brand}
            </span>
            <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5 shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Còn hàng
            </span>
          </div>

          {/* Product Name */}
          <Link href={`/product/${product.slug}`} className="block group-hover:text-brand-blue-600 transition-colors">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug min-h-[2.5rem]">
              {product.name}
            </h4>
          </Link>

          {/* Packaging Spec */}
          <p className="text-[11px] text-slate-400 mt-1">
            Quy cách: <span className="text-slate-600 font-medium">{product.packaging}</span>
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating) ? "fill-current" : "text-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-700">{product.rating}</span>
            <span className="text-[10px] text-slate-400">({product.reviewCount})</span>
          </div>
        </div>

        {/* Pricing & CTA Button */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          {/* Prices */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-black text-brand-blue-700">
                {formatVND(currentPrice)}
              </span>
            </div>
            {product.salePrice && (
              <span className="text-[10px] sm:text-[11px] text-slate-400 line-through block leading-tight">
                {formatVND(product.price)}
              </span>
            )}
          </div>

          {/* Action CTA Button */}
          {product.isPrescription ? (
            <button
              onClick={handleActionClick}
              className="px-3 py-2 rounded-xl text-xs font-bold text-brand-blue-700 bg-brand-blue-50 hover:bg-brand-blue-100 border border-brand-blue-200/90 transition-all duration-200 flex items-center gap-1 shrink-0 active:scale-95 shadow-sm"
              title="Sản phẩm cần tư vấn đơn thuốc từ Dược sĩ"
            >
              <Stethoscope className="w-3.5 h-3.5 text-brand-blue-600" />
              <span className="hidden sm:inline">Tư vấn Dược sĩ</span>
              <span className="sm:hidden">Tư vấn</span>
            </button>
          ) : (
            <button
              onClick={handleActionClick}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue-600 to-brand-cyan-600 hover:brightness-105 shadow-sm hover:shadow-medical transition-all duration-200 flex items-center gap-1 shrink-0 active:scale-95"
              title="Thêm vào giỏ hàng"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Chọn mua</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
