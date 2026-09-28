import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  ImageIcon,
  Layers,
  Loader2,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { SchedulerControlPanel } from '../components/SchedulerControlPanel'

interface CatalogCard {
  id: string
  name: string
  registration_number: string | null
  manufacturer: string | null
  dosage_form: string | null
  package: string | null
  price: number | null
  unit: string | null
  price_display: string
  is_rx: boolean
  is_freeship: boolean
  action_type: 'buy' | 'consultation'
  image_url: string | null
  description: string | null
  usage_instructions: string | null
  indications: string | null
  contraindications: string | null
  side_effects: string | null
  storage_conditions: string | null
  ingredients: Array<{ name: string; strength_value?: number | null; strength_unit?: string | null }>
  source_name: string
  source_url: string
  saved_product_id?: number | null
  overall_score?: number | null
}

interface BatchScrapedItem {
  name: string
  registration_number: string | null
  manufacturer: string | null
  dosage_form: string | null
  package: string | null
  price: number | null
  unit: string | null
  price_display: string | null
  image_url: string | null
  description: string | null
  usage_instructions: string | null
  indications: string | null
  contraindications: string | null
  side_effects: string | null
  storage_conditions: string | null
  source_url: string
  source_name: string
  saved_product_id: number | null
  overall_score: number | null
  is_rx: boolean
  ingredients: Array<{ name: string; strength_value?: number | null; strength_unit?: string | null }>
}

interface ScrapePageResponse {
  total_found: number
  crawled_count: number
  saved_count: number
  source_name: string
  message: string
  products: BatchScrapedItem[]
}

export function PharmacyCrawlerPage() {
  const [activeMode, setActiveMode] = useState<'scheduler' | 'bulk' | 'catalog' | 'search'>('scheduler')

  // Catalog Cards (Matching Screenshot)
  const [catalogCards, setCatalogCards] = useState<CatalogCard[]>([])
  const [loadingCards, setLoadingCards] = useState(false)

  // Live Search State
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Bulk & Category Page Scraper State
  const [bulkUrl, setBulkUrl] = useState('')
  const [bulkLimit, setBulkLimit] = useState(20)
  const [saveToCatalog, setSaveToCatalog] = useState(true)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResults, setBulkResults] = useState<BatchScrapedItem[]>([])
  const [bulkStats, setBulkStats] = useState<{ totalFound: number; crawledCount: number; savedCount: number; sourceName: string } | null>(null)

  // Modal Leaflet State
  const [selectedLeaflet, setSelectedLeaflet] = useState<any | null>(null)
  const [modalTab, setModalTab] = useState<'usage' | 'indications' | 'contraindications' | 'side_effects' | 'storage'>('usage')

  // Feedback Notifications
  const [savingId, setSavingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; linkId?: number } | null>(null)

  useEffect(() => {
    loadCatalogCards()
  }, [])

  async function loadCatalogCards() {
    setLoadingCards(true)
    try {
      const data = await api<CatalogCard[]>('/crawler/catalog-cards')
      setCatalogCards(data)
    } catch (err: any) {
      console.error('Không tải được danh mục thẻ:', err)
    } finally {
      setLoadingCards(false)
    }
  }

  async function handleScrapePage(e?: React.FormEvent, customUrl?: string) {
    if (e) e.preventDefault()
    const targetUrl = (customUrl !== undefined ? customUrl : bulkUrl).trim()
    if (!targetUrl) return

    setBulkLoading(true)
    setBulkResults([])
    setBulkStats(null)
    setNotification(null)

    try {
      const data = await api<ScrapePageResponse>('/crawler/scrape-page', {
        method: 'POST',
        body: JSON.stringify({
          url: targetUrl,
          limit: bulkLimit,
          save_to_catalog: saveToCatalog,
        }),
      })

      setBulkResults(data.products)
      setBulkStats({
        totalFound: data.total_found,
        crawledCount: data.crawled_count,
        savedCount: data.saved_count,
        sourceName: data.source_name,
      })

      setNotification({
        type: 'success',
        message: data.message,
      })

      // Refresh catalog cards in background so their IDs are in sync
      void loadCatalogCards()
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Không thể cào dữ liệu từ đường dẫn trang web này.',
      })
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleLiveSearch(e?: React.FormEvent, customKw?: string) {
    if (e) e.preventDefault()
    const kw = (customKw !== undefined ? customKw : searchKeyword).trim()
    if (!kw) return

    setSearching(true)
    setHasSearched(true)
    setNotification(null)
    try {
      const data = await api<any[]>(`/crawler/live-search?keyword=${encodeURIComponent(kw)}`)
      setSearchResults(data)
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tìm kiếm thuốc trực tuyến.' })
    } finally {
      setSearching(false)
    }
  }

  async function handleSaveDrug(drug: any) {
    setSavingId(drug.id || drug.name)
    setNotification(null)
    try {
      const payload = {
        name: drug.name,
        registration_number: drug.registration_number,
        manufacturer: drug.manufacturer,
        dosage_form: drug.dosage_form,
        package: drug.package,
        price: drug.price,
        unit: drug.unit,
        image_url: drug.image_url,
        description: drug.description,
        usage_instructions: drug.usage_instructions,
        indications: drug.indications,
        contraindications: drug.contraindications,
        side_effects: drug.side_effects,
        storage_conditions: drug.storage_conditions,
        is_rx: drug.is_rx || false,
        ingredients: drug.ingredients || [],
        source_name: drug.source_name || 'Nhà thuốc đối chiếu',
        source_url: drug.source_url,
      }

      const res = await api<any>('/crawler/save-drug', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setNotification({
        type: 'success',
        message: res.message || `Đã lưu thành công thuốc "${drug.name}" vào kho!`,
        linkId: res.saved_product_id,
      })

      if (selectedLeaflet && (selectedLeaflet.id === drug.id || selectedLeaflet.name === drug.name)) {
        setSelectedLeaflet({ ...selectedLeaflet, saved_product_id: res.saved_product_id })
      }

      setCatalogCards((prev) =>
        prev.map((c) => (c.id === drug.id || c.name === drug.name ? { ...c, saved_product_id: res.saved_product_id } : c))
      )
      setBulkResults((prev) =>
        prev.map((b) => (b.name === drug.name ? { ...b, saved_product_id: res.saved_product_id } : b))
      )
      setSearchResults((prev) =>
        prev.map((s) => (s.id === drug.id || s.name === drug.name ? { ...s, saved_product_id: res.saved_product_id } : s))
      )
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể lưu thuốc vào kho.' })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="page pharmacy-crawler-page">
      <div className="page-heading">
        <div>
          <span className="overline">THU THẬP DỮ LIỆU DƯỢC PHẨM</span>
          <h1>Thu Thập Dữ Liệu Thuốc Tự Động</h1>
          <p>
            Thu thập, đối soát và đồng bộ thông tin thuốc, hình ảnh bao bì gốc và tờ hướng dẫn sử dụng chi tiết từ các nhà thuốc Pharmacity và Long Châu.
          </p>
        </div>
        <div className="heading-actions">
          <Link to="/products" className="secondary-button">
            <BookOpen size={16} /> Kho thuốc chuẩn ({'>'} 260 thuốc)
          </Link>
        </div>
      </div>

      {/* THÔNG BÁO HỆ THỐNG */}
      {notification && (
        <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div style={{ flex: 1 }}>
            <strong>{notification.type === 'success' ? 'Thành công:' : 'Lỗi:'}</strong> {notification.message}
            {notification.linkId && (
              <div style={{ marginTop: 6, display: 'flex', gap: 14, alignItems: 'center' }}>
                <Link to={`/products/${notification.linkId}`} className="alert-link" style={{ fontWeight: 600 }}>
                  👉 Xem hồ sơ & duyệt xuất bản (Admin) <ArrowRight size={14} />
                </Link>
                <a
                  href={`http://localhost:3000/product/prod-db-${notification.linkId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="alert-link"
                  style={{ color: '#15803d', fontWeight: 700, textDecoration: 'underline' }}
                >
                  🛍️ Xem sản phẩm trên Web Bán Hàng (Storefront) ↗
                </a>
              </div>
            )}
          </div>
          <button type="button" onClick={() => setNotification(null)} className="btn-close-icon">
            <X size={16} />
          </button>
        </div>
      )}

      {/* CHUYỂN ĐỔI CHẾ ĐỘ THU THẬP */}
      <div className="crawler-mode-tabs">
        <button
          type="button"
          className={`mode-tab-btn ${activeMode === 'scheduler' ? 'active' : ''}`}
          onClick={() => setActiveMode('scheduler')}
        >
          <Clock size={16} /> 1. Lịch Tự Động 24/7 (Định Kỳ 6 Giờ)
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${activeMode === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveMode('bulk')}
        >
          <Layers size={16} /> 2. Thu Thập Theo Liên Kết / Danh Mục
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${activeMode === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveMode('catalog')}
        >
          <Sparkles size={16} /> 3. 8 Thuốc Mẫu Kiểm Nghiệm
        </button>
        <button
          type="button"
          className={`mode-tab-btn ${activeMode === 'search' ? 'active' : ''}`}
          onClick={() => setActiveMode('search')}
        >
          <Search size={16} /> 4. Tìm Kiếm & Thu Thập Trực Tuyến
        </button>
      </div>

      {/* ===================== TAB 0: TỰ ĐỘNG CÀO 24/7 & LỊCH TRÌNH ===================== */}
      {activeMode === 'scheduler' && <SchedulerControlPanel />}

      {/* ===================== TAB 1: CÀO TOÀN BỘ THEO LINK TRANG / DANH MỤC ===================== */}
      {activeMode === 'bulk' && (
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Globe className="panel-icon text-primary" size={20} />
              <div>
                <h3>Thu Thập Toàn Bộ Dữ Liệu Theo Đường Dẫn Danh Mục</h3>
                <p>
                  Hỗ trợ link danh mục (Pharmacity, Long Châu...), link chi tiết thuốc hoặc dán danh sách nhiều liên kết (mỗi dòng một link).
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleScrapePage} style={{ marginBottom: 18 }}>
            <div style={{ marginBottom: 12 }}>
              <textarea
                value={bulkUrl}
                onChange={(e) => setBulkUrl(e.target.value)}
                placeholder="Dán đường dẫn trang danh mục nhà thuốc tại đây... Ví dụ:&#10;https://www.pharmacity.vn/duoc-pham&#10;hoặc: https://nhathuoclongchau.com.vn/thuoc-giam-dau-ha-sot&#10;hoặc danh sách nhiều liên kết thuốc (mỗi dòng một link)"
                className="url-textarea"
                rows={3}
                required
              />
            </div>

            <div className="bulk-form-options">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div className="limit-select-wrap">
                  <label htmlFor="limit-select">Số lượng thuốc muốn lấy:</label>
                  <select
                    id="limit-select"
                    value={bulkLimit}
                    onChange={(e) => setBulkLimit(Number(e.target.value))}
                    className="limit-select"
                  >
                    <option value={10}>10 sản phẩm</option>
                    <option value={20}>20 sản phẩm</option>
                    <option value={50}>50 sản phẩm</option>
                    <option value={100}>100 sản phẩm</option>
                  </select>
                </div>

                <label className="checkbox-label" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={saveToCatalog}
                    onChange={(e) => setSaveToCatalog(e.target.checked)}
                  />
                  <span>Tự động lưu và đồng bộ toàn bộ thuốc vào kho dữ liệu chuẩn</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={bulkLoading}
                className="primary-button cta-button"
                style={{ padding: '10px 22px' }}
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="spinner" size={17} /> Đang thu thập dữ liệu…
                  </>
                ) : (
                  <>
                    <Sparkles size={17} /> 🚀 Bắt Đầu Thu Thập
                  </>
                )}
              </button>
            </div>
          </form>

          {/* GỢI Ý LINK MẪU NHANH */}
          <div className="sample-links-block" style={{ marginBottom: 20 }}>
            <span className="sample-label">Gợi ý link danh mục cào nhanh (Bấm để thử ngay):</span>
            <div className="sample-chips">
              <button
                type="button"
                className="sample-chip"
                onClick={() => {
                  const u = 'https://www.pharmacity.vn/duoc-pham'
                  setBulkUrl(u)
                  void handleScrapePage(undefined, u)
                }}
              >
                <Tag size={13} /> Pharmacity: Danh mục Dược phẩm chung
              </button>
              <button
                type="button"
                className="sample-chip"
                onClick={() => {
                  const u = 'https://nhathuoclongchau.com.vn/thuoc-giam-dau-ha-sot'
                  setBulkUrl(u)
                  void handleScrapePage(undefined, u)
                }}
              >
                <Tag size={13} /> Long Châu: Thuốc giảm đau, hạ sốt
              </button>
              <button
                type="button"
                className="sample-chip"
                onClick={() => {
                  const u = 'https://www.pharmacity.vn/thuoc-khong-ke-don'
                  setBulkUrl(u)
                  void handleScrapePage(undefined, u)
                }}
              >
                <Tag size={13} /> Pharmacity: Thuốc không kê đơn (OTC)
              </button>
              <button
                type="button"
                className="sample-chip"
                onClick={() => {
                  const u = 'https://nhathuoclongchau.com.vn/thuoc-khang-sinh'
                  setBulkUrl(u)
                  void handleScrapePage(undefined, u)
                }}
              >
                <Tag size={13} /> Long Châu: Thuốc kháng sinh
              </button>
              <button
                type="button"
                className="sample-chip"
                onClick={() => {
                  const multi = [
                    'https://www.pharmacity.vn/vien-nen-sui-bot-efferalgan-eff-500mg-dieu-tri-dau-dau-dau-rang-sot-nhuc-moi-co-4-vi-x-4-vien.html',
                    'https://www.pharmacity.vn/telfast-hd-180mg-hop30-vien.html',
                    'https://www.pharmacity.vn/thuoc-khang-sinh-zinnat-500mg-hop-10-vien.html',
                    'https://www.pharmacity.vn/vien-sui-berocca-performance-huong-cam-tuyp-10-vien.html',
                    'https://www.pharmacity.vn/thuoc-bot-pha-hon-dich-uong-smecta-3g-hop-30-goi.html',
                  ].join('\n')
                  setBulkUrl(multi)
                  void handleScrapePage(undefined, multi)
                }}
              >
                <Tag size={13} /> Gói mẫu: 5 loại thuốc thiết yếu hàng đầu (Batch Links)
              </button>
            </div>
          </div>

          {/* TRẠNG THÁI ĐANG CÀO */}
          {bulkLoading && (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
              <Loader2 className="spinner" size={36} style={{ margin: '0 auto 14px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                Đang kết nối nhà thuốc, bóc tách toàn bộ danh mục sản phẩm, ảnh packshot và tờ hướng dẫn sử dụng…
              </p>
              <small style={{ color: '#64748b' }}>Quá trình này bóc tách kỹ lưỡng hình ảnh và tờ rơi lâm sàng nên có thể mất từ 5 - 15 giây.</small>
            </div>
          )}

          {/* BANNER THỐNG KÊ KẾT QUẢ CÀO */}
          {!bulkLoading && bulkStats && bulkResults.length > 0 && (
            <div className="stats-banner">
              <div className="stats-banner-text">
                <strong>✓ Cào thành công {bulkStats.crawledCount} sản phẩm từ {bulkStats.sourceName}!</strong>
                <p>
                  Đã tự động chuẩn hóa và lưu trữ {bulkStats.savedCount} thuốc vào kho CSDL. Bạn có thể xuất file Excel/CSV ngay để tích hợp cho App chính.
                </p>
              </div>

              <div className="stats-banner-actions">
                <Link to="/products" className="primary-button" style={{ padding: '8px 14px', fontSize: '12.5px' }}>
                  <BookOpen size={15} /> Xem kho thuốc chuẩn ({'>'} 90 thuốc)
                </Link>
              </div>
            </div>
          )}

          {/* DANH SÁCH SẢN PHẨM ĐÃ CÀO */}
          {!bulkLoading && bulkResults.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 700 }}>
                  Danh sách <strong>{bulkResults.length}</strong> sản phẩm vừa cào được (ảnh packshot & tờ hướng dẫn sử dụng đầy đủ):
                </span>
              </div>

              <div className="pharmacy-catalog-grid">
                {bulkResults.map((prod, idx) => {
                  const isSaved = !!prod.saved_product_id
                  const isSaving = savingId === prod.name

                  return (
                    <div key={idx} className="drug-shop-card">
                      {prod.image_url ? (
                        <div className="drug-shop-img-box">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="drug-shop-img"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="drug-shop-img-box" style={{ background: '#f8fafc', color: '#94a3b8' }}>
                          <ImageIcon size={36} />
                        </div>
                      )}

                      <h4 className="drug-shop-title" title={prod.name}>
                        {prod.name}
                      </h4>

                      <div className="drug-shop-price-row">
                        <span className="drug-shop-price">{prod.price_display || 'Chưa có giá'}</span>
                      </div>

                      <div className="drug-shop-action">
                        {isSaved ? (
                          <Link to={`/products/${prod.saved_product_id}`} className="btn-select-buy btn-select-saved">
                            <CheckCircle2 size={15} /> ✓ Đã lưu trong kho (ID: {prod.saved_product_id})
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSaveDrug(prod)}
                            disabled={isSaving}
                            className="btn-select-buy"
                          >
                            {isSaving ? <Loader2 className="spinner" size={14} /> : <Plus size={14} />}
                            + Lưu vào kho thuốc
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeaflet(prod)
                            setModalTab('usage')
                          }}
                          className="btn-view-leaflet"
                        >
                          <FileText size={13} /> Xem tờ hướng dẫn sử dụng chi tiết
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===================== TAB 2: DANH MỤC 8 THUỐC MẪU (ĐÚNG ẢNH CHỤP) ===================== */}
      {activeMode === 'catalog' && (
        <section className="panel">
          <div className="panel-header" style={{ alignItems: 'flex-start' }}>
            <div className="panel-title">
              <Sparkles className="panel-icon text-primary" size={20} />
              <div>
                <h3>Danh Mục Thuốc Bán Lẻ Thực Tế (Khớp 100% Ảnh Chụp Quầy Thuốc)</h3>
                <p>
                  Bao gồm đầy đủ ảnh chụp hộp thuốc gốc chất lượng cao, giá niêm yết, nhãn miễn phí giao nhanh, quy cách và tờ hướng dẫn sử dụng chi tiết đã đối soát.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadCatalogCards}
              disabled={loadingCards}
              className="secondary-button"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <RefreshCw className={loadingCards ? 'spinner' : ''} size={14} /> Làm mới trạng thái
            </button>
          </div>

          {loadingCards ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
              <Loader2 className="spinner" size={32} style={{ margin: '0 auto 12px' }} />
              <p>Đang tải dữ liệu và trạng thái kho thuốc…</p>
            </div>
          ) : (
            <div className="pharmacy-catalog-grid">
              {catalogCards.map((card) => {
                const isSaved = !!card.saved_product_id
                const isSaving = savingId === card.id

                return (
                  <div key={card.id} className="drug-shop-card">
                    {/* BADGE GIAO NHANH */}
                    {card.is_freeship && (
                      <span className="freeship-badge">
                        <Zap size={10} /> MIỄN PHÍ GIAO NHANH
                      </span>
                    )}

                    {/* HÌNH ẢNH SẢN PHẨM CHUẨN PACKSHOT */}
                    <div className="drug-shop-img-box">
                      <img
                        src={card.image_url || ''}
                        alt={card.name}
                        className="drug-shop-img"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'
                        }}
                      />
                    </div>

                    {/* TIÊU ĐỀ THUỐC */}
                    <h4 className="drug-shop-title" title={card.name}>
                      {card.name}
                    </h4>

                    {/* GIÁ TIỀN & ĐƠN VỊ TÍNH */}
                    <div className="drug-shop-price-row">
                      {card.price_display && card.price_display.includes('/') ? (
                        <span className="drug-shop-price">
                          {card.price_display.split('/')[0]} <u>đ</u>/{card.price_display.split('/')[1]}
                        </span>
                      ) : (
                        <span className="drug-shop-price" style={{ fontSize: '15px', color: '#475569' }}>
                          Đơn vị tính: <strong>{card.price_display}</strong>
                        </span>
                      )}
                    </div>

                    {/* NÚT THAO TÁC THEO LOẠI THUỐC (OTC vs Rx) */}
                    <div className="drug-shop-action">
                      {card.is_rx ? (
                        <div className="consultation-badge">
                          <AlertCircle size={14} /> Cần tư vấn dược sĩ
                        </div>
                      ) : isSaved ? (
                        <Link to={`/products/${card.saved_product_id}`} className="btn-select-buy btn-select-saved">
                          <CheckCircle2 size={15} /> ✓ Đã lưu trong kho (ID: {card.saved_product_id})
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveDrug(card)}
                          disabled={isSaving}
                          className="btn-select-buy"
                        >
                          {isSaving ? <Loader2 className="spinner" size={14} /> : <Plus size={14} />}
                          + Chọn mua / Lưu vào kho
                        </button>
                      )}

                      {/* XEM TỜ HƯỚNG DẪN SỬ DỤNG CHI TIẾT */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLeaflet(card)
                          setModalTab('usage')
                        }}
                        className="btn-view-leaflet"
                      >
                        <FileText size={13} /> Xem tờ hướng dẫn sử dụng chi tiết
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ===================== TAB 3: TÌM KIẾM & CÀO TRỰC TIẾP ===================== */}
      {activeMode === 'search' && (
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Search className="panel-icon text-primary" size={20} />
              <div>
                <h3>Tìm Kiếm & Cào Dữ Liệu Thời Gian Thực Từ Kho Dược Phẩm</h3>
                <p>
                  Nhập tên bất kỳ loại thuốc nào để hệ thống truy vấn và bóc tách dữ liệu ảnh packshot, giá và quy cách trực tiếp.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleLiveSearch} className="crawler-form" style={{ marginBottom: 16 }}>
            <div className="input-group">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={18} />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Nhập tên thuốc cần tìm (ví dụ: Panadol, Efferalgan, Zinnat, Telfast, Smecta, Berocca...)"
                  className="url-input"
                  required
                />
              </div>
              <button type="submit" disabled={searching} className="primary-button cta-button">
                {searching ? (
                  <>
                    <Loader2 className="spinner" size={17} /> Đang tìm kiếm…
                  </>
                ) : (
                  <>
                    <Search size={17} /> Tìm & Cào Dữ Liệu
                  </>
                )}
              </button>
            </div>
          </form>

          {/* GỢI Ý TỪ KHÓA NHANH */}
          <div className="sample-links-block" style={{ marginBottom: 24 }}>
            <span className="sample-label">Từ khóa phổ biến:</span>
            <div className="sample-chips">
              {['Panadol', 'Efferalgan', 'Nexium', 'Zinnat', 'Berocca', 'Smecta', 'Telfast', 'Gaviscon', 'Hapacol'].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  className="sample-chip"
                  onClick={() => {
                    setSearchKeyword(kw)
                    void handleLiveSearch(undefined, kw)
                  }}
                >
                  <Tag size={13} /> {kw}
                </button>
              ))}
            </div>
          </div>

          {/* KẾT QUẢ TÌM KIẾM */}
          {searching && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
              <Loader2 className="spinner" size={28} style={{ margin: '0 auto 10px' }} />
              <p>Đang kết nối nhà thuốc để truy xuất danh mục và hình ảnh…</p>
            </div>
          )}

          {!searching && hasSearched && searchResults.length === 0 && (
            <div className="empty-section" style={{ textAlign: 'center', padding: '30px' }}>
              Không tìm thấy sản phẩm thuốc nào phù hợp với từ khóa "{searchKeyword}". Vui lòng thử từ khóa khác.
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                  Tìm thấy <strong>{searchResults.length}</strong> sản phẩm từ kho dược phẩm:
                </span>
              </div>

              <div className="pharmacy-catalog-grid">
                {searchResults.map((prod, idx) => {
                  const isSaved = !!prod.saved_product_id
                  const isSaving = savingId === (prod.id || prod.name)

                  return (
                    <div key={prod.id || idx} className="drug-shop-card">
                      {prod.image_url ? (
                        <div className="drug-shop-img-box">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="drug-shop-img"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="drug-shop-img-box" style={{ background: '#f8fafc', color: '#94a3b8' }}>
                          <ImageIcon size={36} />
                        </div>
                      )}

                      <h4 className="drug-shop-title" title={prod.name}>
                        {prod.name}
                      </h4>

                      <div className="drug-shop-price-row">
                        {prod.price ? (
                          <span className="drug-shop-price">
                            {prod.price.toLocaleString('vi-VN')} <u>đ</u>
                            {prod.unit ? `/${prod.unit}` : ''}
                          </span>
                        ) : (
                          <span style={{ fontSize: '13px', color: '#64748b' }}>Giá liên hệ</span>
                        )}
                      </div>

                      <div className="drug-shop-action">
                        {isSaved ? (
                          <Link to={`/products/${prod.saved_product_id}`} className="btn-select-buy btn-select-saved">
                            <CheckCircle2 size={15} /> ✓ Đã có trong kho (ID: {prod.saved_product_id})
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSaveDrug(prod)}
                            disabled={isSaving}
                            className="btn-select-buy"
                          >
                            {isSaving ? <Loader2 className="spinner" size={14} /> : <Plus size={14} />}
                            + Cào & Lưu vào kho thuốc
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLeaflet({
                              ...prod,
                              price_display: prod.price ? `${prod.price.toLocaleString('vi-VN')} đ` : 'Chưa có giá',
                              is_rx: prod.is_rx || false,
                              is_freeship: false,
                              action_type: 'buy',
                            })
                            setModalTab('usage')
                          }}
                          className="btn-view-leaflet"
                        >
                          <FileText size={13} /> Xem thông tin chi tiết
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===================== MODAL: TỜ HƯỚNG DẪN SỬ DỤNG CHI TIẾT (LEAFLET) ===================== */}
      {selectedLeaflet && (
        <div className="modal-backdrop" onClick={() => setSelectedLeaflet(null)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-window-header">
              <div>
                <span className="badge badge-success" style={{ marginBottom: 6, display: 'inline-flex' }}>
                  <CheckCircle2 size={12} /> Tờ Hướng Dẫn Sử Dụng & Dữ Liệu Lâm Sàng
                </span>
                <h3>{selectedLeaflet.name}</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: '12px', color: '#64748b' }}>
                  {selectedLeaflet.registration_number && (
                    <span>
                      Số đăng ký: <strong>{selectedLeaflet.registration_number}</strong>
                    </span>
                  )}
                  {selectedLeaflet.manufacturer && (
                    <span>
                      Nhà sản xuất: <strong>{selectedLeaflet.manufacturer}</strong>
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeaflet(null)}
                className="btn-close-icon"
                title="Đóng cửa sổ"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-window-body">
              <div className="scraped-grid">
                {/* CỘT TRÁI: ẢNH PACKSHOT & THÔNG TIN CƠ BẢN */}
                <div className="scraped-media-col" style={{ width: '280px', flexShrink: 0 }}>
                  <div className="scraped-image-wrapper">
                    {selectedLeaflet.image_url ? (
                      <img
                        src={selectedLeaflet.image_url}
                        alt={selectedLeaflet.name}
                        className="scraped-drug-img"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80'
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <ImageIcon size={40} />
                        <span>Không có ảnh</span>
                      </div>
                    )}
                  </div>

                  <div className="price-callout" style={{ marginTop: 12 }}>
                    <span className="price-label">Giá niêm yết nhà thuốc:</span>
                    <strong className="price-value">{selectedLeaflet.price_display}</strong>
                    <small>Thu thập từ {selectedLeaflet.source_name || 'Nhà thuốc đối chiếu'}</small>
                  </div>

                  <div className="meta-list" style={{ marginTop: 12 }}>
                    {selectedLeaflet.dosage_form && (
                      <div className="meta-item">
                        <span>Dạng bào chế:</span>
                        <strong>{selectedLeaflet.dosage_form}</strong>
                      </div>
                    )}
                    {selectedLeaflet.package && (
                      <div className="meta-item">
                        <span>Quy cách:</span>
                        <strong>{selectedLeaflet.package}</strong>
                      </div>
                    )}
                    <div className="meta-item">
                      <span>Phân loại:</span>
                      <strong>{selectedLeaflet.is_rx ? 'Thuốc kê đơn (Rx)' : 'Thuốc không kê đơn (OTC)'}</strong>
                    </div>
                  </div>

                  {selectedLeaflet.ingredients && selectedLeaflet.ingredients.length > 0 && (
                    <div className="ingredients-box" style={{ marginTop: 12 }}>
                      <h4>
                        <Pill size={14} /> Hoạt chất & Hàm lượng:
                      </h4>
                      <ul>
                        {selectedLeaflet.ingredients.map((ing: any, i: number) => (
                          <li key={i}>
                            <strong>{ing.name}</strong>
                            {ing.strength_value ? ` ${ing.strength_value}${ing.strength_unit || ''}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* CỘT PHẢI: NỘI DUNG TỜ HƯỚNG DẪN */}
                <div className="scraped-leaflet-col">
                  {selectedLeaflet.description && (
                    <div className="product-brief-description">
                      <p>{selectedLeaflet.description}</p>
                    </div>
                  )}

                  <div className="leaflet-tabs">
                    <button
                      type="button"
                      className={`tab-btn ${modalTab === 'usage' ? 'active' : ''}`}
                      onClick={() => setModalTab('usage')}
                    >
                      💊 Hướng dẫn & Liều dùng
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${modalTab === 'indications' ? 'active' : ''}`}
                      onClick={() => setModalTab('indications')}
                    >
                      📋 Chỉ định điều trị
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${modalTab === 'contraindications' ? 'active' : ''}`}
                      onClick={() => setModalTab('contraindications')}
                    >
                      ⚠️ Chống chỉ định
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${modalTab === 'side_effects' ? 'active' : ''}`}
                      onClick={() => setModalTab('side_effects')}
                    >
                      🚨 Tác dụng phụ
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${modalTab === 'storage' ? 'active' : ''}`}
                      onClick={() => setModalTab('storage')}
                    >
                      📦 Bảo quản
                    </button>
                  </div>

                  <div className="leaflet-content-body">
                    {modalTab === 'usage' && (
                      <div className="tab-pane">
                        <h3>Hướng dẫn sử dụng & Liều lượng:</h3>
                        {selectedLeaflet.usage_instructions ? (
                          <div className="formatted-text">{selectedLeaflet.usage_instructions}</div>
                        ) : (
                          <div className="empty-section">Chưa có thông tin liều dùng chi tiết cho sản phẩm này.</div>
                        )}
                      </div>
                    )}

                    {modalTab === 'indications' && (
                      <div className="tab-pane">
                        <h3>Chỉ định / Công dụng điều trị:</h3>
                        {selectedLeaflet.indications ? (
                          <div className="formatted-text">{selectedLeaflet.indications}</div>
                        ) : (
                          <div className="empty-section">Chưa có thông tin chỉ định cho sản phẩm này.</div>
                        )}
                      </div>
                    )}

                    {modalTab === 'contraindications' && (
                      <div className="tab-pane">
                        <h3>Chống chỉ định (Các trường hợp không được dùng):</h3>
                        {selectedLeaflet.contraindications ? (
                          <div className="formatted-text warning-text">{selectedLeaflet.contraindications}</div>
                        ) : (
                          <div className="empty-section">Chưa có ghi nhận chống chỉ định cho sản phẩm này.</div>
                        )}
                      </div>
                    )}

                    {modalTab === 'side_effects' && (
                      <div className="tab-pane">
                        <h3>Tác dụng phụ có thể gặp phải:</h3>
                        {selectedLeaflet.side_effects ? (
                          <div className="formatted-text">{selectedLeaflet.side_effects}</div>
                        ) : (
                          <div className="empty-section">Chưa có ghi nhận tác dụng phụ cho sản phẩm này.</div>
                        )}
                      </div>
                    )}

                    {modalTab === 'storage' && (
                      <div className="tab-pane">
                        <h3>Hướng dẫn bảo quản:</h3>
                        {selectedLeaflet.storage_conditions ? (
                          <div className="formatted-text">{selectedLeaflet.storage_conditions}</div>
                        ) : (
                          <div className="empty-section">Bảo quản ở nơi khô ráo, nhiệt độ dưới 30°C, tránh ánh sáng trực tiếp.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-window-footer">
              {selectedLeaflet.saved_product_id ? (
                <Link to={`/products/${selectedLeaflet.saved_product_id}`} className="primary-button">
                  <BookOpen size={16} /> Xem hồ sơ trong kho thuốc (ID: {selectedLeaflet.saved_product_id})
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSaveDrug(selectedLeaflet)}
                  disabled={savingId === selectedLeaflet.name}
                  className="primary-button success-btn"
                >
                  {savingId === selectedLeaflet.name ? <Loader2 className="spinner" size={16} /> : <Plus size={16} />}
                  Lưu vào Danh bạ thuốc
                </button>
              )}
              <button type="button" onClick={() => setSelectedLeaflet(null)} className="secondary-button">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
