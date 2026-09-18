"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PRODUCTS_DATA } from "@/data/products";
import { Product, ProductFilterState, ProductSortOption } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductFilterSidebar } from "@/components/product/ProductFilterSidebar";
import { ProductSortBar } from "@/components/product/ProductSortBar";
import { ProductQuickViewModal } from "@/components/product/ProductQuickViewModal";
import { RxConsultModal } from "@/components/product/RxConsultModal";
import { FptPolyBadge } from "@/components/branding/FptPolyBadge";
import {
  ChevronRight,
  Home,
  PackageOpen,
  RotateCcw,
  X,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const INITIAL_FILTERS: ProductFilterState = {
  category: "",
  subCategory: "",
  brand: [],
  priceRange: "",
  origin: [],
  dosageForm: [],
  prescriptionType: "all",
};

const ITEMS_PER_PAGE = 8;

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilterState>(INITIAL_FILTERS);
  const [sortOption, setSortOption] = useState<ProductSortOption>("popular");
  const [gridCols, setGridCols] = useState<3 | 4>(3);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Modals state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [rxConsultProduct, setRxConsultProduct] = useState<Product | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return PRODUCTS_DATA.filter((product) => {
      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      // Prescription type filter
      if (filters.prescriptionType === "rx" && !product.isPrescription) {
        return false;
      }
      if (filters.prescriptionType === "otc" && product.isPrescription) {
        return false;
      }
      // Brand filter
      if (filters.brand.length > 0 && !filters.brand.includes(product.brand)) {
        return false;
      }
      // Origin filter
      if (filters.origin.length > 0 && !filters.origin.includes(product.origin)) {
        return false;
      }
      // Dosage form filter
      if (
        filters.dosageForm.length > 0 &&
        !filters.dosageForm.includes(product.dosageForm)
      ) {
        return false;
      }
      // Price range filter
      const effectivePrice = product.salePrice || product.price;
      if (filters.priceRange === "under-100" && effectivePrice >= 100000) {
        return false;
      }
      if (
        filters.priceRange === "100-300" &&
        (effectivePrice < 100000 || effectivePrice > 300000)
      ) {
        return false;
      }
      if (
        filters.priceRange === "300-500" &&
        (effectivePrice < 300000 || effectivePrice > 500000)
      ) {
        return false;
      }
      if (filters.priceRange === "above-500" && effectivePrice <= 500000) {
        return false;
      }

      return true;
    });
  }, [filters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortOption) {
      case "newest":
        return list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "price-asc":
        return list.sort(
          (a, b) => (a.salePrice || a.price) - (b.salePrice || b.price)
        );
      case "price-desc":
        return list.sort(
          (a, b) => (b.salePrice || b.price) - (a.salePrice || a.price)
        );
      case "rating":
        return list.sort((a, b) => b.rating - a.rating);
      case "popular":
      default:
        return list.sort((a, b) => b.reviewCount - a.reviewCount);
    }
  }, [filteredProducts, sortOption]);

  // Pagination logic
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  const handleFilterChange = (newFilters: ProductFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* 1. Header */}
      <Header />

      {/* 2. Breadcrumb & Page Banner */}
      <div className="bg-white border-b border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-brand-blue-600 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-semibold text-slate-800">Tất cả sản phẩm</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Danh Mục Thuốc & Sản Phẩm Y Tế
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cung cấp đầy đủ thuốc kê đơn, không kê đơn, thực phẩm chức năng và thiết bị y tế chuẩn GPP.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Product Listing Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT SIDEBAR (Desktop) ================= */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24">
            <ProductFilterSidebar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              totalProducts={filteredProducts.length}
            />
          </aside>

          {/* ================= RIGHT MAIN PRODUCT GRID ================= */}
          <main className="col-span-12 lg:col-span-9 space-y-6">
            {/* Sort and View Options Bar */}
            <ProductSortBar
              total={filteredProducts.length}
              currentSort={sortOption}
              onSortChange={setSortOption}
              gridCols={gridCols}
              onGridColsChange={setGridCols}
              onOpenMobileFilter={() => setMobileFilterOpen(true)}
            />

            {/* Active Filters Badges */}
            {(filters.category ||
              filters.brand.length > 0 ||
              filters.priceRange ||
              filters.origin.length > 0 ||
              filters.dosageForm.length > 0 ||
              filters.prescriptionType !== "all") && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-400">Đang lọc theo:</span>
                {filters.prescriptionType !== "all" && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-brand-blue-50 text-brand-blue-700 font-semibold border border-brand-blue-200">
                    {filters.prescriptionType === "rx" ? "Thuốc kê đơn (Rx)" : "Không kê đơn"}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-rose-600"
                      onClick={() => setFilters({ ...filters, prescriptionType: "all" })}
                    />
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 font-semibold border border-cyan-200">
                    Danh mục: {filters.category}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-rose-600"
                      onClick={() => setFilters({ ...filters, category: "" })}
                    />
                  </span>
                )}
                {filters.brand.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium"
                  >
                    {b}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-rose-600"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          brand: filters.brand.filter((item) => item !== b),
                        })
                      }
                    />
                  </span>
                ))}
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 font-bold hover:underline ml-auto"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Product Cards Grid */}
            {paginatedProducts.length > 0 ? (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  gridCols === 4
                    ? "lg:grid-cols-4 gap-4"
                    : "lg:grid-cols-3 gap-5"
                }`}
              >
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onOpenRxConsult={(p) => setRxConsultProduct(p)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State when no products match filters */
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <PackageOpen className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Không tìm thấy sản phẩm phù hợp
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Hãy thử nới lỏng hoặc xóa các tiêu chí bộ lọc (khoảng giá, thương hiệu, loại thuốc) để xem thêm các sản phẩm khác.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleResetFilters}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Xóa tất cả bộ lọc
                </Button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-6 flex items-center justify-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-brand-blue-600 text-white shadow-md shadow-brand-blue-500/20"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ================= MOBILE FILTER MODAL ================= */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-[85%] max-w-sm bg-white h-full overflow-y-auto p-5 space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Bộ Lọc Tìm Kiếm</h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="pt-4">
                <ProductFilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  totalProducts={filteredProducts.length}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setMobileFilterOpen(false)}
              >
                Áp dụng bộ lọc ({filteredProducts.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onOpenRxConsult={(p) => setRxConsultProduct(p)}
      />

      {/* Rx Consultation Modal */}
      <RxConsultModal
        product={rxConsultProduct}
        isOpen={!!rxConsultProduct}
        onClose={() => setRxConsultProduct(null)}
      />

      {/* Academic Project Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 text-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <FptPolyBadge variant="dark" />
          <p className="text-[11px] text-slate-400">
            H4CARE Pharmacy • Đồ án sinh viên FPT Polytechnic • Hùng - Đức Anh - Hoàn - Cường
          </p>
        </div>
      </footer>
    </div>
  );
}
