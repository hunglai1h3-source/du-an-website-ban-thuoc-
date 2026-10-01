import React, { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

export interface ErrorStateProps {
  title?: string
  message: string
  details?: string | Error | null
  onRetry?: () => void
  action?: React.ReactNode
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã xảy ra sự cố dữ liệu',
  message,
  details,
  onRetry,
  action,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false)

  const detailText =
    typeof details === 'string'
      ? details
      : details instanceof Error
      ? `${details.name}: ${details.message}\n${details.stack || ''}`
      : details
      ? JSON.stringify(details, null, 2)
      : null

  return (
    <div className={`admin-error-state ${className}`.trim()} role="alert">
      <div className="error-state-icon-wrap">
        <AlertCircle size={28} className="error-state-icon" />
      </div>

      <div className="error-state-content">
        <h3 className="error-state-title">{title}</h3>
        <p className="error-state-message">{message}</p>

        {detailText && (
          <div className="error-state-technical">
            <button
              type="button"
              className="error-toggle-btn"
              onClick={() => setShowDetails(!showDetails)}
            >
              <span>Chi tiết kỹ thuật</span>
              {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showDetails && (
              <pre className="error-technical-box">{detailText}</pre>
            )}
          </div>
        )}

        {(onRetry || action) && (
          <div className="error-state-actions">
            {onRetry && (
              <button
                type="button"
                className="admin-button button-outline-danger"
                onClick={onRetry}
              >
                <RefreshCw size={14} />
                <span>Thử lại</span>
              </button>
            )}
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
