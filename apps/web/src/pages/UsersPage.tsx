import { useEffect, useState } from 'react'
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  Award,
  RefreshCw,
  Phone,
  Mail,
} from 'lucide-react'
import { api } from '../services/api'
import type { User } from '../types'

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  const fetchUsers = () => {
    setLoading(true)
    api<User[]>('/users')
      .then((data) => setUsers(data))
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term ||
      u.full_name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term))
    return matchesRole && matchesSearch
  })

  const totalUsers = users.length
  const totalAdmins = users.filter((u) => u.role === 'ADMIN').length
  const totalCustomers = users.filter((u) => u.role === 'CUSTOMER').length
  const totalReviewers = users.filter((u) => u.role === 'DATA_REVIEWER').length

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <span className="eyebrow">HỆ THỐNG PHÂN QUYỀN & TÀI KHOẢN</span>
          <h1>Quản Lý Người Dùng & Khách Hàng</h1>
          <p className="page-sub">
            Theo dõi, phân quyền và quản lý tài khoản độc lập giữa Quản trị viên và Khách hàng mua sắm.
          </p>
        </div>
        <button className="primary-button" onClick={fetchUsers} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Làm mới
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Users size={22} />
          </div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-label">Tổng số tài khoản</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <ShieldCheck size={22} />
          </div>
          <div className="stat-value">{totalAdmins}</div>
          <div className="stat-label">Quản trị viên (Admin)</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <UserCheck size={22} />
          </div>
          <div className="stat-value">{totalCustomers}</div>
          <div className="stat-label">Khách hàng thành viên</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
            <Award size={22} />
          </div>
          <div className="stat-value">{totalReviewers}</div>
          <div className="stat-label">Kiểm duyệt viên dữ liệu</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="table-controls" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '36px' }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
        >
          <option value="ALL">Tất cả vai trò ({totalUsers})</option>
          <option value="ADMIN">Quản trị viên ({totalAdmins})</option>
          <option value="CUSTOMER">Khách hàng ({totalCustomers})</option>
          <option value="DATA_REVIEWER">Kiểm duyệt viên ({totalReviewers})</option>
          <option value="VIEWER">Nhân viên tra cứu</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Đang tải danh sách tài khoản...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Không tìm thấy tài khoản nào khớp với điều kiện tìm kiếm.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Thông tin liên hệ</th>
                <th>Vai trò</th>
                <th>Điểm tích lũy</th>
                <th>Trạng thái</th>
                <th>Lần đăng nhập cuối</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isAdmin = u.role === 'ADMIN'
                const isCustomer = u.role === 'CUSTOMER'
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: isAdmin ? '#fef3c7' : isCustomer ? '#dbeafe' : '#f1f5f9',
                            color: isAdmin ? '#b45309' : isCustomer ? '#1d4ed8' : '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '14px',
                          }}
                        >
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <strong style={{ display: 'block', color: '#0f172a' }}>{u.full_name}</strong>
                          <small style={{ color: '#94a3b8' }}>ID: #{u.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                          <Mail size={13} style={{ color: '#94a3b8' }} /> {u.email}
                        </div>
                        {u.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginTop: '2px' }}>
                            <Phone size={13} style={{ color: '#94a3b8' }} /> {u.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className="badge"
                        style={{
                          background: isAdmin
                            ? '#fef3c7'
                            : isCustomer
                            ? '#dbeafe'
                            : u.role === 'DATA_REVIEWER'
                            ? '#f3e8ff'
                            : '#f1f5f9',
                          color: isAdmin
                            ? '#92400e'
                            : isCustomer
                            ? '#1e40af'
                            : u.role === 'DATA_REVIEWER'
                            ? '#7e22ce'
                            : '#475569',
                          fontWeight: 700,
                          fontSize: '11.5px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {isAdmin ? 'Quản trị viên' : isCustomer ? 'Khách hàng' : u.role}
                      </span>
                    </td>

                    <td>
                      {isCustomer ? (
                        <strong style={{ color: '#0284c7' }}>{u.loyalty_points ?? 50} điểm</strong>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Không áp dụng</span>
                      )}
                    </td>

                    <td>
                      <span
                        className="badge"
                        style={{
                          background: u.is_active ? '#dcfce7' : '#fee2e2',
                          color: u.is_active ? '#15803d' : '#b91c1c',
                          fontWeight: 700,
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {u.is_active ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleString('vi-VN')
                          : 'Chưa đăng nhập'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
