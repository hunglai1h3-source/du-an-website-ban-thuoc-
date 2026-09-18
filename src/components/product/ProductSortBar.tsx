"use client";

import React from "react";
import { ProductSortOption } from "@/types";
import {
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  Grid3X3,
} from "lucide-react";

interface ProductSortBarProps {
  total: number;
  currentSort: ProductSortOption;
  onSortChange: (sort: ProductSortOption) => void;
  gridCols: 3 | 4;
  onGridColsChange: (cols: 3 | 4) => void;
  onOpenMobileFilter: () => void;
}

export const ProductSortBar: React.FC<ProductSortBarProps> = ({
  total,
  currentSort,
  onSortChange,
  gridCols,
  onGridColsChange,
  onOpenMobileFilter,
}) => {
  const sortOptions: { value: ProductSortOption; label: string }[] = [
    { value: "popular", label: "Phổ biến nhất" },
    { value: "newest", label: "Mới nhất" },
    { value: "price-asc", label: "Giá: Thấp → Cao" },
    { value: "price-desc", label: "Giá: Cao → Thấp" },
    { value: "rating", label: "Đánh giá cao" },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
      {/* Left: Total products found & Mobile filter trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileFilter}
          className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4 text-brand-blue-600" />
          <span>Bộ Lọc</span>
        </button>

        <span className="text-xs text-slate-600 font-medium">
          Tìm thấy <span className="font-bold text-brand-blue-700">{total}</span> sản phẩm dược phẩm
        </span>
      </div>

      {/* Right: Sort dropdown & Grid switchers */}
      <div className="flex items-center gap-3">
        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sắp xếp:
          </span>
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue-500 cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Grid Layout Switcher */}
        <div className="hidden md:flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
          <button
            onClick={() => onGridColsChange(3)}
            className={`p-1.5 rounded-lg transition-colors ${
              gridCols === 3
                ? "bg-white text-brand-blue-600 shadow-sm"
                : "text-slate-400 hover:text-slate-700"
            }`}
            title="Hiển thị 3 cột"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onGridColsChange(4)}
            className={`p-1.5 rounded-lg transition-colors ${
              gridCols === 4
                ? "bg-white text-brand-blue-600 shadow-sm"
                : "text-slate-400 hover:text-slate-700"
            }`}
            title="Hiển thị 4 cột"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
