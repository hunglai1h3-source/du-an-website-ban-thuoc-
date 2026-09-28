import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useAuth } from './services/auth'

const AuditPage = lazy(() => import('./pages/AuditPage').then(module => ({ default: module.AuditPage })))
const CandidatesPage = lazy(() => import('./pages/CandidatesPage').then(module => ({ default: module.CandidatesPage })))
const ConflictsPage = lazy(() => import('./pages/ConflictsPage').then(module => ({ default: module.ConflictsPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const ImportsPage = lazy(() => import('./pages/ImportsPage').then(module => ({ default: module.ImportsPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })))
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(module => ({ default: module.OrdersPage })))
const PharmacyCrawlerPage = lazy(() => import('./pages/PharmacyCrawlerPage').then(module => ({ default: module.PharmacyCrawlerPage })))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(module => ({ default: module.ProductDetailPage })))
const ProductsPage = lazy(() => import('./pages/ProductsPage').then(module => ({ default: module.ProductsPage })))
const RunsPage = lazy(() => import('./pages/RunsPage').then(module => ({ default: module.RunsPage })))
const SourcesPage = lazy(() => import('./pages/SourcesPage').then(module => ({ default: module.SourcesPage })))
const UsersPage = lazy(() => import('./pages/UsersPage').then(module => ({ default: module.UsersPage })))

function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) return <div className="full-loading">Đang khởi tạo PharmaTrust…</div>
  if (!user) return <Navigate to="/login" replace />
  return <Layout><Outlet /></Layout>
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <Suspense fallback={<div className="full-loading">Đang tải giao diện…</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="pharmacy-crawler" element={<PharmacyCrawlerPage />} />
          <Route path="candidates" element={<CandidatesPage />} />
          <Route path="conflicts" element={<ConflictsPage />} />
          <Route path="sources" element={<SourcesPage />} />
          <Route path="imports" element={<ImportsPage />} />
          <Route path="runs" element={<RunsPage />} />
          <Route path="users" element={<AdminOnly><UsersPage /></AdminOnly>} />
          <Route path="audit" element={<AdminOnly><AuditPage /></AdminOnly>} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
