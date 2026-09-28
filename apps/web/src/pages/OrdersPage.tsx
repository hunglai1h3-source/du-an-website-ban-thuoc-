import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

interface OrderSummary {
  id: number
  order_code: string
  customer_name: string
  customer_phone: string
  shipping_address: string
  payment_method: string
  payment_status: string
  order_status: string
  total_amount: number
  items_count: number
  created_at: string | null
}

interface OrderDetailItem {
  id: number
  product_id: number | null
  product_name: string
  product_sku: string | null
  price: number
  quantity: number
  subtotal: number
}

interface OrderDetailData {
  id: number
  order_code: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  shipping_address: string
  shipping_city: string | null
  payment_method: string
  payment_status: string
  order_status: string
  total_amount: number
  note: string | null
  created_at: string | null
  items: OrderDetailItem[]
}

const STATUS_LABELS: { [key: string]: { label: string; color: string; bg: string } } = {
  PENDING: { label: 'Chờ xác nhận', color: '#b45309', bg: '#fef3c7' },
  CONFIRMED: { label: 'Đã xác nhận', color: '#1d4ed8', bg: '#dbeafe' },
  PROCESSING: { label: 'Đang đóng gói', color: '#4338ca', bg: '#e0e7ff' },
  SHIPPING: { label: 'Đang giao hàng', color: '#0369a1', bg: '#e0f2fe' },
  COMPLETED: { label: 'Đã hoàn thành', color: '#15803d', bg: '#dcfce7' },
  CANCELLED: { label: 'Đã hủy', color: '#b91c1c', bg: '#fee2e2' },
}

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    loadOrders()
  }, [selectedStatus])

  async function loadOrders() {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (selectedStatus !== 'ALL') q.set('status', selectedStatus)
      if (searchQuery.trim()) q.set('search', searchQuery.trim())

      const res = await api<{ items: OrderSummary[] }>(`/admin/orders?${q.toString()}`)
      setOrders(res.items || [])
    } catch (err: any) {
      console.error('Không tải được danh sách đơn hàng:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    loadOrders()
  }

  async function openOrderDetail(orderId: number) {
    setLoadingDetail(true)
    try {
      const res = await api<OrderDetailData>(`/admin/orders/${orderId}`)
      setSelectedOrder(res)
    } catch (err: any) {
      alert('Không tải được chi tiết đơn hàng: ' + (err?.message || 'Lỗi mạng'))
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleUpdateStatus(orderId: number, newStatus: string) {
    setUpdatingId(orderId)
    setNotification(null)
    try {
      await api(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ order_status: newStatus }),
      })
      setNotification({ type: 'success', message: `Đã cập nhật trạng thái đơn sang "${STATUS_LABELS[newStatus]?.label || newStatus}"!` })
      await loadOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: newStatus })
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể cập nhật trạng thái đơn hàng.' })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="page orders-page">
      <div className="page-heading">
        <div>
          <span className="overline">BÁN HÀNG TRỰC TUYẾN</span>
          <h1>Quản Lý Đơn Hàng</h1>
          <p>
            Theo dõi, xác nhận và cập nhật tiến độ giao hàng cho các đơn thuốc được khách đặt từ website.
          </p>
        </div>
        <div className="heading-actions">
          <button type="button" onClick={loadOrders} disabled={loading} className="secondary-button">
            <RefreshCw size={15} className={loading ? 'spinner' : ''} /> Làm mới
          </button>
        </div>
      </div>

      {notification && (
        <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div style={{ flex: 1 }}>{notification.message}</div>
          <button type="button" onClick={() => setNotification(null)} className="btn-close-icon">
            <X size={16} />
          </button>
        </div>
      )}

      {/* THANH LỌC VÀ TÌM KIẾM */}
      <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          {/* Bộ lọc trạng thái */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`secondary-button ${selectedStatus === st ? 'active' : ''}`}
                onClick={() => setSelectedStatus(st)}
                style={{
                  fontSize: 12,
                  padding: '6px 12px',
                  background: selectedStatus === st ? '#2563eb' : undefined,
                  color: selectedStatus === st ? '#fff' : undefined,
                  borderColor: selectedStatus === st ? '#2563eb' : undefined,
                }}
              >
                {st === 'ALL' ? 'Tất cả trạng thái' : STATUS_LABELS[st]?.label || st}
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn, tên, SĐT..."
              style={{ padding: '6px 12px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, minWidth: 240 }}
            />
            <button type="submit" className="primary-button" style={{ padding: '6px 14px', fontSize: 13 }}>
              <Search size={14} /> Tìm
            </button>
          </form>
        </div>
      </div>

      {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="spinner" style={{ margin: '0 auto 8px' }} />
            Đang tải danh sách đơn hàng...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: '#64748b' }}>
            <ShoppingBag size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ margin: 0, fontSize: 16, color: '#334155' }}>Chưa có đơn hàng nào</h4>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>
              Đơn hàng khách đặt từ Web Bán Hàng sẽ hiển thị tập trung tại đây.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px' }}>Mã Đơn Hàng</th>
                  <th style={{ padding: '12px 16px' }}>Khách Hàng</th>
                  <th style={{ padding: '12px 16px' }}>Địa Chỉ Giao Hàng</th>
                  <th style={{ padding: '12px 16px' }}>Tổng Tiền</th>
                  <th style={{ padding: '12px 16px' }}>Thanh Toán</th>
                  <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const badge = STATUS_LABELS[o.order_status] || { label: o.order_status, color: '#475569', bg: '#f1f5f9' }
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e40af' }}>
                        {o.order_code}
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>
                          {o.created_at ? new Date(o.created_at).toLocaleString('vi-VN') : ''}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{o.customer_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>📞 {o.customer_phone}</div>
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: 220, color: '#475569' }}>
                        <span className="line-clamp-2" title={o.shipping_address}>
                          {o.shipping_address}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#047857' }}>
                        {o.total_amount.toLocaleString('vi-VN')} đ
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>
                          {o.items_count} sản phẩm
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>
                          {o.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 12,
                            color: badge.color,
                            background: badge.bg,
                            display: 'inline-block',
                          }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openOrderDetail(o.id)}
                            className="secondary-button"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            title="Xem chi tiết đơn hàng"
                          >
                            <Eye size={13} /> Chi tiết
                          </button>

                          {o.order_status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o.id, 'CONFIRMED')}
                              disabled={updatingId === o.id}
                              className="primary-button"
                              style={{ padding: '4px 10px', fontSize: 12, background: '#16a34a', borderColor: '#16a34a' }}
                            >
                              Duyệt đơn
                            </button>
                          )}

                          {o.order_status === 'CONFIRMED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o.id, 'SHIPPING')}
                              disabled={updatingId === o.id}
                              className="secondary-button"
                              style={{ padding: '4px 10px', fontSize: 12, color: '#0284c7', borderColor: '#bae6fd' }}
                            >
                              <Truck size={13} /> Giao hàng
                            </button>
                          )}

                          {o.order_status === 'SHIPPING' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o.id, 'COMPLETED')}
                              disabled={updatingId === o.id}
                              className="primary-button"
                              style={{ padding: '4px 10px', fontSize: 12, background: '#15803d' }}
                            >
                              Hoàn tất
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-window"
            style={{
              maxWidth: 680,
              width: '100%',
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: 16,
              padding: 26,
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Chi tiết đơn hàng dược phẩm</span>
                <h3 style={{ margin: '4px 0 0', fontSize: 20, color: '#1e40af', fontWeight: 800 }}>{selectedOrder.order_code}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Đóng modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Thông tin người nhận */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 16, borderRadius: 12, marginBottom: 18, fontSize: 13, color: '#1e293b' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Khách hàng:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{selectedOrder.customer_name}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Số điện thoại:</span>
                  <div style={{ fontWeight: 700, color: '#0284c7', fontSize: 14, fontFamily: 'monospace' }}>📞 {selectedOrder.customer_phone}</div>
                </div>
              </div>

              {selectedOrder.customer_email && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Email:</span>
                  <div style={{ color: '#334155' }}>{selectedOrder.customer_email}</div>
                </div>
              )}

              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>Địa chỉ nhận hàng:</span>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.shipping_address} ({selectedOrder.shipping_city || 'Toàn quốc'})</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Phương thức thanh toán: </span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.payment_method === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản'}</span>
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      background: STATUS_LABELS[selectedOrder.order_status]?.bg || '#f1f5f9',
                      color: STATUS_LABELS[selectedOrder.order_status]?.color || '#334155',
                    }}
                  >
                    {STATUS_LABELS[selectedOrder.order_status]?.label || selectedOrder.order_status}
                  </span>
                </div>
              </div>

              {selectedOrder.note && (
                <div style={{ marginTop: 8, padding: 8, background: '#fffbeb', borderRadius: 6, border: '1px solid #fef3c7', fontSize: 12, color: '#92400e' }}>
                  <strong>Lưu ý từ khách:</strong> "{selectedOrder.note}"
                </div>
              )}
            </div>

            {/* Danh sách sản phẩm thuốc */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Danh mục thuốc đặt mua ({selectedOrder.items.length})</h4>
              <span style={{ fontSize: 11, color: '#64748b' }}>Định hướng chuẩn GPP</span>
            </div>
            
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 18, background: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#ffffff' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: 11 }}>
                    <th style={{ padding: '8px 14px' }}>TÊN THUỐC</th>
                    <th style={{ padding: '8px 14px', textAlign: 'center' }}>SỐ LƯỢNG</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right' }}>THÀNH TIỀN</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((it, idx) => (
                    <tr key={it.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{it.product_name}</div>
                        {it.product_sku && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>SĐK: {it.product_sku}</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                        x{it.quantity}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                        {it.subtotal.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tổng cộng & Thao tác chuyển trạng thái */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Tổng tiền thanh toán đơn:</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#15803d' }}>
                {selectedOrder.total_amount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Đóng
              </button>

              {selectedOrder.order_status !== 'COMPLETED' && selectedOrder.order_status !== 'CANCELLED' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}
                    disabled={updatingId === selectedOrder.id}
                    style={{ padding: '8px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
                  >
                    Xác nhận đơn
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPING')}
                    disabled={updatingId === selectedOrder.id}
                    style={{ padding: '8px 16px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)' }}
                  >
                    Đang giao hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                    disabled={updatingId === selectedOrder.id}
                    style={{ padding: '8px 16px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.2)' }}
                  >
                    Đã hoàn thành
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                    disabled={updatingId === selectedOrder.id}
                    style={{ padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Hủy đơn
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
