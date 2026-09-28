import { FileSearch } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { api } from '../services/api'

interface Candidate { id: number; observed_name: string; registration_number_text: string | null; manufacturer_text: string | null; extraction_confidence: number; extraction_method: string; processing_status: string; created_at: string }

export function CandidatesPage() {
  const [items, setItems] = useState<Candidate[]>([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { api<Candidate[]>(`/candidates${status ? `?status=${status}` : ''}`).then(setItems).catch(err => setError(err.message)) }, [status])
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="overline">KHU VỰC CHỜ DUYỆT</span>
          <h1>Thuốc Chờ Duyệt (Dữ Liệu Mới)</h1>
          <p>Danh sách thuốc vừa được thu thập hoặc nhập tệp, chờ đối soát chuẩn hóa trước khi nhập kho.</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="filter-label"><FileSearch size={17} /> Trạng thái xử lý:</div>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="EXTRACTED">Mới thu thập</option>
          <option value="MATCHED">Đã khớp dữ liệu</option>
          <option value="REVIEW_REQUIRED">Cần kiểm tra</option>
          <option value="REJECTED">Đã từ chối</option>
        </select>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {!items.length ? (
        <EmptyState title="Chưa có dữ liệu chờ duyệt" description="Hãy chạy tính năng thu thập tự động hoặc nhập tệp Excel để bắt đầu." />
      ) : (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên thuốc thu thập</th>
                <th>Số đăng ký</th>
                <th>Nhà sản xuất</th>
                <th>Nguồn lấy</th>
                <th>Độ tin cậy</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>#{item.id}</td>
                  <td><strong>{item.observed_name}</strong></td>
                  <td>{item.registration_number_text || '—'}</td>
                  <td>{item.manufacturer_text || '—'}</td>
                  <td><code>{item.extraction_method}</code></td>
                  <td>
                    <div className="confidence-bar"><i style={{ width: `${item.extraction_confidence * 100}%` }} /></div>
                    {Math.round(item.extraction_confidence * 100)}%
                  </td>
                  <td><StatusBadge value={item.processing_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

