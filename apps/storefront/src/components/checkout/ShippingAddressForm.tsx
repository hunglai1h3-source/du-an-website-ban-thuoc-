"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Sparkles,
  Compass,
} from "lucide-react";
import dynamic from "next/dynamic";
import { FulfillmentType } from "./FulfillmentSelector";
import {
  administrativeService,
  ProvinceUnit,
  CommuneUnit,
  removeVietnameseAccents,
} from "@/services/administrativeService";

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
  communeCode: string;
  communeName: string;
  communeType: "ward" | "commune" | "special_zone";
  streetAddress: string;
  fullAddress: string;
  lat: number;
  lng: number;
  isVerified: boolean;
  placeId?: string;
  // Legacy aliases
  districtCode?: string;
  districtName?: string;
  wardCode?: string;
  wardName?: string;
}

export interface SuggestionItem {
  place_id: string;
  display_name: string;
  street_address: string;
  commune_name: string;
  province_name: string;
  lat: number;
  lng: number;
  verified: boolean;
}

export type AdminProvince = any;
export type AdminDistrict = any;
export type AdminWard = any;

export interface ShippingAddressFormProps {
  fulfillmentType: FulfillmentType;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  shippingAddress?: string;
  setShippingAddress?: (v: string) => void;
  orderNote: string;
  setOrderNote: (v: string) => void;
  selectedStoreId?: number;
  setSelectedStoreId?: (v: number) => void;
  isAddressVerified?: boolean;
  setIsAddressVerified?: (v: boolean) => void;
  isVerified?: boolean;
  setIsVerified?: (v: boolean) => void;
  verifiedAddress: StructuredAddress | null;
  setVerifiedAddress: (addr: StructuredAddress | null) => void;
  nearestWarehouse: NearestWarehouseInfo | null;
  setNearestWarehouse?: (wh: NearestWarehouseInfo | null) => void;

  // Compatibility props with cart/page.tsx
  selectedProvinceCode?: string;
  setSelectedProvinceCode?: (v: string) => void;
  selectedDistrictCode?: string;
  setSelectedDistrictCode?: (v: string) => void;
  selectedWardCode?: string;
  setSelectedWardCode?: (v: string) => void;
  wardName?: string;
  setWardName?: (v: string) => void;
  streetAddress?: string;
  setStreetAddress?: (v: string) => void;
  needInvoice?: boolean;
  setNeedInvoice?: (v: boolean) => void;
  taxCode?: string;
  setTaxCode?: (v: string) => void;
  companyName?: string;
  setCompanyName?: (v: string) => void;
  adminTree?: any[];
  coords?: { lat: number; lng: number } | null;
  setCoords?: (c: { lat: number; lng: number } | null) => void;
  isLocating?: boolean;
  onGetLocation?: () => void;
}

const JUNK_KEYWORDS = [
  "tt",
  "abc",
  "xyz",
  "test",
  "123",
  "123 test",
  "nhà tôi",
  "nha toi",
  "dự án",
  "gần trường",
  "xxx",
  "asdf",
];

export default function ShippingAddressForm({
  fulfillmentType,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  shippingAddress,
  setShippingAddress,
  orderNote,
  setOrderNote,
  isAddressVerified: propIsAddressVerified,
  setIsAddressVerified: propSetIsAddressVerified,
  isVerified: propIsVerified,
  setIsVerified: propSetIsVerified,
  verifiedAddress,
  setVerifiedAddress,
  nearestWarehouse,
  setNearestWarehouse,
}: ShippingAddressFormProps) {
  const isAddressVerified = propIsVerified !== undefined ? propIsVerified : (propIsAddressVerified || false);
  const setIsAddressVerified = (v: boolean) => {
    if (propSetIsVerified) propSetIsVerified(v);
    if (propSetIsAddressVerified) propSetIsAddressVerified(v);
  };
  // Cascading Selection State (2-tier: Tỉnh/Thành -> Xã/Phường/Đặc khu)
  const [selectedProvince, setSelectedProvince] = useState<ProvinceUnit | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<CommuneUnit | null>(null);
  const [streetInput, setStreetInput] = useState("");

  // Coordinates & Pin
  const [currentLat, setCurrentLat] = useState<number>(10.8231);
  const [currentLng, setCurrentLng] = useState<number>(106.6297);

  // Search in dropdowns
  const [provinceSearch, setProvinceSearch] = useState("");
  const [communeSearch, setCommuneSearch] = useState("");
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isCommuneOpen, setIsCommuneOpen] = useState(false);

  // Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const provinceRef = useRef<HTMLDivElement>(null);
  const communeRef = useRef<HTMLDivElement>(null);
  const streetRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (provinceRef.current && !provinceRef.current.contains(e.target as Node)) {
        setIsProvinceOpen(false);
      }
      if (communeRef.current && !communeRef.current.contains(e.target as Node)) {
        setIsCommuneOpen(false);
      }
      if (streetRef.current && !streetRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered 34 Provinces
  const filteredProvinces = useMemo(() => {
    return administrativeService.getProvinces(provinceSearch);
  }, [provinceSearch]);

  // Filtered Communes/Wards for selected province
  const filteredCommunes = useMemo(() => {
    if (!selectedProvince) return [];
    return administrativeService.getCommunes(selectedProvince.code, undefined, communeSearch);
  }, [selectedProvince, communeSearch]);

  // Initialize from existing verified address if available
  useEffect(() => {
    if (verifiedAddress && !selectedProvince) {
      const p = administrativeService.getProvinceByCode(verifiedAddress.provinceCode);
      const c = administrativeService.getCommuneByCode(verifiedAddress.communeCode);
      if (p) setSelectedProvince(p);
      if (c) setSelectedCommune(c);
      if (verifiedAddress.streetAddress) setStreetInput(verifiedAddress.streetAddress);
      if (verifiedAddress.lat && verifiedAddress.lng) {
        setCurrentLat(verifiedAddress.lat);
        setCurrentLng(verifiedAddress.lng);
      }
    }
  }, [verifiedAddress, selectedProvince]);

  // Handle Province Select
  const handleSelectProvince = (prov: ProvinceUnit) => {
    setSelectedProvince(prov);
    setSelectedCommune(null);
    setIsProvinceOpen(false);
    setProvinceSearch("");
    setIsAddressVerified(false);
    setInputError(null);

    // Center map on province bounding box or centroid
    if (prov.boundingBox) {
      const midLat = (prov.boundingBox.minLat + prov.boundingBox.maxLat) / 2;
      const midLng = (prov.boundingBox.minLng + prov.boundingBox.maxLng) / 2;
      setCurrentLat(midLat);
      setCurrentLng(midLng);
    }
  };

  // Handle Commune Select
  const handleSelectCommune = (comm: CommuneUnit) => {
    setSelectedCommune(comm);
    setIsCommuneOpen(false);
    setCommuneSearch("");
    setIsAddressVerified(false);
    setInputError(null);
  };

  // Handle Street input with debounce autocomplete
  useEffect(() => {
    if (!selectedProvince || !selectedCommune || !streetInput.trim() || isAddressVerified) {
      setSuggestions([]);
      return;
    }

    const clean = streetInput.trim().toLowerCase();
    // Validate anti-junk
    for (const junk of JUNK_KEYWORDS) {
      if (clean === junk || clean.startsWith(junk + " ")) {
        setInputError(`Địa chỉ "${streetInput}" không cụ thể. Vui lòng nhập số nhà và tên đường thật.`);
        setSuggestions([]);
        return;
      }
    }
    setInputError(null);

    if (clean.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const url = `/api/v1/locations/suggest?q=${encodeURIComponent(streetInput.trim())}&province_code=${selectedProvince.code}&commune_code=${selectedCommune.code}`;
        const res = await fetch(url);
        if (res.ok) {
          const data: SuggestionItem[] = await res.json();
          setSuggestions(data);
          setIsSuggestionsOpen(data.length > 0);
        }
      } catch {
        // Fallback local suggestion
        const display = `${streetInput.trim()}, ${selectedCommune.fullName}, ${selectedProvince.fullName}`;
        setSuggestions([
          {
            place_id: "local_1",
            display_name: display,
            street_address: streetInput.trim(),
            commune_name: selectedCommune.fullName,
            province_name: selectedProvince.fullName,
            lat: currentLat,
            lng: currentLng,
            verified: true,
          },
        ]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 380);

    return () => clearTimeout(timer);
  }, [streetInput, selectedProvince, selectedCommune, isAddressVerified, currentLat, currentLng]);

  // Handle Picking a suggestion
  const handleSelectSuggestion = (sug: SuggestionItem) => {
    setStreetInput(sug.street_address);
    setCurrentLat(sug.lat);
    setCurrentLng(sug.lng);
    setIsSuggestionsOpen(false);
    setInputError(null);
  };

  // Handle Map Pin Dragged
  const handleMapLocationChange = (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    // Pin moved -> require re-verification
    if (isAddressVerified) {
      setIsAddressVerified(false);
    }
  };

  // Handle "Xác nhận địa chỉ này"
  const handleConfirmAddress = () => {
    if (!selectedProvince) {
      setInputError("Vui lòng chọn Tỉnh / Thành phố.");
      return;
    }
    if (!selectedCommune) {
      setInputError("Vui lòng chọn Xã / Phường / Đặc khu.");
      return;
    }
    if (!streetInput.trim() || streetInput.trim().length < 3) {
      setInputError("Vui lòng nhập số nhà và tên đường hợp lệ (tối thiểu 3 ký tự).");
      return;
    }
    for (const junk of JUNK_KEYWORDS) {
      if (streetInput.trim().toLowerCase() === junk) {
        setInputError("Địa chỉ nhập vào là chuỗi không hợp lệ. Vui lòng nhập số nhà / tên đường thật.");
        return;
      }
    }

    // Build standard formatted address according to Clause 28:
    // [Số nhà / Đường], [Phường/Xã/Đặc khu], [Tỉnh/Thành phố]
    const fullAddr = `${streetInput.trim()}, ${selectedCommune.fullName}, ${selectedProvince.fullName}`;

    const newStructuredAddr: StructuredAddress = {
      provinceCode: selectedProvince.code,
      provinceName: selectedProvince.fullName,
      communeCode: selectedCommune.code,
      communeName: selectedCommune.fullName,
      communeType: selectedCommune.type,
      streetAddress: streetInput.trim(),
      fullAddress: fullAddr,
      lat: currentLat,
      lng: currentLng,
      isVerified: true,
      placeId: `geo_${selectedProvince.code}_${selectedCommune.code}`,
      districtName: selectedCommune.legacyDistrictName || undefined,
      wardCode: selectedCommune.code,
      wardName: selectedCommune.fullName,
    };

    setVerifiedAddress(newStructuredAddr);
    if (setShippingAddress) {
      setShippingAddress(fullAddr);
    }
    setIsAddressVerified(true);
    setInputError(null);

    // Call nearest warehouse calculation
    fetchNearestWarehouse(currentLat, currentLng, selectedProvince.code);
  };

  // Handle "Thay đổi địa chỉ" from State B
  const handleEditAddress = () => {
    setIsAddressVerified(false);
  };

  // Fetch nearest warehouse
  const fetchNearestWarehouse = async (lat: number, lng: number, pCode: string) => {
    try {
      const res = await fetch("/api/v1/addresses/nearest-warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          province_code: pCode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.nearest_warehouse && setNearestWarehouse) {
          setNearestWarehouse(data.nearest_warehouse);
        }
      }
    } catch {
      // Non-fatal
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Thông tin nhận hàng
            </h3>
            <p className="text-[11.5px] text-slate-500">
              {fulfillmentType === "DELIVERY"
                ? "Mô hình 2 cấp: Tỉnh/Thành phố → Xã/Phường/Đặc khu → Xác thực bản đồ"
                : "Nhận thuốc trực tiếp tại chi nhánh H4CARE"}
            </p>
          </div>
        </div>

        {fulfillmentType === "DELIVERY" && isAddressVerified && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã xác thực vị trí
          </span>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Recipient Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Họ và tên người nhận <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all text-slate-800 placeholder:text-slate-400"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Số điện thoại nhận hàng <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ví dụ: 0912 345 678"
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all text-slate-800 placeholder:text-slate-400"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email nhận thông báo đơn hàng{" "}
            <span className="text-slate-400 font-normal">(Không bắt buộc)</span>
          </label>
          <div className="relative">
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="ví dụ: email@gmail.com để nhận hóa đơn"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all text-slate-800 placeholder:text-slate-400"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* DELIVERY FLOW */}
        {fulfillmentType === "DELIVERY" && (
          <div className="pt-2 border-t border-slate-100">
            {/* STATE B: VERIFIED SUMMARY CARD */}
            {isAddressVerified && verifiedAddress ? (
              <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/30 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                          Địa chỉ giao hàng đã xác thực
                        </span>
                        {verifiedAddress.communeType === "special_zone" && (
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            Đặc khu kinh tế
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {verifiedAddress.fullAddress}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Tọa độ GPS: ({verifiedAddress.lat.toFixed(4)}, {verifiedAddress.lng.toFixed(4)})</span>
                        {verifiedAddress.districtName && (
                          <span className="text-slate-400 text-[11px]">
                            • Khu vực: {verifiedAddress.districtName}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleEditAddress}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:border-brand-blue-500 text-xs font-semibold text-slate-700 hover:text-brand-blue-600 bg-white transition-colors shadow-2xs shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Thay đổi
                  </button>
                </div>

                {/* Nearest warehouse banner */}
                {nearestWarehouse && (
                  <div className="pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800 flex-wrap gap-2">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Điều phối từ: <strong>{nearestWarehouse.warehouse_name}</strong> (cách {nearestWarehouse.distance_km} km)
                    </span>
                    <span className="text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      {nearestWarehouse.estimated_delivery_time}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* STATE A: 2-TIER CASCADING ADDRESS SELECTION FORM */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-blue-600" />
                    Địa chỉ giao hàng (Hành chính 2 cấp 2025)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    34 Tỉnh/Thành • 3.321 Xã/Phường/Đặc khu
                  </span>
                </div>

                {/* Row 1: 2-TIER ADMINISTRATIVE UNITS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* CẤP 1: TỈNH / THÀNH PHỐ (34 đơn vị hiện hành) */}
                  <div className="relative" ref={provinceRef}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tỉnh / Thành phố <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsProvinceOpen(!isProvinceOpen)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-left text-sm flex items-center justify-between hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-blue-500/20"
                    >
                      <span className={selectedProvince ? "text-slate-900 font-medium" : "text-slate-400"}>
                        {selectedProvince ? selectedProvince.fullName : "Chọn Tỉnh / Thành phố (34 đơn vị)"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {isProvinceOpen && (
                      <div className="absolute z-40 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-64 flex flex-col">
                        <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                          <input
                            type="text"
                            value={provinceSearch}
                            onChange={(e) => setProvinceSearch(e.target.value)}
                            placeholder="Tìm nhanh: Hà Nội, TP.HCM, Đà Nẵng..."
                            className="w-full bg-transparent text-xs text-slate-800 outline-hidden placeholder:text-slate-400"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto divide-y divide-slate-50">
                          {filteredProvinces.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              Không tìm thấy tỉnh/thành phù hợp
                            </div>
                          ) : (
                            filteredProvinces.map((p) => {
                              const isSelected = selectedProvince?.code === p.code;
                              return (
                                <button
                                  key={p.code}
                                  type="button"
                                  onClick={() => handleSelectProvince(p)}
                                  className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-brand-blue-50 transition-colors ${
                                    isSelected ? "bg-brand-blue-50/70 text-brand-blue-700 font-semibold" : "text-slate-700"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{p.fullName}</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                                        p.type === "municipality"
                                          ? "bg-brand-blue-100 text-brand-blue-800"
                                          : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {p.type === "municipality" ? "Thành phố TW" : "Tỉnh"}
                                    </span>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-blue-600 shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CẤP 2: XÃ / PHƯỜNG / ĐẶC KHU */}
                  <div className="relative" ref={communeRef}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>
                        Xã / Phường / Đặc khu <span className="text-rose-500">*</span>
                      </span>
                      {selectedProvince && (
                        <span className="text-[11px] text-brand-blue-600 font-normal">
                          {filteredCommunes.length} đơn vị
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      disabled={!selectedProvince}
                      onClick={() => setIsCommuneOpen(!isCommuneOpen)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-left text-sm flex items-center justify-between transition-colors ${
                        !selectedProvince
                          ? "bg-slate-100/80 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-brand-blue-500/20"
                      }`}
                    >
                      <span className={selectedCommune ? "text-slate-900 font-medium" : "text-slate-400"}>
                        {selectedCommune
                          ? selectedCommune.fullName
                          : selectedProvince
                          ? "Chọn Xã, Phường hoặc Đặc khu"
                          : "Vui lòng chọn Tỉnh/Thành trước"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {isCommuneOpen && selectedProvince && (
                      <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-64 flex flex-col">
                        <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                          <input
                            type="text"
                            value={communeSearch}
                            onChange={(e) => setCommuneSearch(e.target.value)}
                            placeholder="Tìm kiếm theo tên hoặc quận cũ (Ba Đình, Cầu Giấy, Bình Thạnh...)"
                            className="w-full bg-transparent text-xs text-slate-800 outline-hidden placeholder:text-slate-400"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto divide-y divide-slate-50">
                          {filteredCommunes.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              Không tìm thấy đơn vị phù hợp
                            </div>
                          ) : (
                            filteredCommunes.map((c) => {
                              const isSelected = selectedCommune?.code === c.code;
                              return (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => handleSelectCommune(c)}
                                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-brand-blue-50 transition-colors ${
                                    isSelected ? "bg-brand-blue-50/70 text-brand-blue-700 font-semibold" : "text-slate-700"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{c.fullName}</span>
                                      {c.type === "special_zone" && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded-sm font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                                          Đặc khu
                                        </span>
                                      )}
                                    </div>
                                    {c.legacyDistrictName && (
                                      <span className="text-[10.5px] text-slate-400 block">
                                        (Thuộc {c.legacyDistrictName})
                                      </span>
                                    )}
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-blue-600 shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: STREET / HOUSE NUMBER WITH BOUNDED AUTOCOMPLETE */}
                <div className="relative" ref={streetRef}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>
                      Số nhà, tên đường, tòa nhà <span className="text-rose-500">*</span>
                    </span>
                    {isLoadingSuggestions && (
                      <span className="text-[11px] text-brand-blue-600 flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-brand-blue-600 border-t-transparent animate-spin" />
                        Đang tìm địa chỉ...
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={!selectedCommune}
                      value={streetInput}
                      onChange={(e) => {
                        setStreetInput(e.target.value);
                        setIsAddressVerified(false);
                      }}
                      onFocus={() => {
                        if (suggestions.length > 0) setIsSuggestionsOpen(true);
                      }}
                      placeholder={
                        selectedCommune
                          ? "Ví dụ: 45 Hoàng Hoa Thám hoặc Chung cư Hưng Phúc..."
                          : "Vui lòng chọn Tỉnh/Thành và Xã/Phường trước"
                      }
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm transition-all text-slate-800 placeholder:text-slate-400 ${
                        !selectedCommune
                          ? "bg-slate-100/80 border-slate-200 cursor-not-allowed"
                          : "bg-white border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600"
                      }`}
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {isSuggestionsOpen && suggestions.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {suggestions.map((item, idx) => (
                        <button
                          key={item.place_id || idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-brand-blue-50 flex items-start gap-2.5 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-brand-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {item.street_address}
                            </span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {item.display_name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {inputError && (
                    <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {inputError}
                    </p>
                  )}
                </div>

                {/* Row 3: INTERACTIVE LEAFLET MAP WITH DRAGGABLE PIN */}
                {selectedProvince && selectedCommune && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-brand-blue-600" />
                        Vị trí ghim trên bản đồ (Kéo ghim để chỉnh chính xác)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        GPS: ({currentLat.toFixed(4)}, {currentLng.toFixed(4)})
                      </span>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                      <DeliveryRealMap
                        customerCoords={{ lat: currentLat, lng: currentLng }}
                        nearestWarehouse={
                          nearestWarehouse
                            ? {
                                warehouse_name: nearestWarehouse.warehouse_name,
                                warehouse_code: nearestWarehouse.warehouse_code,
                                warehouse_address: nearestWarehouse.warehouse_address,
                                lat: nearestWarehouse.lat,
                                lng: nearestWarehouse.lng,
                                distance_km: nearestWarehouse.distance_km,
                                estimated_delivery_time: nearestWarehouse.estimated_delivery_time,
                              }
                            : null
                        }
                        onLocationSelect={handleMapLocationChange}
                      />
                    </div>
                  </div>
                )}

                {/* Row 4: CONFIRM BUTTON */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-[11.5px] text-slate-500 text-center sm:text-left">
                    Sau khi kiểm tra đúng vị trí, hãy bấm <strong>Xác nhận địa chỉ</strong> để hoàn tất.
                  </p>

                  <button
                    type="button"
                    onClick={handleConfirmAddress}
                    disabled={!selectedProvince || !selectedCommune || !streetInput.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Xác nhận địa chỉ này
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delivery Note (Clause 30: separate from administrative address) */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Ghi chú giao hàng{" "}
            <span className="text-slate-400 font-normal">
              (Ví dụ: Nhà cổng xanh, gọi trước khi đến, giờ giao thuận tiện...)
            </span>
          </label>
          <input
            type="text"
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Ghi chú thêm cho Dược sĩ hoặc Shipper..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-blue-500/20 focus:border-brand-blue-600 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
}
