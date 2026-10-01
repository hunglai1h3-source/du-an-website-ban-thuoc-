import { CheckCircle2, ExternalLink, FileSpreadsheet, Layers, Package, RefreshCw, UploadCloud, AlertCircle } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import type { Source } from '../types'

interface ProcessedItem {
  row: number
  name: string
  registration_number?: string | null
  price?: number | null
  manufacturer?: string | null
  status: string
  canonical_product_id?: number | null
}

interface ImportResponse {
  message: string
  created: number
  updated: number
  skipped: number
  total_rows: number
  items?: ProcessedItem[]
}

const RECOGNIZED_COLUMNS = [
  'name / ten_thuoc / tên thuốc',
  'registration_number / so_dang_ky / số đăng ký',
  'price / gia_ban / giá bán',
  'image_url / hinh_anh / hình ảnh',
  'dosage_form / dang_bao_che / dạng bào chế',
  'package / quy_cach / quy cách',
  'ingredients / hoat_chat / hoạt chất',
  'strength / ham_luong / hàm lượng',
  'indications / cong_dung / công dụng',
  'usage_instructions / cach_dung / cách dùng',
  'contraindications / luu_y / lưu ý',
  'manufacturer / nha_san_xuat / nhà sản xuất',
  'manufacturing_country / nuoc_san_xuat',
  'category / danh_muc / danh mục',
  'rx_otc / phan_loai / loại thuốc',
]

export function ImportsPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResponse | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [autoApprove, setAutoApprove] = useState(true)
  const [forceUpdate, setForceUpdate] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [selectedSource, setSelectedSource] = useState<string>('')

  useEffect(() => {
    api<Source[]>('/sources').then((data) => {
      setSources(data)
      const defaultSrc = data.find(s => ['MANUAL_UPLOAD', 'REGULATORY', 'DEMO'].includes(s.source_type))
      if (defaultSrc) {
        setSelectedSource(String(defaultSrc.id))
      }
    })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setError('Hãy chọn một tệp dữ liệu')
      return
    }
    if (!selectedSource) {
      setError('Vui lòng chọn nguồn dữ liệu')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)

    const data = new FormData()
    data.append('file', file)
    data.append('source_id', selectedSource)
    data.append('is_demo', String(isDemo))
    data.append('auto_approve', String(autoApprove))
    data.append('force_update', String(forceUpdate))

    try {
      const res = await api<ImportResponse>('/imports/file', {
        method: 'POST',
        body: data,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nhập tệp')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page narrow-page">
      <div className="page-heading">
        <div>
          <span className="overline">NHẬP TỆP DỮ LIỆU</span>
          <h1>Nhập Dữ Liệu Thuốc Từ Tệp</h1>
          <p>Tải lên bảng tính Excel (.xlsx), CSV, PDF hoặc ảnh bao bì để nhận diện và cập nhật thuốc vào hệ thống.</p>
        </div>
      </div>

      <div className="notice-banner">
        <FileSpreadsheet size={19} />
        <span>Hệ thống tự động nhận diện giá bán, hình ảnh, thành phần, công dụng và số đăng ký của thuốc từ tệp Excel/CSV.</span>
      </div>

      <form className="panel import-panel" onSubmit={submit}>
        <label className={`drop-zone ${file ? 'has-file' : ''}`}>
          <input
            type="file"
            accept=".csv,.xlsx,.json,.pdf,.png,.jpg,.jpeg"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <>
              <CheckCircle2 size={38} color="#16a34a" />
              <strong>{file.name}</strong>
              <span>{(file.size / 1024).toFixed(1)} KB</span>
            </>
          ) : (
            <>
              <UploadCloud size={42} />
              <strong>Kéo thả hoặc chọn tệp danh sách thuốc</strong>
              <span>Hỗ trợ .xlsx, .csv, .json, .pdf, .png, .jpg · tối đa 20 MB</span>
            </>
          )}
        </label>

        <div className="form-grid">
          <label>
            Nguồn dữ liệu
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              required
            >
              <option value="" disabled>Chọn nguồn…</option>
              {sources
                .filter(item => ['MANUAL_UPLOAD', 'REGULATORY', 'MANUFACTURER', 'APPROVED_LEAFLET', 'DEMO'].includes(item.source_type))
                .map(item => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="check-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={e => setAutoApprove(e.target.checked)}
            />
            <span>
              <strong>Tự động duyệt vào kho & mở bán</strong> (Tự động đưa thuốc vào danh mục bán hàng ngay)
            </span>
          </label>

          <label className="check-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={forceUpdate}
              onChange={e => setForceUpdate(e.target.checked)}
            />
            <span>
              <strong>Cập nhật / Ghi đè thuốc đã có</strong> (Làm mới giá bán, hình ảnh, công dụng thay vì bỏ qua)
            </span>
          </label>

          <label className="check-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={isDemo}
              onChange={e => setIsDemo(e.target.checked)}
            />
            <span>Đánh dấu là dữ liệu DEMO</span>
          </label>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button className="primary-button" type="submit" disabled={busy} style={{ width: '100%', marginTop: '12px' }}>
          {busy ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <RefreshCw size={18} className="animate-spin" /> Đang nhận diện thuốc và xử lý dữ liệu…
            </span>
          ) : (
            'Bắt đầu nhập và nhận diện thuốc'
          )}
        </button>
      </form>

      {result && (
        <div className="panel" style={{ marginTop: '20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#16a34a' }}>Nhập và nhận diện thuốc thành công!</h2>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#334155' }}>
            Hệ thống đã xử lý tổng cộng <strong>{result.total_rows}</strong> dòng thuốc từ tệp:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>THUỐC TẠO MỚI</span>
              <strong style={{ fontSize: '1.5rem', color: '#16a34a' }}>{result.created}</strong>
            </div>
            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#1e40af', fontWeight: 600 }}>ĐÃ CẬP NHẬT</span>
              <strong style={{ fontSize: '1.5rem', color: '#2563eb' }}>{result.updated}</strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>BỎ QUA TRÙNG</span>
              <strong style={{ fontSize: '1.5rem', color: '#64748b' }}>{result.skipped}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Link to="/products" className="button primary-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
              <Package size={17} /> Xem danh mục thuốc trong kho ({result.created + result.updated})
            </Link>
            <Link to="/candidates" className="button secondary-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
              <Layers size={17} /> Xem khu vực chờ duyệt
            </Link>
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
              <ExternalLink size={17} /> Xem gian hàng web bán thuốc
            </a>
          </div>

          {result.items && result.items.length > 0 && (
            <div className="table-wrap" style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Danh sách thuốc được nhận diện từ tệp:</h3>
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ width: '50px' }}>Dòng</th>
                    <th>Tên thuốc</th>
                    <th>Số đăng ký</th>
                    <th>Giá bán</th>
                    <th>Nhà sản xuất</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>#{item.row}</td>
                      <td><strong>{item.name}</strong></td>
                      <td><code>{item.registration_number || '—'}</code></td>
                      <td>
                        {item.price ? (
                          <span style={{ color: '#059669', fontWeight: 600 }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                          </span>
                        ) : '—'}
                      </td>
                      <td>{item.manufacturer || '—'}</td>
                      <td>
                        {item.status === 'CREATED' && <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>Đã tạo mới</span>}
                        {item.status === 'UPDATED' && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>Đã cập nhật</span>}
                        {item.status === 'MATCHED' && <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>Đã khớp</span>}
                        {item.status === 'SKIPPED' && <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Bỏ qua</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <section className="panel mapping-help" style={{ marginTop: '24px' }}>
        <h2>Các cột được hệ thống nhận diện từ tệp Excel / CSV</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '12px' }}>
          Hệ thống linh hoạt đối chiếu tiêu đề cột không phân biệt chữ hoa, chữ thường hay dấu tiếng Việt:
        </p>
        <div className="chip-list">
          {RECOGNIZED_COLUMNS.map(item => (
            <code key={item} style={{ padding: '4px 8px', borderRadius: '4px', background: '#f1f5f9' }}>{item}</code>
          ))}
        </div>
      </section>
    </div>
  )
}
