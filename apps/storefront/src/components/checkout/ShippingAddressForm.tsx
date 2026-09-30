"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Map,
  FileText,
  Clock,
  Navigation,
} from "lucide-react";
import dynamic from "next/dynamic";
import { FulfillmentType } from "./FulfillmentSelector";

const DeliveryRealMap = dynamic(
  () => import("@/components/checkout/DeliveryRealMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-brand-blue-600 border-t-transparent animate-spin" />
        <span className="text-xs font-medium">Đang tải bản đồ...</span>
      </div>
    ),
  }
);

export interface AdminDistrict {
  code: string;
  name: string;
  full_name: string;
  level: string;
  parent_code: string;
}

export interface AdminProvince {
  code: string;
  name: string;
  full_name: string;
  level: string;
  districts: AdminDistrict[];
}

export interface NearestWarehouseInfo {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_address: string;
  distance_km: number;
  estimated_delivery_time: string;
  navigation_url: string;
  lat?: number;
  lng?: number;
}

interface ShippingAddressFormProps {
  fulfillmentType: FulfillmentType;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  selectedProvinceCode: string;
  setSelectedProvinceCode: (v: string) => void;
  selectedDistrictCode: string;
  setSelectedDistrictCode: (v: string) => void;
  wardName: string;
  setWardName: (v: string) => void;
  streetAddress: string;
  setStreetAddress: (v: string) => void;
  orderNote: string;
  setOrderNote: (v: string) => void;
  needInvoice: boolean;
  setNeedInvoice: (v: boolean) => void;
  taxCode?: string;
  setTaxCode?: (v: string) => void;
  companyName?: string;
  setCompanyName?: (v: string) => void;
  adminTree: AdminProvince[];
  coords: { lat: number; lng: number } | null;
  setCoords: (c: { lat: number; lng: number } | null) => void;
  nearestWarehouse: NearestWarehouseInfo | null;
  isLocating: boolean;
  onGetLocation: () => void;
}

export default function ShippingAddressForm({
  fulfillmentType,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  selectedProvinceCode,
  setSelectedProvinceCode,
  selectedDistrictCode,
  setSelectedDistrictCode,
  wardName,
  setWardName,
  streetAddress,
  setStreetAddress,
  orderNote,
  setOrderNote,
  needInvoice,
  setNeedInvoice,
  taxCode = "",
  setTaxCode,
  companyName = "",
  setCompanyName,
  adminTree,
  coords,
  setCoords,
  nearestWarehouse,
  isLocating,
  onGetLocation,
}: ShippingAddressFormProps) {
  const [showMap, setShowMap] = useState(false);

  const quickNotes = [
    "Giao giờ hành chính",
    "Gọi điện trước khi giao",
    "Cần dược sĩ tư vấn cách uống",
    "Giao hàng kín đáo",
  ];

  const handleAddQuickNote = (noteText: string) => {
    if (!orderNote.includes(noteText)) {
      setOrderNote(orderNote ? `${orderNote}, ${noteText}` : noteText);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-4 sm:p-5 space-y-4">
      {/* Title */}
      <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {fulfillmentType === "DELIVERY"
              ? "Thông tin nhận hàng"
              : "Thông tin người lấy thuốc"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dược sĩ H4CARE sẽ liên hệ số điện thoại này để xác nhận đơn
          </p>
        </div>
      </div>

      {/* Row 1: Name & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Họ và tên người nhận <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all placeholder:text-slate-400"
            />
            <User className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Số điện thoại <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="0912 345 678"
              className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all font-mono placeholder:text-slate-400"
            />
            <Phone className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 2: Email (Optional) */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Email <span className="text-slate-400 font-normal">(tùy chọn - nhận mã tra cứu & hóa đơn điện tử)</span>
        </label>
        <div className="relative">
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="example@gmail.com"
            className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all placeholder:text-slate-400"
          />
          <Mail className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Delivery-Only Fields (Address) */}
      {fulfillmentType === "DELIVERY" && (
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Địa chỉ giao thuốc
            </span>
            <button
              type="button"
              onClick={onGetLocation}
              disabled={isLocating}
              className="text-[11px] font-semibold text-brand-blue-700 hover:text-brand-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{isLocating ? "Đang định vị GPS..." : "Lấy vị trí GPS hiện tại"}</span>
            </button>
          </div>

          {/* Administrative Selectors: Province & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all bg-white font-medium text-slate-800"
              >
                {adminTree.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quận / Huyện <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedDistrictCode}
                onChange={(e) => setSelectedDistrictCode(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all bg-white font-medium text-slate-800"
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

          {/* Phường / Xã & Số nhà, tên đường */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phường / Xã
              </label>
              <input
                type="text"
                value={wardName}
                onChange={(e) => setWardName(e.target.value)}
                placeholder="Ví dụ: Phường 13"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số nhà, tên đường, tòa nhà <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Ví dụ: 45 Hoàng Hoa Thám, Tòa nhà A, Phòng 302"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Nearest warehouse service note (compact, not overwhelming) */}
          {nearestWarehouse && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-brand-blue-600 shrink-0" />
                <span>
                  Dự kiến giao: <strong className="text-slate-800">{nearestWarehouse.estimated_delivery_time}</strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  (~{nearestWarehouse.distance_km} km)
                </span>
              </div>

              {nearestWarehouse.navigation_url && (
                <a
                  href={nearestWarehouse.navigation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-700 hover:underline flex items-center gap-1 font-medium text-[11px]"
                >
                  <span>Chỉ đường</span>
                  <Navigation className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          )}

          {/* Subtle Collapsible Map Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-xs font-medium text-slate-600 hover:text-brand-blue-700 flex items-center gap-1.5 py-1"
            >
              <Map className="w-3.5 h-3.5 text-slate-400" />
              <span>{showMap ? "Thu gọn bản đồ" : "Xem / ghim vị trí trên bản đồ (tùy chọn)"}</span>
              {showMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showMap && (
              <div className="mt-2 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                <DeliveryRealMap
                  customerCoords={coords}
                  nearestWarehouse={nearestWarehouse}
                  onLocationSelect={(lat, lng) => {
                    setCoords({ lat, lng });
                  }}
                  isLocating={isLocating}
                  onGetGps={onGetLocation}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row: Notes for Pharmacist & Delivery */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Lời nhắn cho Dược sĩ & Shipper
        </label>
        <input
          type="text"
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Nhập ghi chú giao hàng hoặc hướng dẫn thêm..."
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all placeholder:text-slate-400"
        />

        {/* Quick Tag Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] text-slate-400">Gợi ý nhanh:</span>
          {quickNotes.map((note) => (
            <button
              key={note}
              type="button"
              onClick={() => handleAddQuickNote(note)}
              className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            >
              + {note}
            </button>
          ))}
        </div>
      </div>

      {/* Row: Corporate VAT Invoice Request (Long Chau style) */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
          <input
            type="checkbox"
            checked={needInvoice}
            onChange={(e) => setNeedInvoice(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
          />
          <span>Yêu cầu xuất hóa đơn điện tử (VAT) cho doanh nghiệp</span>
        </label>

        {needInvoice && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Tên công ty / Doanh nghiệp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName && setCompanyName(e.target.value)}
                placeholder="Công ty Cổ phần Dược phẩm ABC"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Mã số thuế (MST) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={taxCode}
                onChange={(e) => setTaxCode && setTaxCode(e.target.value)}
                placeholder="0101234567"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 bg-white font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
