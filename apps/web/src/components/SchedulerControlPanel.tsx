import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  ImageIcon,
  Layers,
  Loader2,
  Play,
  Power,
  RefreshCw,
  Send,
  Settings,
  ShieldAlert,
  Tag,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

interface SchedulerStatusData {
  auto_crawl_enabled: boolean
  interval_hours: number
  pharmacity_enabled: boolean
  long_chau_enabled: boolean
  publish_mode: 'MANUAL_REVIEW' | 'AUTO_PUBLISH_VALID'
  next_run_at: { [source: string]: string }
  locks: {
    [source: string]: {
      is_locked: boolean
      locked_at: string | null
      overlap_count: number
      last_skipped_at: string | null
    }
  }
  alerts: Array<{
    id: number
    source: string
    type: string
    severity: string
    message: string
    created_at: string | null
  }>
  recent_runs: Array<{
    id: number
    source_id: number
    status: string
    started_at: string | null
    finished_at: string | null
    pages_success: number
    pages_failed: number
    products_discovered: number
    error_message: string | null
  }>
}

interface CategoryReviewItem {
  id: number
  name: string
  registration_number: string | null
  dosage_form: string | null
  confidence: number
  reason: string | null
  image_url: string | null
  publish_status: string
}

const CATEGORY_OPTIONS = [
  { slug: 'thuoc-khong-ke-don', name: 'Thuốc Không Kê Đơn (OTC)' },
  { slug: 'thuoc-ke-don', name: 'Thuốc Kê Đơn (Rx)' },
  { slug: 'thuc-pham-chuc-nang', name: 'Vitamin & Thực Phẩm Chức Năng' },
  { slug: 'duoc-my-pham', name: 'Dược Mỹ Phẩm & Chăm Sóc Da' },
  { slug: 'thiet-bi-y-te', name: 'Thiết Bị & Dụng Cụ Y Tế' },
]

export function SchedulerControlPanel() {
  const [data, setData] = useState<SchedulerStatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [optimizingImages, setOptimizingImages] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Category Review Queue
  const [categoryQueue, setCategoryQueue] = useState<CategoryReviewItem[]>([])
  const [selectedCategories, setSelectedCategories] = useState<{ [id: number]: string }>({})
  const [assigningId, setAssigningId] = useState<number | null>(null)

  // Telegram Alert State
  const [telegramEnabled, setTelegramEnabled] = useState(false)
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [savingTelegram, setSavingTelegram] = useState(false)
  const [testingTelegram, setTestingTelegram] = useState(false)

  useEffect(() => {
    loadAll(false)
    const timer = setInterval(() => { loadAll(true) }, 30000) // Tự động làm mới âm thầm mỗi 30s không làm giật lag giao diện
    return () => clearInterval(timer)
  }, [])

  async function loadAll(isBackground = false) {
    if (!isBackground) setLoading(true)
    try {
      const [statusRes, queueRes, tgRes] = await Promise.all([
        api<SchedulerStatusData>('/crawler/scheduler/status'),
        api<CategoryReviewItem[]>('/crawler/category-review'),
        api<{ enabled: boolean; masked_token: string; chat_id: string }>('/crawler/alerts/telegram-config').catch(() => null),
      ])
      setData(statusRes)
      setCategoryQueue(queueRes)
      if (tgRes) {
        setTelegramEnabled(tgRes.enabled)
        setTelegramChatId(tgRes.chat_id)
        if (!telegramToken && tgRes.masked_token) {
          setTelegramToken(tgRes.masked_token)
        }
      }
    } catch (err: any) {
      console.error('Không tải được trạng thái Scheduler:', err)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }

  async function updateConfig(newConfig: Partial<SchedulerStatusData>) {
    setUpdating(true)
    setNotification(null)
    try {
      await api('/crawler/scheduler/config', {
        method: 'PATCH',
        body: JSON.stringify(newConfig),
      })
      setNotification({ type: 'success', message: 'Cấu hình tự động cào 24/7 đã được lưu thành công!' })
      await loadAll()
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể lưu cấu hình.' })
    } finally {
      setUpdating(false)
    }
  }

  async function handleTriggerNow(sourceCode: 'PHARMACITY' | 'LONG_CHAU') {
    setTriggering(sourceCode)
    setNotification(null)
    try {
      await api(`/crawler/scheduler/trigger/${sourceCode}`, { method: 'POST' })
      setNotification({
        type: 'success',
        message: `Đã kích hoạt cào ngay cho ${sourceCode}. Quá trình đang chạy nền theo quy định an toàn.`,
      })
      await loadAll()
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể kích hoạt cào ngay.' })
    } finally {
      setTriggering(null)
    }
  }

  async function handleBackfillImages() {
    setOptimizingImages(true)
    setNotification(null)
    try {
      const res = await api<{ message: string }>('/crawler/images/backfill?limit=50', { method: 'POST' })
      setNotification({ type: 'success', message: res.message || 'Đã tải và tối ưu ảnh WebP thành công!' })
      await loadAll()
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể tối ưu ảnh.' })
    } finally {
      setOptimizingImages(false)
    }
  }

  async function handleSaveTelegramConfig() {
    setSavingTelegram(true)
    setNotification(null)
    try {
      const payload: any = { enabled: telegramEnabled, chat_id: telegramChatId }
      if (telegramToken && !telegramToken.includes('...')) {
        payload.bot_token = telegramToken
      }
      await api('/crawler/alerts/telegram-config', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      setNotification({ type: 'success', message: 'Đã lưu cấu hình thông báo Telegram thành công!' })
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể lưu cấu hình Telegram.' })
    } finally {
      setSavingTelegram(false)
    }
  }

  async function handleTestTelegram() {
    setTestingTelegram(true)
    setNotification(null)
    try {
      const payload: any = {}
      if (telegramToken && !telegramToken.includes('...')) payload.bot_token = telegramToken
      if (telegramChatId) payload.chat_id = telegramChatId
      const res = await api<{ success: boolean; message: string }>('/crawler/alerts/test-telegram', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setNotification({ type: 'success', message: res.message || 'Đã gửi tin nhắn thử nghiệm thành công!' })
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Kiểm tra kết nối Telegram thất bại.' })
    } finally {
      setTestingTelegram(false)
    }
  }

  async function handleAssignCategory(productId: number) {
    const chosenCat = selectedCategories[productId]
    if (!chosenCat) {
      alert('Vui lòng chọn danh mục cho sản phẩm.')
      return
    }

    setAssigningId(productId)
    try {
      await api(`/crawler/category-review/${productId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ category_slug: chosenCat }),
      })
      setCategoryQueue((prev) => prev.filter((p) => p.id !== productId))
      setNotification({ type: 'success', message: 'Đã phân loại thành công danh mục cho sản phẩm.' })
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Không thể gán danh mục.' })
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div className="scheduler-control-panel" style={{ marginTop: 10 }}>
      {/* THÔNG BÁO NHANH */}
      {notification && (
        <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* CẢNH BÁO BẢO VỆ CHỐNG BOT NẾU CÓ */}
      {data?.alerts && data.alerts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {data.alerts.map((al) => (
            <div
              key={al.id}
              className="alert"
              style={{
                backgroundColor: al.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                borderLeft: `4px solid ${al.severity === 'CRITICAL' ? '#dc2626' : '#d97706'}`,
                padding: '12px 16px',
                marginBottom: 8,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <ShieldAlert size={20} color={al.severity === 'CRITICAL' ? '#dc2626' : '#d97706'} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ color: al.severity === 'CRITICAL' ? '#991b1b' : '#92400e' }}>
                  {al.type === 'SOURCE_BLOCKED' ? 'CẢNH BÁO CHẶN NGUỒN AN TOÀN:' : 'CẢNH BÁO HỆ THỐNG:'}
                </strong>{' '}
                <span style={{ fontSize: 13, color: '#374151' }}>{al.message}</span>
                {al.created_at && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    Thời điểm: {new Date(al.created_at).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KHỐI 1: CẤU HÌNH & TRẠNG THÁI THU THẬP TỰ ĐỘNG 24/7 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
        {/* THẺ ĐIỀU KHIỂN CHÍNH */}
        <div className="panel" style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={20} className="text-primary" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Điều Phối Tự Động (Định Kỳ 6 Giờ)</h3>
            </div>
            <button
              type="button"
              onClick={() => loadAll(false)}
              disabled={loading}
              className="secondary-button"
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              <RefreshCw size={13} className={loading ? 'spinner' : ''} /> Làm mới
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Bật/Tắt chu kỳ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 6 }}>
              <div>
                <strong style={{ fontSize: 14 }}>Tự động chạy lặp lại:</strong>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Hệ thống tự thu thập dữ liệu sau mỗi 6 giờ</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={data?.auto_crawl_enabled || false}
                  disabled={updating}
                  onChange={(e) => updateConfig({ auto_crawl_enabled: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 600, color: data?.auto_crawl_enabled ? '#16a34a' : '#64748b' }}>
                  {data?.auto_crawl_enabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                </span>
              </label>
            </div>

            {/* Chế độ duyệt */}
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 6 }}>
              <strong style={{ fontSize: 13 }}>Chế độ xử lý thuốc mới:</strong>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="publish_mode"
                    value="MANUAL_REVIEW"
                    checked={data?.publish_mode === 'MANUAL_REVIEW'}
                    disabled={updating}
                    onChange={() => updateConfig({ publish_mode: 'MANUAL_REVIEW' })}
                  />
                  <span>Dược sĩ duyệt tay</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="publish_mode"
                    value="AUTO_PUBLISH_VALID"
                    checked={data?.publish_mode === 'AUTO_PUBLISH_VALID'}
                    disabled={updating}
                    onChange={() => updateConfig({ publish_mode: 'AUTO_PUBLISH_VALID' })}
                  />
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>Tự động đăng khi đủ chuẩn</span>
                </label>
              </div>
            </div>

            {/* Tối ưu ảnh nội bộ WebP (Chống mất ảnh) */}
            <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <strong style={{ fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ImageIcon size={14} /> Lưu trữ & Nén ảnh WebP (Chống mất ảnh)
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#15803d' }}>
                  Tải ảnh về máy chủ nội bộ, nén nhẹ định dạng WebP và tạo ảnh thu nhỏ.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBackfillImages}
                disabled={optimizingImages}
                className="secondary-button"
                style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: '#fff', borderColor: '#86efac', color: '#166534' }}
              >
                {optimizingImages ? <Loader2 size={13} className="spinner" /> : <ImageIcon size={13} />}
                {optimizingImages ? 'Đang tải & nén...' : 'Tối ưu ảnh ngay'}
              </button>
            </div>
          </div>
        </div>

        {/* THẺ NGUỒN PHARMACITY */}
        <div className="panel" style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              🟢 Nhà thuốc Pharmacity
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
              <input
                type="checkbox"
                checked={data?.pharmacity_enabled || false}
                disabled={updating}
                onChange={(e) => updateConfig({ pharmacity_enabled: e.target.checked })}
              />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{data?.pharmacity_enabled ? 'Đang bật' : 'Tắt'}</span>
            </label>
          </div>

          <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
            <div>
              <strong>Trạng thái:</strong>{' '}
              {data?.locks?.PHARMACITY?.is_locked ? (
                <span style={{ color: '#ea580c', fontWeight: 600 }}>Đang thu thập...</span>
              ) : (
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Sẵn sàng</span>
              )}
            </div>
            <div>
              <strong>Bỏ qua trùng lặp:</strong> {data?.locks?.PHARMACITY?.overlap_count || 0} lần
            </div>
            <div>
              <strong>Phiên kế tiếp:</strong>{' '}
              {data?.next_run_at?.PHARMACITY
                ? new Date(data.next_run_at.PHARMACITY).toLocaleTimeString('vi-VN') + ' ' + new Date(data.next_run_at.PHARMACITY).toLocaleDateString('vi-VN')
                : 'Đang lên lịch...'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTriggerNow('PHARMACITY')}
            disabled={triggering === 'PHARMACITY' || data?.locks?.PHARMACITY?.is_locked}
            className="secondary-button"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {triggering === 'PHARMACITY' ? <Loader2 size={14} className="spinner" /> : <Play size={14} />}
            Thu thập ngay (Pharmacity)
          </button>
        </div>

        {/* THẺ NGUỒN LONG CHÂU */}
        <div className="panel" style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔵 Nhà thuốc Long Châu
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
              <input
                type="checkbox"
                checked={data?.long_chau_enabled || false}
                disabled={updating}
                onChange={(e) => updateConfig({ long_chau_enabled: e.target.checked })}
              />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{data?.long_chau_enabled ? 'Đang bật' : 'Tắt'}</span>
            </label>
          </div>

          <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>
            <div>
              <strong>Trạng thái:</strong>{' '}
              {data?.locks?.LONG_CHAU?.is_locked ? (
                <span style={{ color: '#ea580c', fontWeight: 600 }}>Đang thu thập...</span>
              ) : (
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Sẵn sàng</span>
              )}
            </div>
            <div>
              <strong>Chính sách an toàn:</strong> Tự động dừng nguồn khi có chặn mã bảo vệ
            </div>
            <div>
              <strong>Phiên kế tiếp:</strong>{' '}
              {data?.next_run_at?.LONG_CHAU
                ? new Date(data.next_run_at.LONG_CHAU).toLocaleTimeString('vi-VN') + ' ' + new Date(data.next_run_at.LONG_CHAU).toLocaleDateString('vi-VN')
                : 'Đang lên lịch...'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTriggerNow('LONG_CHAU')}
            disabled={triggering === 'LONG_CHAU' || data?.locks?.LONG_CHAU?.is_locked}
            className="secondary-button"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {triggering === 'LONG_CHAU' ? <Loader2 size={14} className="spinner" /> : <Play size={14} />}
            Thu thập ngay (Long Châu)
          </button>
        </div>

        {/* THẺ CẢNH BÁO TELEGRAM CHO ADMIN */}
        <div className="panel" style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              ✈️ Báo Cáo Qua Telegram
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
              <input
                type="checkbox"
                checked={telegramEnabled}
                disabled={savingTelegram}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
              />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{telegramEnabled ? 'Bật' : 'Tắt'}</span>
            </label>
          </div>

          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
            Nhận tin nhắn cảnh báo tức thì khi bị chặn nguồn, phát hiện thuốc thu hồi khẩn hoặc báo cáo sau chu kỳ 6h.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Mã Bot Telegram (Bot Token):</label>
              <input
                type="text"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="123456789:ABCDefGHI..."
                style={{ width: '100%', padding: '5px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>ID Cuộc trò chuyện / Nhóm (Chat ID):</label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Ví dụ: 987654321 hoặc -100..."
                style={{ width: '100%', padding: '5px 8px', fontSize: 12, borderRadius: 4, border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleSaveTelegramConfig}
              disabled={savingTelegram}
              className="primary-button"
              style={{ flex: 1, justifyContent: 'center', padding: '6px 10px', fontSize: 12 }}
            >
              {savingTelegram ? <Loader2 size={13} className="spinner" /> : <Settings size={13} />}
              Lưu cấu hình
            </button>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTelegram || (!telegramToken && !telegramChatId)}
              className="secondary-button"
              style={{ justifyContent: 'center', padding: '6px 10px', fontSize: 12 }}
              title="Gửi tin nhắn thử nghiệm để kiểm tra kết nối"
            >
              {testingTelegram ? <Loader2 size={13} className="spinner" /> : <Send size={13} />}
              Gửi thử nghiệm
            </button>
          </div>
        </div>
      </div>

      {/* KHỐI 2: HÀNG CHỜ PHÂN LOẠI DANH MỤC THỦ CÔNG */}
      <div className="panel" style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={18} className="text-primary" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Hàng Chờ Phân Loại Danh Mục (Thuốc Cần Dược Sĩ Kiểm Tra)
            </h3>
          </div>
          <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
            {categoryQueue.length} thuốc cần chọn danh mục
          </span>
        </div>

        {categoryQueue.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            🎉 Toàn bộ thuốc đều đã được phân loại danh mục chính xác và sẵn sàng xuất bản.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên thuốc</th>
                  <th>Số đăng ký</th>
                  <th>Độ tin cậy</th>
                  <th>Lý do</th>
                  <th style={{ minWidth: 220 }}>Chọn danh mục phù hợp</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categoryQueue.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, background: '#f1f5f9', borderRadius: 4 }} />
                      )}
                    </td>
                    <td>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{item.dosage_form || 'Chưa rõ dạng'}</div>
                    </td>
                    <td>{item.registration_number || 'Chưa có'}</td>
                    <td>
                      <span style={{ color: '#d97706', fontWeight: 700 }}>{(item.confidence * 100).toFixed(0)}%</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{item.reason || 'Dưới ngưỡng tin cậy'}</td>
                    <td>
                      <select
                        value={selectedCategories[item.id] || ''}
                        onChange={(e) => setSelectedCategories({ ...selectedCategories, [item.id]: e.target.value })}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}
                      >
                        <option value="">-- Chọn danh mục hợp lệ --</option>
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleAssignCategory(item.id)}
                        disabled={assigningId === item.id}
                        className="primary-button"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        {assigningId === item.id ? <Loader2 size={13} className="spinner" /> : <Tag size={13} />}
                        Lưu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KHỐI 3: LỊCH SỬ CHẠY GẦN NHẤT */}
      <div className="panel" style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Nhật Ký Các Phiên Thu Thập Gần Nhất</h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th>Mã phiên</th>
                <th>Nguồn dữ liệu</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Trạng thái</th>
                <th>Trang thành công</th>
                <th>Trang lỗi</th>
                <th>Số thuốc tìm thấy</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_runs?.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.source_id === 3 ? 'PHARMACITY' : r.source_id === 4 ? 'LONG_CHAU' : `Nguồn #${r.source_id}`}</td>
                  <td>{r.started_at ? new Date(r.started_at).toLocaleTimeString('vi-VN') : '-'}</td>
                  <td>{r.finished_at ? new Date(r.finished_at).toLocaleTimeString('vi-VN') : '-'}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor:
                          r.status === 'SUCCESS' ? '#dcfce7' : r.status === 'RUNNING' ? '#fed7aa' : '#fee2e2',
                        color:
                          r.status === 'SUCCESS' ? '#15803d' : r.status === 'RUNNING' ? '#c2410c' : '#b91c1c',
                      }}
                    >
                      {r.status === 'SUCCESS' ? 'Thành công' : r.status === 'RUNNING' ? 'Đang chạy' : 'Thất bại'}
                    </span>
                  </td>
                  <td>{r.pages_success}</td>
                  <td>{r.pages_failed}</td>
                  <td><strong>{r.products_discovered}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
