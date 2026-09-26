"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { formatVND } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import { ProductImageStage } from "./ProductImageStage";
import {
  Star,
  ShoppingBag,
  Stethoscope,
  Heart,
  Eye,
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
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

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
      if (onAddToCart) {
        onAddToCart(product);
      } else {
        addToCart(product, 1);
      }
    }
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between h-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 p-3 sm:p-3.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-depth-2 hover:border-brand-blue-200/90 select-none ${className}`}
    >
      {/* 1. TOP IMAGE STAGE CONTAINER */}
      <div className="relative w-full mb-3">
        <Link href={`/product/${product.slug}`} className="block focus:outline-none">
          <ProductImageStage product={product} />
        </Link>

        {/* Badge System: Maximum 1-2 primary badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start pointer-events-none">
          {product.isPrescription ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Thuốc kê đơn (Rx)
            </span>
          ) : (
            <>
              {discountPercent > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                  -{discountPercent}%
                </span>
              )}
              {product.isBestSeller && discountPercent === 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                  Bán chạy
                </span>
              )}
            </>
          )}
        </div>

        {/* Quick Action Floating Buttons (Wishlist & Quick View) */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
          <button
            onClick={handleWishlistToggle}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs cursor-pointer ${
              isWishlisted
                ? "bg-rose-50 text-rose-500 border border-rose-200"
                : "bg-white/90 hover:bg-white text-slate-400 hover:text-rose-500 border border-slate-200/80"
            }`}
            title="Lưu vào danh sách quan tâm"
            aria-label="Lưu yêu thích"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                isWishlisted ? "fill-current text-rose-500" : ""
              }`}
            />
          </button>

          {onQuickView && (
            <button
              onClick={handleQuickViewClick}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-brand-blue-600 border border-slate-200/80 flex items-center justify-center transition-all duration-200 shadow-xs opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 cursor-pointer hidden sm:flex"
              title="Xem nhanh thông tin"
              aria-label="Xem nhanh"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. PRODUCT INFO & CONTENT AREA */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand */}
          <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block truncate mb-1">
            {product.brand}
          </span>

          {/* Product Name */}
          <Link
            href={`/product/${product.slug}`}
            className="block group-hover:text-brand-blue-600 transition-colors focus:outline-none"
          >
            <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-900 line-clamp-2 leading-snug min-h-[2.4rem]">
              {product.name}
            </h3>
          </Link>

          {/* Pack size & specification */}
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
            Quy cách: <span className="text-slate-700 font-medium">{product.packaging}</span>
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

        {/* 3. PRICING & ACTION CTA */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
          {/* Price Stack */}
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-black text-brand-blue-700 leading-tight">
              {formatVND(currentPrice)}
            </span>
            {product.salePrice && product.salePrice < product.price ? (
              <span className="text-[10.5px] text-slate-400 line-through leading-none mt-0.5">
                {formatVND(product.price)}
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 font-semibold leading-none mt-0.5">
                Đã có VAT
              </span>
            )}
          </div>

          {/* Action CTA Button */}
          {product.isPrescription ? (
            <button
              onClick={handleActionClick}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-brand-blue-700 bg-brand-blue-50 hover:bg-brand-blue-100 border border-brand-blue-200/90 transition-all duration-150 flex items-center gap-1 shrink-0 active:scale-95 shadow-xs cursor-pointer"
              title="Sản phẩm cần có chỉ định của Bác sĩ"
            >
              <Stethoscope className="w-3.5 h-3.5 text-brand-blue-600 shrink-0" />
              <span className="whitespace-nowrap">Tư vấn Dược sĩ</span>
            </button>
          ) : (
            <button
              onClick={handleActionClick}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-brand-blue-600 to-brand-cyan-600 hover:brightness-105 shadow-xs hover:shadow-sm transition-all duration-150 flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
              title="Thêm vào giỏ hàng"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Chọn mua</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
