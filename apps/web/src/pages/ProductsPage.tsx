import { ChevronLeft, ChevronRight, Download, Eye, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ScoreRing } from '../components/ScoreRing'
import { StatusBadge } from '../components/StatusBadge'
import { API_URL, api, tokenStore } from '../services/api'
import type { ProductPage } from '../types'

export function ProductsPage() {
  const [data, setData] = useState<ProductPage | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [label, setLabel] = useState('')
  const [publishStatus, setPublishStatus] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchInput])

  useEffect(() => {
    const query = new URLSearchParams({ page: String(page), page_size: '12' })
    if (debouncedSearch) query.set('search', debouncedSearch)
    if (label) query.set('label', label)
    if (publishStatus) query.set('publish_status', publishStatus)
    api<ProductPage>(`/products?${query}`).then(setData).catch(err => setError(err.message))
  }, [page, debouncedSearch, label, publishStatus])

  async function downloadCsv() {
    const response = await fetch(`${API_URL}/exports/products?format=csv&include_demo=false`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } })
    if (!response.ok) return setError('Không thể xuất dữ liệu CSV')
    const url = URL.createObjectURL(await response.blob())
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'pharmatrust-products.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function downloadXlsx() {
    const response = await fetch(`${API_URL}/exports/products?format=xlsx&include_demo=false`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } })
    if (!response.ok) return setError('Không thể xuất dữ liệu Excel')
    const url = URL.createObjectURL(await response.blob())
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'pharmatrust-products.xlsx'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="overline">QUẢN LÝ DƯỢC PHẨM</span>
          <h1>Danh Mục Thuốc & Đăng Bán</h1>
          <p>Quản lý toàn bộ thông tin thuốc, kiểm duyệt độ tin cậy và quyết định hiển thị bán trên website.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary-button" onClick={downloadCsv}><Download size={16} /> Xuất CSV</button>
          <button className="primary-button" onClick={downloadXlsx}><Download size={16} /> Xuất Excel (.xlsx)</button>
        </div>
      </div>
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Tìm theo tên thuốc hoặc số đăng ký (nhập mượt mà, tự tìm sau 0.3s)…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <select value={label} onChange={e => { setLabel(e.target.value); setPage(1) }}>
          <option value="">Tất cả mức tin cậy</option>
          <option value="HIGH_OFFICIAL_MATCH">Khớp chuẩn</option>
          <option value="REVIEW_REQUIRED">Cần kiểm tra</option>
          <option value="INSUFFICIENT_EVIDENCE">Chưa đủ chứng cứ</option>
          <option value="BLOCKED">Đã tạm khóa</option>
        </select>
        <select value={publishStatus} onChange={e => { setPublishStatus(e.target.value); setPage(1) }}>
          <option value="">Tất cả trạng thái bán</option>
          <option value="PUBLISHED">Đang bán trên Web (Storefront)</option>
          <option value="DRAFT">Bản nháp (Chưa bán)</option>
          <option value="REVIEW_REQUIRED">Cần kiểm duyệt</option>
        </select>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {data && data.items.length === 0 && <EmptyState title="Không tìm thấy hồ sơ" description="Thử thay đổi từ khóa hoặc bộ lọc." />}
      <div className="product-grid">
        {data?.items.map(product => (
          <article className="product-card" key={product.id}>
            <div className="product-card-top">
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <StatusBadge value={product.confidence_label} />
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: product.publish_status === 'PUBLISHED' ? '#dcfce7' : '#fef3c7',
                  color: product.publish_status === 'PUBLISHED' ? '#15803d' : '#b45309'
                }}>
                  {product.publish_status === 'PUBLISHED' ? '● Đang bán' : '○ Bản nháp'}
                </span>
              </div>
              {product.is_demo && <span className="demo-pill">DEMO</span>}
            </div>
            <div className="product-card-body">
              {product.image_url ? (
                <div className="product-card-thumb-wrap">
                  <img
                    src={product.image_url}
                    alt={product.canonical_name}
                    className="product-card-thumb"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                  />
                </div>
              ) : (
                <ScoreRing score={product.overall_score} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={product.canonical_name}>
                  {product.canonical_name}
                </h3>
                <p>{product.registration_number || 'Chưa có số đăng ký'}</p>
                {product.image_url && (
                  <span style={{ fontSize: '10px', color: '#169873', fontWeight: 750, marginTop: '2px', display: 'inline-block' }}>
                    Độ tin cậy: {product.overall_score}/100
                  </span>
                )}
              </div>
            </div>
            <dl><div><dt>Nhà sản xuất</dt><dd>{product.manufacturer || 'Chưa xác định'}</dd></div><div><dt>Phân loại</dt><dd><StatusBadge value={product.rx_otc_status} /></dd></div></dl>
            <Link className="card-link" to={`/products/${product.id}`}><Eye size={16} /> Xem bằng chứng và chi tiết</Link>
          </article>
        ))}
      </div>
      {data && data.pages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft /></button><span>Trang {page}/{data.pages}</span><button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight /></button></div>}
    </div>
  )
}
