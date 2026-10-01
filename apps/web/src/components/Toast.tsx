import React, { createContext, useCallback, useContext, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  title?: string
  duration?: number
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string, duration?: number) => void
    error: (message: string, title?: string, duration?: number) => void
    warning: (message: string, title?: string, duration?: number) => void
    info: (message: string, title?: string, duration?: number) => void
  }
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newToast: ToastItem = { id, type, message, title, duration }
      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const toast = {
    success: (msg: string, title?: string, duration?: number) =>
      addToast('success', msg, title, duration),
    error: (msg: string, title?: string, duration?: number) =>
      addToast('error', msg, title || 'Lỗi thao tác', duration || 5000),
    warning: (msg: string, title?: string, duration?: number) =>
      addToast('warning', msg, title || 'Cảnh báo', duration),
    info: (msg: string, title?: string, duration?: number) =>
      addToast('info', msg, title, duration),
  }

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="admin-toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`admin-toast toast-${t.type}`} role="alert">
            <div className="toast-icon">
              {t.type === 'success' && <CheckCircle2 size={18} />}
              {t.type === 'error' && <AlertCircle size={18} />}
              {t.type === 'warning' && <AlertTriangle size={18} />}
              {t.type === 'info' && <Info size={18} />}
            </div>
            <div className="toast-content">
              {t.title && <strong className="toast-title">{t.title}</strong>}
              <span className="toast-message">{t.message}</span>
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue['toast'] {
  const context = useContext(ToastContext)
  if (!context) {
    // Fallback safe dummy if used outside provider
    return {
      success: (m) => console.log('[Toast Success]', m),
      error: (m) => console.error('[Toast Error]', m),
      warning: (m) => console.warn('[Toast Warning]', m),
      info: (m) => console.info('[Toast Info]', m),
    }
  }
  return context.toast
}
