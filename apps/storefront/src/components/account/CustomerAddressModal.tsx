"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  X,
  MapPin,
  Phone,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  Compass,
  Navigation,
  Loader2,
} from "lucide-react";
import {
  administrativeService,
  ProvinceUnit,
  CommuneUnit,
} from "@/services/administrativeService";
import {
  customerAddressService,
  CustomerAddressItem,
  CustomerAddressInput,
} from "@/services/customerAddressService";

const DeliveryRealMap = dynamic(
  () => import("@/components/checkout/DeliveryRealMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue-600" />
        <span className="text-xs font-medium">Đang tải bản đồ định vị H4CARE...</span>
      </div>
    ),
  }
);

interface CustomerAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: CustomerAddressItem | null;
  onSaved: (saved: CustomerAddressItem) => void;
  prefillName?: string;
  prefillPhone?: string;
}

export function CustomerAddressModal({
  isOpen,
  onClose,
  addressToEdit,
  onSaved,
  prefillName = "",
  prefillPhone = "",
}: CustomerAddressModalProps) {
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [communeCode, setCommuneCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Map & Coordinate state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);

  // Validation & Loading
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load provinces from administrative service
  const provinces = useMemo(() => administrativeService.getProvinces(), []);

  // Filter communes based on current province
  const availableCommunes = useMemo(() => {
    if (!provinceCode) return [];
    return administrativeService.getCommunes(provinceCode);
  }, [provinceCode]);

  // Populate data when opening modal or editing
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage("");
    setSearchNotice(null);

    if (addressToEdit) {
      setRecipientName(addressToEdit.recipient_name || "");
      setPhone(addressToEdit.phone || "");
      setProvinceCode(addressToEdit.province_code || "");
      setCommuneCode(addressToEdit.commune_code || addressToEdit.ward_code || "");
      setAddressLine(addressToEdit.address_line || "");
      setDeliveryNote(addressToEdit.delivery_note || "");
      setIsDefault(!!addressToEdit.is_default);
      if (addressToEdit.lat && addressToEdit.lng) {
        setCoords({ lat: addressToEdit.lat, lng: addressToEdit.lng });
        setIsLocationConfirmed(true);
      } else {
        setCoords(null);
        setIsLocationConfirmed(false);
      }
    } else {
      setRecipientName(prefillName);
      setPhone(prefillPhone);
      setProvinceCode("79"); // Mặc định TP.HCM
      setCommuneCode("");
      setAddressLine("");
      setDeliveryNote("");
      setIsDefault(false);
      setCoords(null);
      setIsLocationConfirmed(false);
    }
  }, [isOpen, addressToEdit, prefillName, prefillPhone]);

  // When changing province, reset commune and reset coordinate confirmation
  const handleProvinceChange = (newProvCode: string) => {
    setProvinceCode(newProvCode);
    setCommuneCode("");
    setIsLocationConfirmed(false);
    setSearchNotice(null);

    // If changing province, center map approximately to the province
    const provObj = administrativeService.getProvinceByCode(newProvCode);
    if (provObj?.boundingBox) {
      const midLat = (provObj.boundingBox.minLat + provObj.boundingBox.maxLat) / 2;
      const midLng = (provObj.boundingBox.minLng + provObj.boundingBox.maxLng) / 2;
      setCoords({ lat: Number(midLat.toFixed(4)), lng: Number(midLng.toFixed(4)) });
    }
  };

  const handleCommuneChange = (newCommCode: string) => {
    setCommuneCode(newCommCode);
    setIsLocationConfirmed(false);
    setSearchNotice(null);
  };

  // Find location on map using Nominatim or centroid fallback
  const handleSearchLocation = async () => {
    setErrorMessage("");
    setSearchNotice(null);

    if (!provinceCode) {
      setErrorMessage("Vui lòng chọn Tỉnh / Thành phố.");
      return;
    }

    const provObj = administrativeService.getProvinceByCode(provinceCode);
    const commObj = communeCode ? administrativeService.getCommuneByCode(communeCode) : null;

    setIsSearchingLocation(true);
    try {
      const queryParts = [addressLine.trim(), commObj?.fullName, provObj?.fullName, "Vietnam"].filter(Boolean);
      const query = queryParts.join(", ");

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=vn`,
        { headers: { "Accept-Language": "vi" } }
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const foundLat = parseFloat(data[0].lat);
          const foundLng = parseFloat(data[0].lon);

          // Validate within province bounding box
          if (provObj?.boundingBox) {
            const { minLat, maxLat, minLng, maxLng } = provObj.boundingBox;
            if (foundLat >= minLat && foundLat <= maxLat && foundLng >= minLng && foundLng <= maxLng) {
              setCoords({ lat: foundLat, lng: foundLng });
              setSearchNotice("Đã tìm thấy vị trí gần đúng. Hãy kéo ghim đến số nhà chính xác rồi bấm 'Xác nhận vị trí'.");
              setIsSearchingLocation(false);
              return;
            }
          }
        }
      }

      // Fallback centroid if geocoder returned no precise street result
      if (provObj?.boundingBox) {
        const midLat = (provObj.boundingBox.minLat + provObj.boundingBox.maxLat) / 2;
        const midLng = (provObj.boundingBox.minLng + provObj.boundingBox.maxLng) / 2;
        setCoords({ lat: Number(midLat.toFixed(4)), lng: Number(midLng.toFixed(4)) });
        setSearchNotice("Đã định vị tâm khu vực. Vui lòng kéo ghim hoặc click trên bản đồ để chọn đúng số nhà của bạn.");
      }
    } catch (err) {
      console.warn("Geocoding lookup error", err);
      if (provObj?.boundingBox) {
        const midLat = (provObj.boundingBox.minLat + provObj.boundingBox.maxLat) / 2;
        const midLng = (provObj.boundingBox.minLng + provObj.boundingBox.maxLng) / 2;
        setCoords({ lat: Number(midLat.toFixed(4)), lng: Number(midLng.toFixed(4)) });
      }
      setSearchNotice("Không thể kết nối dịch vụ định vị ngoài. Vui lòng kéo ghim tới vị trí giao hàng trên bản đồ.");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Validate Vietnamese mobile phone number
  const validatePhone = (val: string): boolean => {
    const clean = val.replace(/\D/g, "");
    return clean.length >= 10 && clean.length <= 11 && /^(03|05|07|08|09)/.test(clean);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!recipientName.trim() || recipientName.trim().length < 2) {
      setErrorMessage("Vui lòng nhập họ và tên người nhận (tối thiểu 2 ký tự).");
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s\-\.]/g, "");
    if (!validatePhone(cleanPhone)) {
      setErrorMessage("Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số, ví dụ 0901234567, 0388889999).");
      return;
    }

    if (!provinceCode) {
      setErrorMessage("Vui lòng chọn Tỉnh / Thành phố nhận thuốc.");
      return;
    }

    if (!communeCode) {
      setErrorMessage("Vui lòng chọn Phường / Xã / Thị trấn nhận thuốc.");
      return;
    }

    if (!addressLine.trim() || addressLine.trim().length < 3) {
      setErrorMessage("Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường, thôn/xóm - tối thiểu 3 ký tự).");
      return;
    }

    if (!coords || !isLocationConfirmed) {
      setErrorMessage("Vui lòng bấm 'Tìm vị trí' và kiểm tra ghim bản đồ rồi bấm 'Xác nhận vị trí này' trước khi lưu.");
      return;
    }

    const provObj = administrativeService.getProvinceByCode(provinceCode);
    const commObj = administrativeService.getCommuneByCode(communeCode);

    setIsSubmitting(true);
    try {
      const payload: CustomerAddressInput = {
        recipient_name: recipientName.trim(),
        phone: cleanPhone,
        address_line: addressLine.trim(),
        province_code: provinceCode,
        province_name: provObj?.fullName,
        commune_code: communeCode,
        commune_name: commObj?.fullName,
        district_code: commObj?.legacyDistrictName,
        ward_code: communeCode,
        lat: coords.lat,
        lng: coords.lng,
        delivery_note: deliveryNote.trim() || undefined,
        is_default: isDefault,
      };

      let result: CustomerAddressItem;
      if (addressToEdit?.id) {
        result = await customerAddressService.updateAddress(addressToEdit.id, payload);
      } else {
        result = await customerAddressService.createAddress(payload);
      }

      onSaved(result);
      onClose();
    } catch (err: any) {
      console.error("Save address error:", err);
      setErrorMessage(err.message || "Không thể lưu địa chỉ. Vui lòng kiểm tra lại kết nối mạng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-blue-50 text-brand-blue-600 border border-brand-blue-100 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {addressToEdit ? "Chỉnh sửa địa chỉ giao hàng" : "Thêm địa chỉ giao hàng mới"}
              </h3>
              <p className="text-xs text-slate-500">Chuẩn địa giới hành chính & bản đồ định vị dược phẩm</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Recipient Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Họ và tên người nhận <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  required
                  className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 font-medium text-slate-900 bg-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0912345678"
                  required
                  className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 font-medium text-slate-900 bg-white"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Row 2: Dependent Dropdowns (Province -> Commune) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tỉnh / Thành phố <span className="text-rose-500">*</span>
              </label>
              <select
                value={provinceCode}
                onChange={(e) => handleProvinceChange(e.target.value)}
                required
                className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 font-medium text-slate-900 bg-white"
              >
                <option value="">-- Chọn Tỉnh / Thành phố --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phường / Xã / Thị trấn <span className="text-rose-500">*</span>
              </label>
              <select
                value={communeCode}
                onChange={(e) => handleCommuneChange(e.target.value)}
                disabled={!provinceCode}
                required
                className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 font-medium text-slate-900 bg-white disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {provinceCode ? "-- Chọn Phường / Xã --" : "Vui lòng chọn Tỉnh trước"}
                </option>
                {availableCommunes.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.fullName} {c.legacyDistrictName ? `(${c.legacyDistrictName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Street Address & Search Button */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Địa chỉ chi tiết (Số nhà, tên đường, thôn/xóm) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={addressLine}
                onChange={(e) => {
                  setAddressLine(e.target.value);
                  setIsLocationConfirmed(false);
                }}
                placeholder="Số nhà, ngõ ngách, tên đường..."
                required
                className="flex-1 h-10 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 font-medium text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={handleSearchLocation}
                disabled={isSearchingLocation || !addressLine.trim() || !provinceCode}
                className="px-3.5 h-10 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                {isSearchingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Tìm vị trí</span>
              </button>
            </div>
            {searchNotice && (
              <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{searchNotice}</span>
              </p>
            )}
          </div>

          {/* Row 4: Map Confirmation Stage */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-brand-blue-600" />
                <span>Bản đồ định vị giao thuốc thực tế</span>
              </span>
              {coords && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              )}
            </div>

            <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-200">
              <DeliveryRealMap
                customerCoords={coords}
                nearestWarehouse={null}
                onLocationSelect={(newLat, newLng) => {
                  setCoords({ lat: Number(newLat.toFixed(6)), lng: Number(newLng.toFixed(6)) });
                  setIsLocationConfirmed(false);
                }}
              />
            </div>

            {/* Location Confirmation Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                {isLocationConfirmed ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Vị trí giao hàng đã được xác nhận
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Kéo ghim hoặc click trên bản đồ để chọn số nhà, sau đó bấm xác nhận:
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (coords) {
                    setIsLocationConfirmed(true);
                    setSearchNotice(null);
                  } else {
                    setErrorMessage("Vui lòng chọn hoặc tìm vị trí trên bản đồ trước khi xác nhận.");
                  }
                }}
                disabled={!coords}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isLocationConfirmed
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                }`}
              >
                {isLocationConfirmed ? "✓ Đã xác nhận vị trí" : "Xác nhận vị trí này"}
              </button>
            </div>
          </div>

          {/* Row 5: Delivery Note */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ghi chú giao hàng <span className="text-slate-400 font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="text"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Ví dụ: Nhà cổng xanh, gọi trước khi giao, ngõ nhỏ ô tô không vào được..."
              className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 font-medium text-slate-900 bg-white"
            />
          </div>

          {/* Row 6: Default Address Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
              />
              <span className="font-semibold text-slate-800 text-xs">
                Đặt làm địa chỉ nhận hàng mặc định cho tài khoản này
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800 disabled:bg-slate-300 text-white font-bold transition-colors shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{addressToEdit ? "Lưu thay đổi" : "Lưu địa chỉ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
