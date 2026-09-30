"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Search,
  Check,
  Building,
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
        <span className="text-xs font-medium">Đang tải bản đồ định vị...</span>
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

export interface AdminWard {
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

export interface StructuredAddress {
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  wardCode: string;
  wardName: string;
  streetAddress: string;
  fullAddress: string;
  lat: number;
  lng: number;
  isVerified: boolean;
}

export interface SuggestionItem {
  place_id: string;
  display_name: string;
  street_address: string;
  ward_name: string;
  district_name: string;
  province_name: string;
  lat: number;
  lng: number;
  verified: boolean;
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
  selectedWardCode: string;
  setSelectedWardCode: (v: string) => void;
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
  isVerified: boolean;
  setIsVerified: (v: boolean) => void;
  verifiedAddress: StructuredAddress | null;
  setVerifiedAddress: (v: StructuredAddress | null) => void;
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
  selectedWardCode,
  setSelectedWardCode,
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
  isVerified,
  setIsVerified,
  verifiedAddress,
  setVerifiedAddress,
}: ShippingAddressFormProps) {
  // Ward options state
  const [wards, setWards] = useState<AdminWard[]>([]);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Autocomplete suggestions state
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch wards when District changes
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      return;
    }

    let isMounted = true;
    setIsLoadingWards(true);

    fetch(`/api/v1/addresses/administrative-units?level=WARD&parent_code=${selectedDistrictCode}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: AdminWard[]) => {
        if (!isMounted) return;
        setWards(data || []);
      })
      .catch((err) => {
        console.warn("Lỗi khi tải danh sách Phường/Xã:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingWards(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDistrictCode]);

  // Debounced address search (350ms) bounded to chosen Province + District + Ward
  useEffect(() => {
    if (
      !streetAddress ||
      streetAddress.trim().length < 2 ||
      !selectedProvinceCode ||
      !selectedDistrictCode ||
      !selectedWardCode ||
      hasSelectedSuggestion ||
      isVerified
    ) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const queryParams = new URLSearchParams({
          q: streetAddress.trim(),
          province_code: selectedProvinceCode,
          district_code: selectedDistrictCode,
          ward_code: selectedWardCode,
        });

        const res = await fetch(`/api/v1/addresses/suggest?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
          setShowSuggestions(Array.isArray(data) && data.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (e) {
        console.warn("Lỗi tìm kiếm gợi ý địa chỉ:", e);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [
    streetAddress,
    selectedProvinceCode,
    selectedDistrictCode,
    selectedWardCode,
    hasSelectedSuggestion,
    isVerified,
  ]);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers for cascading selects
  const handleProvinceChange = (newCode: string) => {
    setSelectedProvinceCode(newCode);
    setSelectedDistrictCode("");
    setSelectedWardCode("");
    setWardName("");
    setWards([]);
    setStreetAddress("");
    setCoords(null);
    setIsVerified(false);
    setVerifiedAddress(null);
    setHasSelectedSuggestion(false);
    setLocalError(null);
  };

  const handleDistrictChange = (newCode: string) => {
    setSelectedDistrictCode(newCode);
    setSelectedWardCode("");
    setWardName("");
    setStreetAddress("");
    setCoords(null);
    setIsVerified(false);
    setVerifiedAddress(null);
    setHasSelectedSuggestion(false);
    setLocalError(null);
  };

  const handleWardChange = (newCode: string) => {
    setSelectedWardCode(newCode);
    const found = wards.find((w) => w.code === newCode);
    if (found) {
      setWardName(found.name);
    }
    setStreetAddress("");
    setCoords(null);
    setIsVerified(false);
    setVerifiedAddress(null);
    setHasSelectedSuggestion(false);
    setLocalError(null);
  };

  const handleSelectSuggestion = (sug: SuggestionItem) => {
    setStreetAddress(sug.street_address);
    setCoords({ lat: sug.lat, lng: sug.lng });
    setHasSelectedSuggestion(true);
    setShowSuggestions(false);
    setLocalError(null);
  };

  const handleConfirmAddress = () => {
    setLocalError(null);

    if (!selectedProvinceCode) {
      setLocalError("Vui lòng chọn Tỉnh / Thành phố.");
      return;
    }
    if (!selectedDistrictCode) {
      setLocalError("Vui lòng chọn Quận / Huyện.");
      return;
    }
    if (!selectedWardCode) {
      setLocalError("Vui lòng chọn Phường / Xã.");
      return;
    }
    if (!streetAddress.trim() || streetAddress.trim().length < 3) {
      setLocalError("Vui lòng nhập số nhà, tên đường cụ thể.");
      return;
    }
    if (!coords || !coords.lat || !coords.lng) {
      setLocalError("Vui lòng chọn vị trí tọa độ từ gợi ý hoặc ghim trên bản đồ.");
      return;
    }

    const provObj = adminTree.find((p) => p.code === selectedProvinceCode);
    const distObj = provObj?.districts?.find((d) => d.code === selectedDistrictCode);
    const wardObj = wards.find((w) => w.code === selectedWardCode);

    const pName = provObj ? provObj.full_name : "";
    const dName = distObj ? distObj.name : "";
    const wName = wardObj ? wardObj.name : wardName;
    const fullAddress = `${streetAddress.trim()}, ${wName}, ${dName}, ${pName}`;

    const structured: StructuredAddress = {
      provinceCode: selectedProvinceCode,
      provinceName: pName,
      districtCode: selectedDistrictCode,
      districtName: dName,
      wardCode: selectedWardCode,
      wardName: wName,
      streetAddress: streetAddress.trim(),
      fullAddress,
      lat: coords.lat,
      lng: coords.lng,
      isVerified: true,
    };

    setVerifiedAddress(structured);
    setIsVerified(true);
  };

  const handleEditAddress = () => {
    setIsVerified(false);
    setHasSelectedSuggestion(true);
    setLocalError(null);
  };

  const quickNotes = [
    "Giao giờ hành chính",
    "Gọi điện trước khi giao",
    "Gửi bảo vệ tòa nhà",
    "Giao hàng kín đáo",
  ];

  const handleAddQuickNote = (noteText: string) => {
    if (!orderNote.includes(noteText)) {
      setOrderNote(orderNote ? `${orderNote}, ${noteText}` : noteText);
    }
  };

  const currentDistricts = adminTree.find((p) => p.code === selectedProvinceCode)?.districts || [];

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
          Email <span className="text-slate-400 font-normal">(tùy chọn - nhận mã tra cứu &amp; hóa đơn điện tử)</span>
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

      {/* DELIVERY AREA: STATE A (Selecting/Verifying) vs STATE B (Verified Summary) */}
      {fulfillmentType === "DELIVERY" && (
        <div className="pt-3 border-t border-slate-100 space-y-3">
          {/* ============================================================ */}
          {/* TRẠNG THÁI B: ĐÃ XÁC MINH THÀNH CÔNG                         */}
          {/* ============================================================ */}
          {isVerified && verifiedAddress ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã xác thực vị trí giao hàng
                </span>

                <button
                  type="button"
                  onClick={handleEditAddress}
                  className="text-xs font-semibold text-brand-blue-700 hover:text-brand-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Thay đổi địa chỉ</span>
                </button>
              </div>

              {/* Formatted address display */}
              <div className="bg-white rounded-lg p-3 border border-emerald-100 text-xs text-slate-800 space-y-1">
                <div className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{verifiedAddress.streetAddress}</span>
                </div>
                <p className="text-slate-600 pl-5.5">
                  {verifiedAddress.wardName}, {verifiedAddress.districtName}, {verifiedAddress.provinceName}
                </p>
                <div className="pl-5.5 text-[11px] text-slate-400 font-mono">
                  Tọa độ GPS: {verifiedAddress.lat.toFixed(4)}, {verifiedAddress.lng.toFixed(4)}
                </div>
              </div>

              {/* Nearest Warehouse ETA info */}
              {nearestWarehouse && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
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
            </div>
          ) : (
            /* ============================================================ */
            /* TRẠNG THÁI A: ĐANG CHỌN / CHƯA XÁC MINH (Cascading 4 Steps) */
            /* ============================================================ */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-brand-blue-600" />
                  Địa chỉ giao hàng (Chọn theo từng cấp)
                </span>

                <button
                  type="button"
                  onClick={onGetLocation}
                  disabled={isLocating}
                  className="text-[11px] font-semibold text-brand-blue-700 hover:text-brand-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isLocating ? "Đang định vị GPS..." : "Lấy vị trí GPS"}</span>
                </button>
              </div>

              {/* 3 Cascading Selectors: Tỉnh/Thành -> Quận/Huyện -> Phường/Xã */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Bước 1: Tỉnh / Thành phố */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    1. Tỉnh / Thành phố <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedProvinceCode}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all bg-white font-medium text-slate-800"
                  >
                    <option value="">-- Chọn Tỉnh / Thành --</option>
                    {adminTree.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bước 2: Quận / Huyện */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    2. Quận / Huyện <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={!selectedProvinceCode}
                    value={selectedDistrictCode}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all bg-white font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedProvinceCode ? "-- Chọn Tỉnh trước --" : "-- Chọn Quận / Huyện --"}
                    </option>
                    {currentDistricts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bước 3: Phường / Xã */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    3. Phường / Xã <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={!selectedDistrictCode || isLoadingWards}
                    value={selectedWardCode}
                    onChange={(e) => handleWardChange(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all bg-white font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedDistrictCode
                        ? "-- Chọn Quận trước --"
                        : isLoadingWards
                        ? "Đang tải phường/xã..."
                        : "-- Chọn Phường / Xã --"}
                    </option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bước 4: Số nhà, tên đường + Autocomplete */}
              <div className="relative" ref={suggestionsRef}>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  4. Số nhà, tên đường / Tòa nhà <span className="text-rose-500">*</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    (Gõ để xem gợi ý chuẩn trong phạm vi đã chọn)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!selectedWardCode}
                    value={streetAddress}
                    onChange={(e) => {
                      setStreetAddress(e.target.value);
                      setHasSelectedSuggestion(false);
                      setIsVerified(false);
                      setLocalError(null);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0 && !hasSelectedSuggestion) {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder={
                      !selectedWardCode
                        ? "Vui lòng chọn xong Phường / Xã ở trên để nhập đường"
                        : "Ví dụ: 45 Hoàng Hoa Thám hoặc Tòa nhà Bitexco"
                    }
                    className="w-full pl-3 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {isLoadingSuggestions ? (
                      <div className="w-3.5 h-3.5 border-2 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Autocomplete Dropdown Popover */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-100">
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Gợi ý địa chỉ chuẩn xác
                    </div>
                    {suggestions.map((sug) => (
                      <button
                        key={sug.place_id}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-2.5 cursor-pointer group"
                      >
                        <MapPin className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 group-hover:text-brand-blue-700">
                            {sug.street_address || sug.display_name}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {sug.display_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Error message in State A */}
              {localError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{localError}</span>
                </div>
              )}

              {/* Bước 5: Bản đồ tương tác xác nhận tọa độ */}
              {selectedWardCode && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-blue-600" />
                      5. Kiểm tra &amp; Ghim vị trí chính xác trên bản đồ
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Bạn có thể kéo ghim 📍 đến đúng số nhà)
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <DeliveryRealMap
                      customerCoords={coords}
                      nearestWarehouse={nearestWarehouse}
                      onLocationSelect={(lat, lng) => {
                        setCoords({ lat, lng });
                        setIsVerified(false);
                      }}
                      isLocating={isLocating}
                      onGetGps={onGetLocation}
                    />
                  </div>

                  {coords && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
                      <span>Tọa độ đã chọn: <strong>{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</strong></span>
                      <span className="text-emerald-700 font-medium">✓ Đã định vị thành công</span>
                    </div>
                  )}

                  {/* Bước 6: Nút Xác nhận địa chỉ này */}
                  <button
                    type="button"
                    onClick={handleConfirmAddress}
                    disabled={
                      !selectedProvinceCode ||
                      !selectedDistrictCode ||
                      !selectedWardCode ||
                      !streetAddress.trim() ||
                      !coords
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>XÁC NHẬN ĐỊA CHỈ NÀY</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row: Notes for Pharmacist & Delivery (Completely Separate from Address) */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Lời nhắn cho Dược sĩ &amp; Shipper
          <span className="text-[10px] text-slate-400 font-normal ml-1">
            (Ghi chú giao hàng, ví dụ: gọi trước 15p, giao giờ hành chính...)
          </span>
        </label>
        <textarea
          rows={2}
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Nhập ghi chú giao hàng hoặc dặn dò dược sĩ..."
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all placeholder:text-slate-400 resize-none"
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

      {/* Row: Corporate VAT Invoice Request */}
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
