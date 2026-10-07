"use client";

import React from "react";
import { X, MapPin } from "lucide-react";
import {
  customerAddressService,
  CustomerAddressItem,
} from "@/services/customerAddressService";
import AddressEditorV2 from "@/components/address/AddressEditorV2";

export interface CustomerAddressModalProps {
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
  if (!isOpen) return null;

  const handleSave = async (data: any) => {
    let savedItem: CustomerAddressItem;

    if (addressToEdit?.id) {
      savedItem = await customerAddressService.updateAddress(addressToEdit.id, {
        recipient_name: data.recipient_name,
        phone: data.phone,
        address_line: data.address_line,
        province_code: data.province_code,
        province_name: data.province_name,
        commune_code: data.commune_code,
        commune_name: data.commune_name,
        lat: data.lat,
        lng: data.lng,
        place_id: data.place_id,
        delivery_note: data.delivery_note,
        is_default: data.is_default,
      });
    } else {
      savedItem = await customerAddressService.saveAddress({
        recipient_name: data.recipient_name,
        phone: data.phone,
        address_line: data.address_line,
        province_code: data.province_code,
        province_name: data.province_name,
        commune_code: data.commune_code,
        commune_name: data.commune_name,
        lat: data.lat,
        lng: data.lng,
        place_id: data.place_id,
        delivery_note: data.delivery_note,
        is_default: data.is_default,
      });
    }

    onSaved(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-blue-50 text-brand-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {addressToEdit ? "Chỉnh sửa địa chỉ nhận hàng" : "Thêm địa chỉ nhận hàng mới"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Tìm kiếm theo tên địa điểm Google-like, định vị GPS và xác thực bản đồ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Single Source of Truth AddressEditorV2 */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <AddressEditorV2
            initialData={addressToEdit}
            prefillName={prefillName}
            prefillPhone={prefillPhone}
            showRecipientFields={true}
            submitButtonText={addressToEdit ? "Cập nhật địa chỉ" : "Lưu địa chỉ nhận hàng"}
            onSave={handleSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
