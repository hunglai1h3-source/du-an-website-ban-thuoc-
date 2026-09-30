import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { api } from '../services/api'

interface ReviewItem {
  id: number
  canonical_product_id: number
  product_name: string
  customer_name: string
  rating: number
  comment: string
  is_verified_purchase: boolean
  is_approved: boolean
  order_code?: string | null
  created_at: string
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'HIDDEN'>('ALL')
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  async function loadReviews() {
    setLoading(true)
    try {
      let url = '/admin/reviews?limit=100'
      if (statusFilter === 'APPROVED') url += '&is_approved=true'
      if (statusFilter === 'HIDDEN') url += '&is_approved=false'
      if (verifiedFilter !== null) url += `&verified_only=${verifiedFilter}`

      const data = await api<ReviewItem[]>(url)
      setReviews(data || [])
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Không thể tải danh sách đánh giá',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [statusFilter, verifiedFilter])

  async function handleToggleStatus(rev: ReviewItem) {
    setActionLoadingId(rev.id)
    try {
      await api(`/admin/reviews/${rev.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_approved: !rev.is_approved }),
      })
      setNotification({
        type: 'success',
        message: !rev.is_approved
          ? `Đã duyệt hiển thị đánh giá #${rev.id}`
          : `Đã ẩn đánh giá #${rev.id} khỏi cửa hàng`,
      })
      await loadReviews()
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Lỗi khi cập nhật trạng thái đánh giá',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDeleteReview(rev: ReviewItem) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá #${rev.id} của khách "${rev.customer_name}"?`)) {
      return
    }

    setActionLoadingId(rev.id)
    try {
      await api(`/admin/reviews/${rev.id}`, { method: 'DELETE' })
      setNotification({
        type: 'success',
        message: `Đã xóa vĩnh viễn đánh giá #${rev.id}`,
      })
      await loadReviews()
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Lỗi khi xóa đánh giá',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Filtered by local search query
  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      r.customer_name.toLowerCase().includes(q) ||
      r.product_name.toLowerCase().includes(q) ||
      (r.order_code && r.order_code.toLowerCase().includes(q)) ||
      r.comment.toLowerCase().includes(q)
    )
  })

  // Metrics
  const totalCount = reviews.length
  const approvedCount = reviews.filter((r) => r.is_approved).length
  const hiddenCount = reviews.filter((r) => !r.is_approved).length
  const verifiedCount = reviews.filter((r) => r.is_verified_purchase).length

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">Hồ sơ & Bán hàng / Đánh giá sản phẩm</div>
          <h1 className="page-title">Quản Lý Đánh Giá & Nhận Xét</h1>
          <p className="page-subtitle">
            Kiểm duyệt nội dung phản hồi khách hàng, xác thực đơn mua hàng chính hãng và nâng cao chất lượng dịch vụ GPP.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="button button-secondary"
            onClick={loadReviews}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`banner banner-${notification.type}`} style={{ marginBottom: '1.25rem' }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
          <button
            className="icon-button"
            onClick={() => setNotification(null)}
            style={{ marginLeft: 'auto' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Tổng số nhận xét</div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-help">Tất cả sản phẩm trên toàn sàn</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đang hiển thị Storefront</div>
          <div className="stat-value text-emerald-600">{approvedCount}</div>
          <div className="stat-help">Đã kiểm duyệt đạt chuẩn</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Đã ẩn / Chưa duyệt</div>
          <div className="stat-value text-amber-600">{hiddenCount}</div>
          <div className="stat-help">Cần xem xét nội dung</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Xác thực hóa đơn mua</div>
          <div className="stat-value text-blue-600">{verifiedCount}</div>
          <div className="stat-help">Có mã đơn hàng hợp lệ</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="toolbar" style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="filter-group">
            <span className="filter-label">Trạng thái:</span>
            <div className="segmented-control">
              <button
                className={`segment-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                Tất cả ({totalCount})
              </button>
              <button
                className={`segment-btn ${statusFilter === 'APPROVED' ? 'active' : ''}`}
                onClick={() => setStatusFilter('APPROVED')}
              >
                Đã duyệt
              </button>
              <button
                className={`segment-btn ${statusFilter === 'HIDDEN' ? 'active' : ''}`}
                onClick={() => setStatusFilter('HIDDEN')}
              >
                Đã ẩn ({hiddenCount})
              </button>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Xác thực mua hàng:</span>
            <div className="segmented-control">
              <button
                className={`segment-btn ${verifiedFilter === null ? 'active' : ''}`}
                onClick={() => setVerifiedFilter(null)}
              >
                Tất cả
              </button>
              <button
                className={`segment-btn ${verifiedFilter === true ? 'active' : ''}`}
                onClick={() => setVerifiedFilter(true)}
              >
                Đã mua thật
              </button>
            </div>
          </div>
        </div>

        <div className="search-box" style={{ maxWidth: '320px', width: '100%' }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo thuốc, người gửi, mã đơn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="card">
        {loading ? (
          <div className="card-loading">Đang tải dữ liệu đánh giá…</div>
        ) : filteredReviews.length === 0 ? (
          <EmptyState
            title="Không có đánh giá nào phù hợp"
            description="Hãy thử đổi bộ lọc trạng thái hoặc tìm kiếm từ khóa khác."
          />
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>ID</th>
                  <th style={{ width: '220px' }}>Sản phẩm</th>
                  <th style={{ width: '180px' }}>Khách hàng</th>
                  <th style={{ width: '120px' }}>Điểm sao</th>
                  <th>Nội dung nhận xét</th>
                  <th style={{ width: '120px' }}>Trạng thái</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((rev) => (
                  <tr key={rev.id}>
                    <td>
                      <span className="font-mono text-muted">#{rev.id}</span>
                      <div className="text-xs text-muted mt-0.5">{rev.created_at}</div>
                    </td>
                    <td>
                      <strong className="d-block text-truncate" style={{ maxWidth: '200px' }}>
                        {rev.product_name}
                      </strong>
                      <span className="text-xs text-muted">Mã SP: #{rev.canonical_product_id}</span>
                    </td>
                    <td>
                      <div className="font-bold">{rev.customer_name}</div>
                      {rev.is_verified_purchase ? (
                        <span className="tag tag-success text-xs mt-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} />
                          Đã mua đơn #{rev.order_code || 'GPP'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Khách vãng lai</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span className="font-bold">{rev.rating}</span>
                        <Star size={14} className="fill-amber-400 text-amber-500" />
                      </div>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                        {rev.comment}
                      </p>
                    </td>
                    <td>
                      {rev.is_approved ? (
                        <span className="badge badge-success">Đang hiển thị</span>
                      ) : (
                        <span className="badge badge-warning">Đã ẩn</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className={`button button-xs ${rev.is_approved ? 'button-secondary' : 'button-primary'}`}
                          title={rev.is_approved ? 'Ẩn khỏi cửa hàng' : 'Duyệt hiển thị'}
                          disabled={actionLoadingId === rev.id}
                          onClick={() => handleToggleStatus(rev)}
                        >
                          {rev.is_approved ? <EyeOff size={14} /> : <Eye size={14} />}
                          {rev.is_approved ? 'Ẩn' : 'Duyệt'}
                        </button>
                        <button
                          className="button button-xs button-danger"
                          title="Xóa vĩnh viễn"
                          disabled={actionLoadingId === rev.id}
                          onClick={() => handleDeleteReview(rev)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
