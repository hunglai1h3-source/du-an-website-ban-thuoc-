import React from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`admin-empty-state empty-state ${className}`.trim()}>
      <div className="empty-state-icon-wrap">
        <Icon size={34} className="empty-state-icon" />
      </div>
      <strong className="empty-state-title">{title}</strong>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
