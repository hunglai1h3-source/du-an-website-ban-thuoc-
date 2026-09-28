import {
  Activity,
  AlertTriangle,
  Boxes,
  Database,
  FileInput,
  FlaskConical,
  Globe,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
  ExternalLink,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../services/auth'

const ROLE_NAMES: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  DATA_REVIEWER: 'Kiểm duyệt viên',
  VIEWER: 'Nhân viên tra cứu',
  CUSTOMER: 'Khách hàng',
}

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}

interface NavGroup {
  groupLabel: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    groupLabel: 'HỒ SƠ & BÁN HÀNG',
    items: [
      { to: '/', label: 'Tổng quan hệ thống', icon: LayoutDashboard },
      { to: '/products', label: 'Hồ sơ thuốc & Duyệt bán', icon: Boxes },
      { to: '/orders', label: 'Quản lý đơn hàng', icon: ShoppingBag },
      { to: '/candidates', label: 'Thuốc mới chờ duyệt', icon: FlaskConical },
      { to: '/conflicts', label: 'Mâu thuẫn dữ liệu', icon: AlertTriangle },
    ],
  },
  {
    groupLabel: 'TỰ ĐỘNG HÓA & CÀO',
    items: [
      { to: '/pharmacy-crawler', label: 'Studio cào tự động', icon: Globe },
      { to: '/sources', label: 'Nguồn thu thập', icon: Database },
      { to: '/imports', label: 'Nhập file Excel/Tệp', icon: FileInput },
      { to: '/runs', label: 'Lịch sử đợt cào', icon: Activity },
    ],
  },
  {
    groupLabel: 'QUẢN TRỊ HỆ THỐNG',
    items: [
      { to: '/users', label: 'Quản lý người dùng', icon: Users, adminOnly: true },
      { to: '/audit', label: 'Nhật ký thao tác', icon: History, adminOnly: true },
    ],
  },
]

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={22} /></div>
          <div>
            <strong>PharmaTrust</strong>
            <span>Hệ Thống Dữ Liệu</span>
          </div>
          <button className="icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Đóng menu"><X /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', marginTop: '12px' }}>
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => !item.adminOnly || user?.role === 'ADMIN')
            if (visibleItems.length === 0) return null

            return (
              <div key={group.groupLabel} style={{ marginBottom: '16px' }}>
                <div className="sidebar-label">{group.groupLabel}</div>
                <nav>
                  {visibleItems.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setOpen(false)}
                    >
                      <item.icon size={17} />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            )
          })}
        </div>

        <div className="user-card">
          <div className="avatar">{user?.full_name?.charAt(0) || 'A'}</div>
          <div>
            <strong>{user?.full_name}</strong>
            <span>{ROLE_NAMES[user?.role || ''] || user?.role}</span>
          </div>
          <button className="icon-button" onClick={logout} title="Đăng xuất khỏi hệ thống">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="admin-desktop-header">
          <div className="header-left">
            <button className="icon-button mobile-only" onClick={() => setOpen(true)}><Menu /></button>
            <div className="system-pill">
              <span className="live-dot" />
              <strong>PharmaTrust Data Hub</strong>
              <span className="badge-env">Máy chủ 24/7</span>
            </div>
          </div>

          <div className="header-right">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="storefront-link"
              title="Mở Website Khách Hàng (Storefront :3000)"
            >
              <span>🌐 Web Khách Hàng (:3000)</span>
              <ExternalLink size={13} />
            </a>

            <div className="admin-profile-pill">
              <div className="avatar-tag">{user?.full_name?.charAt(0) || 'A'}</div>
              <div className="profile-texts">
                <strong>{user?.full_name}</strong>
                <span className="role-tag">{ROLE_NAMES[user?.role || ''] || user?.role}</span>
              </div>
              <button className="logout-btn" onClick={logout} title="Đăng xuất khỏi hệ thống">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        <div className="content-inner">
          {children}
        </div>
      </main>

      {open && <div className="overlay" onClick={() => setOpen(false)} />}
    </div>
  )
}
