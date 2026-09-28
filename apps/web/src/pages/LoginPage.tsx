import { AlertCircle, ArrowRight, Database, ShieldCheck, Sparkles, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../services/auth'

export function LoginPage() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('admin@pharmatrust.vn')
  const [password, setPassword] = useState('Admin@123456')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function quickAdminLogin() {
    setEmail('admin@pharmatrust.vn')
    setPassword('Admin@123456')
    setError('')
    setBusy(true)
    try {
      await login('admin@pharmatrust.vn', 'Admin@123456')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng nhập')
    } finally {
      setBusy(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng nhập')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-brand">
          <ShieldCheck /> PharmaTrust <span>Data Hub</span>
        </div>
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> HỆ THỐNG DỮ LIỆU DƯỢC PHẨM CHUẨN Y TẾ</div>
          <h1>Dữ liệu thuốc đáng tin cậy bắt đầu từ <em>bằng chứng rõ ràng.</em></h1>
          <p>Thu thập, chuẩn hóa và đối chiếu hồ sơ dữ liệu theo từng nguồn uy tín. Định hướng quy chuẩn dược thư và hỗ trợ kiểm soát chất lượng dữ liệu thuốc đa kênh.</p>
          <div className="hero-points">
            <div>
              <Database />
              <div>
                <strong>Nguồn gốc minh bạch</strong>
                <small>Lưu vết đối chiếu từ Pharmacity & Long Châu</small>
              </div>
            </div>
            <div>
              <ShieldCheck />
              <div>
                <strong>Quy tắc kiểm duyệt chặt chẽ</strong>
                <small>Bảo đảm độ tin cậy trước khi duyệt bán trên Storefront</small>
              </div>
            </div>
          </div>
        </div>
        <small className="hero-footer">Nền tảng đánh giá hồ sơ dữ liệu thuốc • Định hướng chuẩn GPP & GSP</small>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <div className="mobile-login-logo"><ShieldCheck /> PharmaTrust Data Hub</div>
          <span className="overline">CỔNG QUẢN TRỊ DỮ LIỆU</span>
          <h2>Đăng nhập quản trị</h2>
          <p>Nhập tài khoản Quản trị viên hoặc Kiểm duyệt viên để tiếp tục làm việc.</p>

          {error && <div className="alert alert-error"><AlertCircle size={17} />{error}</div>}

          <label>
            Email hoặc Số điện thoại
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@pharmatrust.vn"
                required
                style={{ width: '100%', paddingLeft: '36px' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
            </div>
          </label>

          <label>
            Mật khẩu
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '36px' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button className="primary-button login-button" disabled={busy}>
            {busy ? 'Đang xác thực thông tin…' : 'Đăng nhập Quản trị viên'}
            <ArrowRight size={18} />
          </button>
          
          <button
            type="button"
            className="secondary-button"
            style={{ width: '100%', marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', padding: '10px 14px' }}
            disabled={busy}
            onClick={quickAdminLogin}
          >
            <ShieldCheck size={16} /> 1-Click: Điền & Đăng nhập nhanh Admin
          </button>

          <div
            className="demo-hint"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setEmail('admin@pharmatrust.vn')
              setPassword('Admin@123456')
            }}
            title="Click để tự động điền tài khoản demo"
          >
            <strong>Tài khoản Quản trị viên mặc định</strong>
            <code>admin@pharmatrust.vn</code>
            <code>Admin@123456</code>
          </div>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <a href="http://localhost:3000" style={{ color: '#0052cc', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              ← Quay lại Website Khách Hàng (Storefront :3000)
            </a>
          </div>
        </form>
      </section>
    </div>
  )
}
