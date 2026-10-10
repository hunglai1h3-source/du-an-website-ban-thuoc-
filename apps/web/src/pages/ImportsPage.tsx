import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  Package,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Tag,
  UploadCloud,
  X,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { api } from '../services/api'

interface WarehouseItem {
  id: number
  code: string
  name: string
  address: string
  district?: string
  province?: string
  is_central?: boolean
}

interface PreviewItem {
  row: number
  name: string
  registration_number?: string | null
  batch_number: string
  expiry_date: string
  quantity: number
  price?: number | null
  manufacturer?: string | null
  dosage_form?: string | null
  package?: string | null
  status: 'NEW' | 'EXISTING' | 'INVALID'
  status_label: string
  is_near_expiry?: boolean
}

interface PreviewResponse {
  filename: string
  warehouse_id?: number | null
  warehouse_name: string
  warehouse_code?: string
  total_rows: number
  valid_rows: number
  duplicate_rows: number
  invalid_rows: number
  total_quantity: number
  default_batch_applied: string
  default_expiry_applied: string
  items: PreviewItem[]
}

interface ProcessedItem {
  row: number
  name: string
  registration_number?: string | null
  price?: number | null
  manufacturer?: string | null
  batch_number?: string
  expiry_date?: string
  quantity?: number
  status: string
  canonical_product_id?: number | null
}

interface ImportResponse {
  message: string
  created: number
  updated: number
  skipped: number
  total_rows: number
  total_quantity?: number
  warehouse_name?: string
  items?: ProcessedItem[]
}

const RECOGNIZED_COLUMNS = [
  'Tên thuốc (name / ten_thuoc)',
  'Số đăng ký (registration_number / so_dang_ky)',
  'Số lô (batch_number / so_lo / lot)',
  'Hạn sử dụng (expiry_date / han_dung / hsd)',
  'Số lượng nhập (quantity / so_luong / sl)',
  'Giá bán (price / gia_ban / don_gia)',
  'Quy cách đóng gói (package / quy_cach)',
  'Dạng bào chế (dosage_form / dang_bao_che)',
  'Hoạt chất chính (ingredients / hoat_chat)',
  'Hàm lượng (strength / ham_luong)',
  'Nhà sản xuất (manufacturer / nha_san_xuat)',
  'Nước sản xuất (manufacturing_country / nuoc_san_xuat)',
  'Phân loại thuốc (rx_otc / loai_thuoc)',
]

export function ImportsPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
  
  // Default Lot Number & Expiry Date
  const today = new Date()
  const defaultDateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const [batchNumber, setBatchNumber] = useState<string>(`LOT-${defaultDateStr}-01`)
  
  const defaultExpDate = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10)
  const [expiryDate, setExpiryDate] = useState<string>(defaultExpDate)
  const [initialQuantity, setInitialQuantity] = useState<number>(100)

  const [autoApprove, setAutoApprove] = useState(true)
  const [forceUpdate, setForceUpdate] = useState(true)

  const [file, setFile] = useState<File | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)

  const [importBusy, setImportBusy] = useState(false)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [error, setError] = useState('')
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  // 1. Fetch warehouses on mount
  useEffect(() => {
    api<WarehouseItem[]>('/warehouses')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setWarehouses(data)
          // Ưu tiên kho trung tâm hoặc kho đầu tiên
          const central = data.find((w) => w.is_central) || data[0]
          setSelectedWarehouseId(String(central.id))
        }
      })
      .catch((err) => {
        console.error('Không thể tải danh sách kho', err)
      })
  }, [])

  // 2. Download sample excel template
  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    setError('')
    try {
      const token = localStorage.getItem('pharmatrust_access_token')
      const res = await fetch('/api/v1/imports/template', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Không thể tải file mẫu từ máy chủ')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Mau_Nhap_Don_Thuoc_Pharmatrust.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Lỗi tải tệp mẫu Excel')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  // 3. Scan & Preview File
  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile)
    setImportResult(null)
    setPreviewData(null)
    setError('')

    if (!selectedFile) return

    setPreviewLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (selectedWarehouseId) formData.append('warehouse_id', selectedWarehouseId)
      if (batchNumber.trim()) formData.append('batch_number', batchNumber.trim())
      if (expiryDate) formData.append('expiry_date', expiryDate)
      formData.append('initial_quantity', String(initialQuantity || 100))

      const data = await api<PreviewResponse>('/imports/preview', {
        method: 'POST',
        body: formData,
      })
      setPreviewData(data)
    } catch (err: any) {
      setError(err.message || 'Lỗi quét tệp Excel. Vui lòng kiểm tra định dạng.')
    } finally {
      setPreviewLoading(false)
    }
  }

  // 4. Confirm Official Import
  const handleConfirmImport = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!file) {
      setError('Vui lòng chọn tệp Excel hoặc CSV trước khi nhập')
      return
    }
    if (!selectedWarehouseId) {
      setError('Vui lòng chọn Kho / Chi nhánh tiếp nhận thuốc')
      return
    }

    setImportBusy(true)
    setError('')
    setImportResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('warehouse_id', selectedWarehouseId)
    if (batchNumber.trim()) formData.append('batch_number', batchNumber.trim())
    if (expiryDate) formData.append('expiry_date', expiryDate)
    formData.append('initial_quantity', String(initialQuantity || 100))
    formData.append('auto_approve', String(autoApprove))
    formData.append('force_update', String(forceUpdate))

    try {
      const res = await api<ImportResponse>('/imports/file', {
        method: 'POST',
        body: formData,
      })
      setImportResult(res)
      setPreviewData(null)
    } catch (err: any) {
      setError(err.message || 'Không thể nhập tệp vào kho')
    } finally {
      setImportBusy(false)
    }
  }

  // Reset to import another batch
  const handleReset = () => {
    setFile(null)
    setPreviewData(null)
    setImportResult(null)
    setError('')
  }

  const selectedWarehouse = warehouses.find((w) => String(w.id) === selectedWarehouseId)

  return (
    <div className="page" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 28px 60px' }}>
      <AdminPageHeader
        title="Nhập File Excel Đơn Thuốc & Quản Lý Lô Thuốc"
        subtitle="Chọn kho nhập, thiết lập số lô và hạn dùng. Hệ thống tự động quét nhận diện thuốc và phân bổ tồn kho bán hàng."
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Nhập Liệu & Đơn Thuốc', href: '/imports' },
          { label: 'Nhập file Excel' },
        ]}
        actions={
          <button
            type="button"
            className="button button-secondary"
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700 }}
          >
            {downloadingTemplate ? (
              <RefreshCw size={15} className="spin" />
            ) : (
              <Download size={15} color="#0284c7" />
            )}
            <span>Tải file Excel mẫu (.xlsx)</span>
          </button>
        }
      />

      {/* Error alert */}
      {error && (
        <div
          className="alert alert-error"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 10,
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: FORM SETUP & FILE SELECTION */}
      {!importResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Warehouse and Batch Settings Card */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <Building2 size={20} color="#0284c7" />
              <h2 style={{ fontSize: 16, fontWeight: 750, color: '#0f172a', margin: 0 }}>
                1. Thông Tin Nhập Hàng & Phân Bổ Lô Thuốc
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {/* Nhập ở đâu - Kho tiếp nhận */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Nhập ở đâu (Kho / Chi nhánh tiếp nhận) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => {
                    setSelectedWarehouseId(e.target.value)
                    if (file) handleFileChange(file)
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: '#0f172a',
                    background: '#fff',
                  }}
                  required
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code}) {wh.is_central ? '— Kho Tổng' : ''}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                  {selectedWarehouse?.address || 'Chọn kho để lưu trữ tồn kho sau khi quét'}
                </div>
              </div>

              {/* Mã số lô thuốc */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Mã số lô thuốc áp dụng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="VD: LOT-202610-01"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: '#0f172a',
                      fontFamily: 'monospace',
                    }}
                    required
                  />
                  <Tag
                    size={15}
                    color="#64748b"
                    style={{ position: 'absolute', left: 10, top: 12 }}
                  />
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                  Áp dụng làm mã lô mặc định nếu file Excel không có cột Số lô
                </div>
              </div>

              {/* Hạn của lô thuốc */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Hạn của lô thuốc này (Expiry Date) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                    required
                  />
                  <Calendar
                    size={15}
                    color="#64748b"
                    style={{ position: 'absolute', left: 10, top: 11 }}
                  />
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                  Áp dụng làm hạn sử dụng nếu trong file chưa ghi hạn
                </div>
              </div>

              {/* Số lượng nhập mặc định */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: 6,
                  }}
                >
                  Số lượng nhập mặc định mỗi thuốc
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(Math.max(1, Number(e.target.value) || 1))}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                  <Package
                    size={15}
                    color="#64748b"
                    style={{ position: 'absolute', left: 10, top: 11 }}
                  />
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                  Áp dụng khi dòng thuốc trong file không có cột Số lượng
                </div>
              </div>
            </div>

            {/* Checkbox options */}
            <div
              style={{
                display: 'flex',
                gap: 24,
                flexWrap: 'wrap',
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px dashed #e2e8f0',
              }}
            >
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                />
                <span>Tự động duyệt và mở bán ngay trên Website (:3000)</span>
              </label>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={forceUpdate}
                  onChange={(e) => setForceUpdate(e.target.checked)}
                />
                <span>Cập nhật giá bán và thông tin nếu thuốc đã có trong kho</span>
              </label>
            </div>
          </div>

          {/* File Upload Drop Zone */}
          <div
            className="panel"
            style={{
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <FileSpreadsheet size={20} color="#0284c7" />
              <h2 style={{ fontSize: 16, fontWeight: 750, color: '#0f172a', margin: 0 }}>
                2. Tải Lên Tệp Excel Đơn Thuốc
              </h2>
            </div>

            <label
              className={`drop-zone ${file ? 'has-file' : ''}`}
              style={{
                border: '2px dashed #94a3b8',
                borderRadius: 12,
                padding: '36px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                background: file ? '#f0fdf4' : '#f8fafc',
                borderColor: file ? '#22c55e' : '#cbd5e1',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="file"
                accept=".xlsx,.csv,.xls"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
              />

              {previewLoading ? (
                <>
                  <RefreshCw size={36} className="spin" color="#0284c7" />
                  <strong style={{ fontSize: 15, color: '#0369a1' }}>
                    Hệ thống đang quét và nhận diện thuốc từ tệp...
                  </strong>
                  <span style={{ fontSize: 12.5, color: '#64748b' }}>
                    Vui lòng chờ trong giây lát
                  </span>
                </>
              ) : file ? (
                <>
                  <CheckCircle2 size={40} color="#16a34a" />
                  <strong style={{ fontSize: 15, color: '#15803d' }}>{file.name}</strong>
                  <span style={{ fontSize: 12.5, color: '#64748b' }}>
                    Dung lượng: {(file.size / 1024).toFixed(1)} KB · Nhấp để đổi tệp khác
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud size={44} color="#0284c7" />
                  <strong style={{ fontSize: 15, color: '#0f172a' }}>
                    Kéo thả hoặc nhấp để chọn tệp Excel danh sách đơn thuốc (.xlsx, .csv)
                  </strong>
                  <span style={{ fontSize: 12.5, color: '#64748b' }}>
                    Hỗ trợ đầy đủ định dạng chuẩn. Hệ thống sẽ tự động quét và phân tích trước khi lưu.
                  </span>
                </>
              )}
            </label>
          </div>

          {/* STEP 2: PREVIEW SCAN RESULTS */}
          {previewData && (
            <div
              className="panel"
              style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1.5px solid #0284c7',
                padding: '24px',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08)',
                animation: 'fadeIn 0.25s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 18,
                  paddingBottom: 14,
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sparkles size={22} color="#0284c7" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 750, color: '#0f172a' }}>
                      Kết Quả Tự Động Quét & Kiểm Tra Tệp ({previewData.filename})
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
                      Kiểm tra kỹ thông tin thuốc, số lô và hạn dùng bên dưới trước khi xác nhận nhập kho.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={handleReset}
                    style={{ fontSize: 13 }}
                  >
                    Hủy & Chọn file khác
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => handleConfirmImport()}
                    disabled={importBusy || previewData.valid_rows === 0}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      fontSize: 13.5,
                      fontWeight: 700,
                      background: '#16a34a',
                    }}
                  >
                    {importBusy ? (
                      <RefreshCw size={15} className="spin" />
                    ) : (
                      <PackageCheck size={16} />
                    )}
                    <span>Xác nhận nhập {previewData.valid_rows} thuốc vào kho</span>
                  </button>
                </div>
              </div>

              {/* Metric stats cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: '#eff6ff',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#1e40af', fontWeight: 700, display: 'block' }}>
                    TỔNG THUỐC QUÉT ĐƯỢC
                  </span>
                  <strong style={{ fontSize: 24, color: '#1d4ed8' }}>
                    {previewData.total_rows}
                  </strong>
                  <span style={{ fontSize: 11.5, color: '#3b82f6', display: 'block', marginTop: 2 }}>
                    dòng trong tệp Excel
                  </span>
                </div>

                <div
                  style={{
                    background: '#f0fdf4',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#166534', fontWeight: 700, display: 'block' }}>
                    THUỐC HỢP LỆ NHẬP KHO
                  </span>
                  <strong style={{ fontSize: 24, color: '#16a34a' }}>
                    {previewData.valid_rows}
                  </strong>
                  <span style={{ fontSize: 11.5, color: '#22c55e', display: 'block', marginTop: 2 }}>
                    {previewData.duplicate_rows > 0
                      ? `(${previewData.duplicate_rows} thuốc đã có sẽ cập nhật)`
                      : 'Đầy đủ thông tin'}
                  </span>
                </div>

                <div
                  style={{
                    background: '#fefce8',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid #fef08a',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#854d0e', fontWeight: 700, display: 'block' }}>
                    TỔNG SỐ LƯỢNG NHẬP
                  </span>
                  <strong style={{ fontSize: 24, color: '#ca8a04' }}>
                    {previewData.total_quantity.toLocaleString('vi-VN')}
                  </strong>
                  <span style={{ fontSize: 11.5, color: '#a16207', display: 'block', marginTop: 2 }}>
                    đơn vị / hộp thuốc
                  </span>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 700, display: 'block' }}>
                    KHO & HẠN DÙNG ÁP DỤNG
                  </span>
                  <strong style={{ fontSize: 14, color: '#0f172a', display: 'block', marginTop: 4 }}>
                    {previewData.warehouse_name}
                  </strong>
                  <span style={{ fontSize: 11.5, color: '#64748b', display: 'block', marginTop: 2 }}>
                    Lô: {previewData.default_batch_applied} · HSD: {previewData.default_expiry_applied}
                  </span>
                </div>
              </div>

              {/* Preview Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>#</th>
                      <th style={{ padding: '10px 12px' }}>Tên thuốc</th>
                      <th style={{ padding: '10px 12px' }}>Số đăng ký</th>
                      <th style={{ padding: '10px 12px' }}>Số lô</th>
                      <th style={{ padding: '10px 12px' }}>Hạn dùng (HSD)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>SL nhập</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Giá bán</th>
                      <th style={{ padding: '10px 12px' }}>Nhà sản xuất</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.items.map((item) => (
                      <tr
                        key={item.row}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: item.status === 'INVALID' ? '#fef2f2' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>#{item.row}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <code style={{ fontFamily: 'monospace', color: '#0369a1' }}>
                            {item.registration_number || '—'}
                          </code>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>
                            {item.batch_number}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: item.is_near_expiry ? '#b45309' : '#047857',
                              background: item.is_near_expiry ? '#fef3c7' : '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 11.5,
                            }}
                          >
                            {item.expiry_date}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {item.quantity.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                          {item.price ? `${item.price.toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>
                          {item.manufacturer || '—'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {item.status === 'NEW' && (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                              Thuốc mới
                            </span>
                          )}
                          {item.status === 'EXISTING' && (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                              Cập nhật lô
                            </span>
                          )}
                          {item.status === 'INVALID' && (
                            <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                              {item.status_label}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confirm Bottom Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <div style={{ fontSize: 13, color: '#475569' }}>
                  Kho tiếp nhận: <strong>{previewData.warehouse_name}</strong> · Tổng số lượng nhập:{' '}
                  <strong style={{ color: '#16a34a' }}>{previewData.total_quantity.toLocaleString('vi-VN')} đơn vị</strong>
                </div>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => handleConfirmImport()}
                  disabled={importBusy || previewData.valid_rows === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                    background: '#16a34a',
                  }}
                >
                  {importBusy ? (
                    <RefreshCw size={17} className="spin" />
                  ) : (
                    <ArrowDownToLine size={18} />
                  )}
                  <span>Xác nhận nhập kho ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: RESULT VIEW AFTER OFFICIAL IMPORT */}
      {importResult && (
        <div
          className="panel"
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '2px solid #22c55e',
            padding: '28px',
            boxShadow: '0 8px 30px rgba(34, 197, 94, 0.12)',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <CheckCircle2 size={32} color="#16a34a" />
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#15803d', fontWeight: 800 }}>
                Nhập Kho & Nhận Diện Đơn Thuốc Thành Công!
              </h2>
              <p style={{ margin: '4px 0 0', color: '#475569', fontSize: 13.5 }}>
                Hệ thống đã lưu trữ toàn bộ hồ sơ thuốc, phân bổ số lô và cập nhật tồn kho tại{' '}
                <strong>{importResult.warehouse_name || selectedWarehouse?.name}</strong>.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
              margin: '20px 0',
            }}
          >
            <div style={{ background: '#f0fdf4', padding: '14px 16px', borderRadius: 10, border: '1px solid #bbf7d0', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#166534', fontWeight: 700, display: 'block' }}>THUỐC TẠO MỚI</span>
              <strong style={{ fontSize: 26, color: '#16a34a' }}>{importResult.created}</strong>
            </div>
            <div style={{ background: '#eff6ff', padding: '14px 16px', borderRadius: 10, border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#1e40af', fontWeight: 700, display: 'block' }}>ĐÃ CẬP NHẬT LÔ & GIÁ</span>
              <strong style={{ fontSize: 26, color: '#2563eb' }}>{importResult.updated}</strong>
            </div>
            <div style={{ background: '#fefce8', padding: '14px 16px', borderRadius: 10, border: '1px solid #fef08a', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#854d0e', fontWeight: 700, display: 'block' }}>TỔNG SL ĐÃ NHẬP KHO</span>
              <strong style={{ fontSize: 26, color: '#ca8a04' }}>
                {(importResult.total_quantity || 0).toLocaleString('vi-VN')}
              </strong>
            </div>
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 10, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, display: 'block' }}>TỔNG DÒNG XỬ LÝ</span>
              <strong style={{ fontSize: 26, color: '#475569' }}>{importResult.total_rows}</strong>
            </div>
          </div>

          {/* Quick links */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24, paddingTop: 18, borderTop: '1px solid #f1f5f9' }}>
            <Link
              to="/inventory/batches"
              className="button button-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', fontWeight: 700 }}
            >
              <Layers size={16} /> Xem Lô Thuốc & Hạn Dùng Kho
            </Link>
            <Link
              to="/products"
              className="button button-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', fontWeight: 700 }}
            >
              <Package size={16} /> Xem Danh Mục Thuốc Mở Bán
            </Link>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="button button-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none', fontWeight: 700 }}
            >
              <ExternalLink size={16} /> Kiểm tra Website Khách Hàng (:3000)
            </a>
            <button
              type="button"
              className="button"
              onClick={handleReset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, marginLeft: 'auto', background: '#f1f5f9' }}
            >
              <RotateCcw size={15} /> Nhập đợt thuốc mới
            </button>
          </div>

          {/* Result items table */}
          {importResult.items && importResult.items.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 750, color: '#0f172a', marginBottom: 10 }}>
                Chi tiết các mặt hàng thuốc vừa nhập kho:
              </h3>
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Dòng</th>
                      <th style={{ padding: '8px 12px' }}>Tên thuốc</th>
                      <th style={{ padding: '8px 12px' }}>Số đăng ký</th>
                      <th style={{ padding: '8px 12px' }}>Số lô</th>
                      <th style={{ padding: '8px 12px' }}>Hạn dùng</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>SL nhập</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Giá bán</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>#{it.row}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{it.name}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <code style={{ fontFamily: 'monospace', color: '#0369a1' }}>
                            {it.registration_number || '—'}
                          </code>
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>
                          {it.batch_number || batchNumber}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#047857', fontWeight: 600 }}>
                          {it.expiry_date || expiryDate}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {(it.quantity || initialQuantity).toLocaleString('vi-VN')}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                          {it.price ? `${it.price.toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          {it.status === 'CREATED' && (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                              Đã tạo mới
                            </span>
                          )}
                          {it.status === 'UPDATED' && (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                              Đã cập nhật
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guide section for recognized columns */}
      <section
        className="panel"
        style={{
          marginTop: 28,
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <FileSpreadsheet size={18} color="#0284c7" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 750, color: '#0f172a' }}>
            Quy Chuẩn Cột Nhận Diện Từ Tệp Excel / CSV
          </h3>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>
          Hệ thống tự động quét và đối chiếu linh hoạt tiêu đề các cột trong file, không phân biệt chữ hoa, chữ thường hay dấu tiếng Việt:
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RECOGNIZED_COLUMNS.map((col) => (
            <code
              key={col}
              style={{
                padding: '5px 10px',
                borderRadius: 6,
                background: '#f1f5f9',
                color: '#334155',
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid #e2e8f0',
              }}
            >
              {col}
            </code>
          ))}
        </div>
      </section>
    </div>
  )
}
