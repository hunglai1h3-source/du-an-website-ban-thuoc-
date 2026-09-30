import {
  Building2,
  CheckCircle2,
  Edit2,
  Layers,
  MapPin,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { api } from '../services/api'
import type { WarehouseItem } from '../types'

export function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWh, setEditingWh] = useState<WarehouseItem | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [province, setProvince] = useState('Thành phố Hồ Chí Minh')
  const [phone, setPhone] = useState('')
  const [isCentral, setIsCentral] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  function loadWarehouses() {
    setLoading(true)
    api<WarehouseItem[]>('/warehouses')
      .then(res => {
        setWarehouses(res)
        setError('')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadWarehouses()
  }, [])

  function openCreateModal() {
    setEditingWh(null)
    setCode('')
    setName('')
    setAddress('')
    setDistrict('')
    setProvince('Thành phố Hồ Chí Minh')
    setPhone('')
    setIsCentral(false)
    setIsActive(true)
    setFormError('')
    setModalOpen(true)
  }

  function openEditModal(wh: WarehouseItem) {
    setEditingWh(wh)
    setCode(wh.code)
    setName(wh.name)
    setAddress(wh.address)
    setDistrict(wh.district || '')
    setProvince(wh.province || 'Thành phố Hồ Chí Minh')
    setPhone(wh.phone || '')
    setIsCentral(wh.is_central)
    setIsActive(wh.is_active)
    setFormError('')
    setModalOpen(true)
  }

  async function handleSaveWarehouse(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!name.trim() || !address.trim() || (!editingWh && !code.trim())) {
      return setFormError('Vui lòng điền đầy đủ Mã kho, Tên kho và Địa chỉ chi nhánh.')
    }

    setSubmitting(true)
    try {
      if (editingWh) {
        await api(`/warehouses/${editingWh.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim(),
            district: district.trim() || undefined,
            province: province.trim() || undefined,
            phone: phone.trim() || undefined,
            is_central: isCentral,
            is_active: isActive,
          }),
        })
      } else {
        await api('/warehouses', {
          method: 'POST',
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            name: name.trim(),
            address: address.trim(),
            district: district.trim() || undefined,
            province: province.trim() || undefined,
            phone: phone.trim() || undefined,
            is_central: isCentral,
            is_active: isActive,
          }),
        })
      }
      setModalOpen(false)
      loadWarehouses()
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu thông tin kho')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="overline">MẠNG LƯỚI KHO VẬN DƯỢC GSP</span>
          <h1>Quản Lý Kho & Chi Nhánh</h1>
          <p>
            Quản lý kho trung tâm, các kho chi nhánh miền, sơ đồ phân bổ vị trí lưu trữ (Aisle/Shelf/Bin) và tồn kho thực tế.
          </p>
        </div>
        <div>
          <button className="primary-button" onClick={openCreateModal}>
            <Plus size={16} /> Thiết Lập Kho Mới
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

      {/* Warehouse Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: wh.is_central ? '#eff6ff' : '#f8fafc',
                      color: wh.is_central ? '#2563eb' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      {wh.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>
                        {wh.code}
                      </span>
                      {wh.is_central && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          Kho Tổng Trung Tâm
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  className="icon-button"
                  title="Chỉnh sửa thông tin kho"
                  onClick={() => openEditModal(wh)}
                  style={{ padding: '6px' }}
                >
                  <Edit2 size={15} />
                </button>
              </div>

              {/* Address & Contact */}
              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={14} style={{ color: '#94a3b8', flexShrink: 0, marginTop: '2px' }} />
                  <span>{wh.address}</span>
                </div>
                {wh.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                    <span>{wh.phone}</span>
                  </div>
                )}
              </div>

              {/* Inventory Statistics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Tổng tồn thực tế (On-hand)</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {wh.total_on_hand.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500 }}>đơn vị</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Tồn khả dụng bán (Available)</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>
                    {wh.total_available.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500 }}>đơn vị</span>
                  </div>
                </div>
              </div>

              {/* Storage Locations / Shelves */}
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                Vị trí lưu kho ({wh.locations.length} khu vực):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {wh.locations.map(loc => (
                  <span
                    key={loc.id}
                    title={loc.name || loc.code}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '2px 7px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#334155',
                    }}
                  >
                    {loc.code}
                  </span>
                ))}
              </div>
            </div>

            {/* Status footer */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: wh.is_active ? '#22c55e' : '#94a3b8',
                  }}
                />
                <span style={{ color: wh.is_active ? '#166534' : '#64748b', fontWeight: 600 }}>
                  {wh.is_active ? 'Đang hoạt động' : 'Tạm dừng tiếp nhận'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {warehouses.length === 0 && !loading && (
        <EmptyState title="Chưa có kho nào được thiết lập" description="Bấm nút Thiết Lập Kho Mới để tạo kho trung tâm đầu tiên." />
      )}

      {/* Modal Create / Edit */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {editingWh ? `Chỉnh Sửa Kho: ${editingWh.code}` : 'Thiết Lập Kho & Chi Nhánh Mới'}
              </h2>
              <button className="icon-button" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && <div className="alert alert-error" style={{ marginBottom: '12px' }}>{formError}</div>}

            <form onSubmit={handleSaveWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Mã kho (Code) *
                </label>
                <input
                  disabled={!!editingWh}
                  placeholder="Ví dụ: KHO-DN-01, KHO-CT-01"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Tên kho / Chi nhánh *
                </label>
                <input
                  placeholder="Ví dụ: Kho Chi Nhánh Miền Trung (Đà Nẵng)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Địa chỉ số nhà & đường *
                </label>
                <input
                  placeholder="Số nhà, tên đường, phường..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Quận / Huyện
                  </label>
                  <input
                    placeholder="Quận 1, Hoàn Kiếm..."
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Tỉnh / Thành phố
                  </label>
                  <input
                    placeholder="TP. Hồ Chí Minh, Hà Nội..."
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Điện thoại liên hệ
                </label>
                <input
                  placeholder="Số hotline hoặc bàn kho..."
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isCentral}
                    onChange={e => setIsCentral(e.target.checked)}
                  />
                  Là Kho Tổng Trung Tâm
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                  />
                  Đang hoạt động tiếp nhận
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu…' : editingWh ? 'Cập Nhật Kho' : 'Khởi Tạo Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
