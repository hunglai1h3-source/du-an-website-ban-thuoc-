"use client";

import React from "react";
import { Truck, Store, MapPin, Clock, Phone, Check } from "lucide-react";

export type FulfillmentType = "DELIVERY" | "STORE_PICKUP";

export interface PharmacyStore {
  id: string;
  name: string;
  address: string;
  district: string;
  city: string;
  hours: string;
  phone: string;
}

export const PHARMACY_STORES: PharmacyStore[] = [
  {
    id: "h4care-tb",
    name: "Nhà thuốc H4CARE Tân Bình",
    address: "45 Hoàng Hoa Thám, Phường 13, Quận Tân Bình",
    district: "765",
    city: "79",
    hours: "07:00 - 22:00 (Cả CN & Ngày lễ)",
    phone: "028 3812 4567",
  },
  {
    id: "h4care-q1",
    name: "Nhà thuốc H4CARE Bến Thành - Quận 1",
    address: "125 Lê Lợi, Phường Bến Thành, Quận 1",
    district: "760",
    city: "79",
    hours: "06:30 - 22:30 (Cả CN & Ngày lễ)",
    phone: "028 3822 8899",
  },
  {
    id: "h4care-td",
    name: "Nhà thuốc H4CARE Linh Chiểu - Thủ Đức",
    address: "234 Võ Văn Ngân, Phường Linh Chiểu, TP. Thủ Đức",
    district: "769",
    city: "79",
    hours: "07:00 - 22:00 (Cả CN & Ngày lễ)",
    phone: "028 3720 1234",
  },
  {
    id: "h4care-cg",
    name: "Nhà thuốc H4CARE Cầu Giấy",
    address: "12 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy",
    district: "009",
    city: "01",
    hours: "07:00 - 22:00 (Cả CN & Ngày lễ)",
    phone: "024 3833 5678",
  },
  {
    id: "h4care-bd",
    name: "Nhà thuốc H4CARE Đội Cấn - Ba Đình",
    address: "68 Đội Cấn, Phường Đội Cấn, Quận Ba Đình",
    district: "001",
    city: "01",
    hours: "07:00 - 22:00 (Cả CN & Ngày lễ)",
    phone: "024 3823 9999",
  },
];

interface FulfillmentSelectorProps {
  fulfillmentType: FulfillmentType;
  onChangeFulfillmentType: (type: FulfillmentType) => void;
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
}

export default function FulfillmentSelector({
  fulfillmentType,
  onChangeFulfillmentType,
  selectedStoreId,
  onSelectStore,
}: FulfillmentSelectorProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-4 sm:p-5">
      <div className="mb-3.5">
        <h2 className="text-sm font-bold text-slate-900">
          Hình thức nhận hàng
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Chọn phương thức thuận tiện nhất cho bạn
        </p>
      </div>

      {/* Segmented Tab Selector */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => onChangeFulfillmentType("DELIVERY")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            fulfillmentType === "DELIVERY"
              ? "bg-white text-brand-blue-700 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Truck className="w-4 h-4 shrink-0 text-brand-blue-600" />
          <span>Giao hàng tận nơi</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeFulfillmentType("STORE_PICKUP")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            fulfillmentType === "STORE_PICKUP"
              ? "bg-white text-brand-blue-700 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Store className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Nhận tại nhà thuốc</span>
        </button>
      </div>

      {/* Store Pickup Selector Content */}
      {fulfillmentType === "STORE_PICKUP" && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              Chọn chi nhánh H4CARE gần bạn:
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
              Có hàng sau 30 phút • Miễn phí
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {PHARMACY_STORES.map((store) => {
              const isSelected = selectedStoreId === store.id;
              return (
                <div
                  key={store.id}
                  onClick={() => onSelectStore(store.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? "border-brand-blue-600 bg-brand-blue-50/50 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-brand-blue-600 shrink-0" />
                        <span>{store.name}</span>
                      </p>
                      <p className="text-slate-600 flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>{store.address}</span>
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {store.hours}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {store.phone}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                        isSelected
                          ? "bg-brand-blue-600 border-brand-blue-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
