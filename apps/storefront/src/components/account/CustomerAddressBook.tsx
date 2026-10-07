"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Star,
  AlertCircle,
  Phone,
  User,
  Navigation,
  Loader2,
  Compass,
} from "lucide-react";
import {
  customerAddressService,
  CustomerAddressItem,
} from "@/services/customerAddressService";
import { CustomerAddressModal } from "./CustomerAddressModal";

interface CustomerAddressBookProps {
  onAddressSelect?: (addr: CustomerAddressItem) => void;
  selectableMode?: boolean;
  selectedAddressId?: number | null;
  userName?: string;
  userPhone?: string;
}

export function CustomerAddressBook({
  onAddressSelect,
  selectableMode = false,
  selectedAddressId,
  userName = "",
  userPhone = "",
}: CustomerAddressBookProps) {
  const [addresses, setAddresses] = useState<CustomerAddressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddressItem | null>(null);

  // Custom Delete Confirm Dialog (NO window.confirm)
  const [addressToDelete, setAddressToDelete] = useState<CustomerAddressItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load addresses on mount
  const loadAddresses = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const data = await customerAddressService.listAddresses();
      setAddresses(data);
    } catch (err: any) {
      console.warn("Failed to load address book", err);
      setErrorMessage("Không thể tải danh sách địa chỉ. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: CustomerAddressItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleSetDefault = async (addr: CustomerAddressItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await customerAddressService.setDefaultAddress(addr.id);
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || "Không thể đặt làm địa chỉ mặc định.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;
    setIsDeleting(true);
    try {
      await customerAddressService.deleteAddress(addressToDelete.id);
      setAddressToDelete(null);
      await loadAddresses();
    } catch (err: any) {
      alert(err.message || "Không thể xóa địa chỉ này.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-blue-600" />
            <span>Sổ địa chỉ nhận hàng của tôi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý địa chỉ giao thuốc tận nơi & tối ưu chọn kho dược phẩm gần nhất
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 active:bg-brand-blue-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm địa chỉ mới</span>
        </button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="p-8 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-blue-600 mx-auto" />
          <p className="text-xs text-slate-500">Đang tải danh sách địa chỉ nhận hàng...</p>
        </div>
      ) : addresses.length === 0 ? (
        /* Empty State */
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Bạn chưa lưu địa chỉ giao hàng nào</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Lưu địa chỉ giúp bạn thanh toán nhanh hơn và hệ thống tự động tìm kho dược phẩm gần nhất để giao hỏa tốc 1 - 2 giờ.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm địa chỉ ngay</span>
          </button>
        </div>
      ) : (
        /* Address List Grid */
        <div className="grid grid-cols-1 gap-3">
          {addresses.map((addr) => {
            const isSelected = selectableMode && selectedAddressId === addr.id;

            return (
              <div
                key={addr.id}
                onClick={() => selectableMode && onAddressSelect && onAddressSelect(addr)}
                className={`p-4 rounded-xl border transition-all text-xs relative ${
                  isSelected
                    ? "bg-brand-blue-50/60 border-brand-blue-500 ring-2 ring-brand-blue-500/20"
                    : "bg-white hover:bg-slate-50/80 border-slate-200"
                } ${selectableMode ? "cursor-pointer" : ""}`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
                  {/* Recipient & Phone */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {addr.recipient_name}
                    </span>
                    <span className="text-slate-400">|</span>
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {addr.phone}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {addr.is_default && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Mặc định
                      </span>
                    )}
                    {addr.is_verified && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-200 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-brand-blue-600" />
                        Đã ghim GPS
                      </span>
                    )}
                  </div>
                </div>

                {/* Address Detail & Note */}
                <div className="space-y-1 mb-3">
                  <p className="text-slate-800 font-medium flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-brand-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>{addr.address_line}</strong>
                      {addr.commune_name ? `, ${addr.commune_name}` : ""}
                      {addr.province_name ? `, ${addr.province_name}` : ""}
                    </span>
                  </p>

                  {addr.delivery_note && (
                    <p className="text-[11px] text-slate-500 italic pl-5">
                      Ghi chú: &ldquo;{addr.delivery_note}&rdquo;
                    </p>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    {!addr.is_default && (
                      <button
                        type="button"
                        onClick={(e) => handleSetDefault(addr, e)}
                        className="text-slate-600 hover:text-brand-blue-600 font-semibold transition-colors flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" />
                        <span>Đặt làm mặc định</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(addr, e)}
                      className="text-brand-blue-600 hover:text-brand-blue-800 font-bold transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddressToDelete(addr);
                      }}
                      className="text-rose-600 hover:text-rose-800 font-bold transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Add Address Modal */}
      <CustomerAddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addressToEdit={editingAddress}
        onSaved={async (saved) => {
          await loadAddresses();
          if (selectableMode && onAddressSelect) {
            onAddressSelect(saved);
          }
        }}
        prefillName={userName}
        prefillPhone={userPhone}
      />

      {/* Custom Delete Confirmation Modal (NO window.confirm) */}
      {addressToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Xóa địa chỉ nhận hàng?</h3>
                <p className="text-xs text-slate-500">Thao tác này sẽ xóa địa chỉ khỏi tài khoản.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
              <p className="font-bold">{addressToDelete.recipient_name} ({addressToDelete.phone})</p>
              <p className="text-slate-600 line-clamp-2">
                {addressToDelete.address_line}, {addressToDelete.commune_name || ""}, {addressToDelete.province_name || ""}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
