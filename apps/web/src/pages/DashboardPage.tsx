import { Activity, AlertOctagon, CheckCircle2, Database, FileStack, RefreshCw, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { api } from '../services/api'
import { StatusBadge } from '../components/StatusBadge'

interface Summary {
  documents: number
  products: number
  high_match: number
  review_required: number
  insufficient: number
  blocked: number
  open_conflicts: number
  recent_runs: Array<{ id: number; source_id: number; status: string; products_discovered: number; started_at: string | null }>
}

const colors = ['#169873', '#d79028', '#8d98a6', '#d95c59']

export function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState('')
  const load = () => api<Summary>('/dashboard/summary').then(setData).catch(err => setError(err.message))
  useEffect(() => { void load() }, [])

  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>
  if (!data) return <div className="page loading-page"><RefreshCw className="spin" /> Đang tải tổng quan…</div>
  const chartData = [
    { name: 'Khớp cao', value: data.high_match },
    { name: 'Cần kiểm tra', value: data.review_required },
    { name: 'Thiếu bằng chứng', value: data.insufficient },
    { name: 'Đã chặn', value: data.blocked },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="overline">HỆ THỐNG QUẢN LÝ DƯỢC</span>
          <h1>Tổng quan hệ thống</h1>
          <p>Theo dõi chất lượng danh mục thuốc, cảnh báo đồng bộ và hoạt động thu thập dữ liệu.</p>
        </div>
        <button className="secondary-button" onClick={load}><RefreshCw size={16} /> Làm mới dữ liệu</button>
      </div>
      <div className="notice-banner">
        <ShieldAlert size={19} />
        <span><strong>Lưu ý vận hành:</strong> Dữ liệu thuốc được đối soát kỹ lưỡng giữa các nguồn trước khi cho phép xuất bản lên trang bán hàng Storefront.</span>
      </div>
      <div className="metric-grid">
        <Metric icon={FileStack} label="Tài liệu thu thập" value={data.documents} tone="blue" />
        <Metric icon={Database} label="Tổng số thuốc" value={data.products} tone="purple" />
        <Metric icon={CheckCircle2} label="Thuốc khớp chuẩn" value={data.high_match} tone="green" />
        <Metric icon={AlertOctagon} label="Cần xử lý lệch dữ liệu" value={data.open_conflicts} tone="red" />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <div className="panel-heading"><div><h2>Tình trạng dữ liệu thuốc</h2><p>Tỷ lệ kiểm định độ tin cậy của các loại thuốc</p></div></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={245}>
              <PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={92} paddingAngle={4}>{chartData.map((_, i) => <Cell key={i} fill={colors[i]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
            <div className="chart-center"><strong>{data.products}</strong><span>loại thuốc</span></div>
          </div>
          <div className="legend">{chartData.map((item, i) => <span key={item.name}><i style={{ background: colors[i] }} />{item.name}<strong>{item.value}</strong></span>)}</div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>Tác vụ thu thập gần đây</h2><p>Lịch sử các phiên cào và nhập dữ liệu</p></div><Activity size={19} /></div>
          <div className="activity-list">
            {data.recent_runs.length ? data.recent_runs.map(run => (
              <div className="activity-row" key={run.id}>
                <span className="activity-icon"><Database size={17} /></span>
                <div><strong>Phiên cào #{run.id}</strong><small>Nguồn #{run.source_id} · {run.products_discovered} sản phẩm phát hiện</small></div>
                <StatusBadge value={run.status} />
              </div>
            )) : <div className="soft-empty">Chưa có tác vụ thu thập nào.</div>}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Database; label: string; value: number; tone: string }) {
  return <div className="metric-card"><span className={`metric-icon tone-${tone}`}><Icon size={21} /></span><div><span>{label}</span><strong>{value.toLocaleString('vi-VN')}</strong></div></div>
}
