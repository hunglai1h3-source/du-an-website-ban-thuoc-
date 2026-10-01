import React from 'react'
import type { LucideIcon } from 'lucide-react'

export type StatTone = 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'slate'

export interface StatTrend {
  value: string | number
  isPositive?: boolean
  label?: string
}

export interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>
  tone?: StatTone
  subtext?: string
  trend?: StatTrend
  loading?: boolean
  badge?: string
  onClick?: () => void
  className?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  subtext,
  trend,
  loading = false,
  badge,
  onClick,
  className = '',
}) => {
  const isClickable = !!onClick

  return (
    <div
      className={`admin-stat-card admin-stat-card-${tone} ${isClickable ? 'clickable' : ''} ${className}`.trim()}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className={`stat-card-icon stat-icon-${tone}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        {loading ? (
          <div className="stat-card-skeleton" />
        ) : (
          <div className="stat-card-value-row">
            <span className="stat-card-value">{value}</span>
            {badge && <span className="stat-card-badge">{badge}</span>}
          </div>
        )}

        {(subtext || trend) && (
          <div className="stat-card-footer">
            {trend && (
              <span className={`stat-trend ${trend.isPositive ? 'trend-up' : 'trend-down'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
                {trend.label && <span className="trend-label"> {trend.label}</span>}
              </span>
            )}
            {subtext && <span className="stat-card-subtext">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export interface StatGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export const StatGrid: React.FC<StatGridProps> = ({
  children,
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`admin-stat-grid cols-${columns} ${className}`.trim()}>
      {children}
    </div>
  )
}
