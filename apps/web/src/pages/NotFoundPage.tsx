import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <div className="page not-found"><strong>404</strong><h1>Không tìm thấy trang</h1><p>Đường dẫn bạn mở không tồn tại trong PharmaTrust.</p><Link className="primary-button" to="/">Về tổng quan</Link></div>
}

