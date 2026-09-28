import { CheckCircle2, FileSpreadsheet, UploadCloud } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../services/api'
import type { Source } from '../types'

export function ImportsPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { api<Source[]>('/sources').then(setSources) }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) { setError('Hãy chọn một tệp dữ liệu'); return }
    setBusy(true); setError(''); setMessage('')
    const data = new FormData(event.currentTarget)
    data.set('file', file)
    try {
      const result = await api<{ created: number; skipped: number; total_rows: number }>('/imports/file', { method: 'POST', body: data })
      setMessage(`Đã nhập thành công ${result.created} thuốc mới chờ duyệt; bỏ qua ${result.skipped} bản ghi trùng lặp trên tổng số ${result.total_rows} dòng.`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể nhập tệp') }
    finally { setBusy(false) }
  }

  return (
    <div className="page narrow-page">
      <div className="page-heading">
        <div>
          <span className="overline">NHẬP TỆP DỮ LIỆU</span>
          <h1>Nhập Dữ Liệu Thuốc Từ Tệp</h1>
          <p>Tải lên bảng tính Excel (.xlsx), CSV, PDF hoặc ảnh bao bì để đưa thuốc mới vào hàng chờ duyệt.</p>
        </div>
      </div>
      <div className="notice-banner">
        <FileSpreadsheet size={19} />
        <span>Hệ thống bảo đảm mọi bản ghi mới đều được chuẩn hóa và đối soát cẩn thận trước khi chính thức nhập kho.</span>
      </div>
      <form className="panel import-panel" onSubmit={submit}>
        <label className={`drop-zone ${file ? 'has-file' : ''}`}>
          <input type="file" accept=".csv,.xlsx,.json,.pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} />
          {file ? <><CheckCircle2 size={38} /><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB</span></> : <><UploadCloud size={42} /><strong>Kéo thả hoặc chọn tệp</strong><span>CSV, XLSX, JSON, PDF, PNG, JPG · tối đa 20 MB</span></>}
        </label>
        <div className="form-grid"><label>Nguồn dữ liệu<select name="source_id" required defaultValue=""><option value="" disabled>Chọn nguồn…</option>{sources.filter(item => ['MANUAL_UPLOAD','REGULATORY','MANUFACTURER','APPROVED_LEAFLET','DEMO'].includes(item.source_type)).map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="check-label"><input type="checkbox" name="is_demo" value="true" />Đánh dấu là dữ liệu DEMO</label></div>
        {message && <div className="alert alert-success"><CheckCircle2 size={18} />{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy ? 'Đang xử lý OCR và dữ liệu…' : 'Bắt đầu nhập dữ liệu'}</button>
      </form>
      <section className="panel mapping-help"><h2>Các cột được nhận diện</h2><div className="chip-list">{['name / tên thuốc','registration_number / số đăng ký','manufacturer / nhà sản xuất','ingredients / hoạt chất','dosage_form / dạng bào chế','package / quy cách','rx_otc / phân loại'].map(item => <code key={item}>{item}</code>)}</div></section>
    </div>
  )
}

