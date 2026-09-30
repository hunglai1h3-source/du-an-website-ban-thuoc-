import React, { useEffect, useState } from 'react'
import { AlertTriangle, Info, Trash2, X } from 'lucide-react'

export type ConfirmTone = 'danger' | 'warning' | 'primary'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  tone = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const [internalLoading, setInternalLoading] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading && !internalLoading) {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, internalLoading, onClose])

  if (!isOpen) return null

  const handleConfirm = async () => {
    try {
      setInternalLoading(true)
      await onConfirm()
    } finally {
      setInternalLoading(false)
    }
  }

  const isWorking = isLoading || internalLoading

  const getToneIcon = () => {
    switch (tone) {
      case 'danger':
        return <Trash2 size={22} className="confirm-icon-danger" />
      case 'warning':
        return <AlertTriangle size={22} className="confirm-icon-warning" />
      case 'primary':
      default:
        return <Info size={22} className="confirm-icon-primary" />
    }
  }

  const getConfirmButtonClass = () => {
    switch (tone) {
      case 'danger':
        return 'admin-button button-danger'
      case 'warning':
        return 'admin-button button-warning'
      case 'primary':
      default:
        return 'admin-button button-primary'
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={isWorking ? undefined : onClose}>
      <div
        className="admin-modal-container confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="confirm-modal-header">
          <div className={`confirm-icon-box tone-${tone}`}>
            {getToneIcon()}
          </div>
          <button
            type="button"
            className="admin-icon-button modal-close-btn"
            onClick={onClose}
            disabled={isWorking}
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="confirm-modal-body">
          <h3 id="confirm-modal-title" className="confirm-modal-title">
            {title}
          </h3>
          <div className="confirm-modal-message">
            {message}
          </div>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="admin-button button-secondary"
            onClick={onClose}
            disabled={isWorking}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={getConfirmButtonClass()}
            onClick={handleConfirm}
            disabled={isWorking}
          >
            {isWorking ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
