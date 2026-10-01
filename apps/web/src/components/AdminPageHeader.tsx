import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  badge?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  badge,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={`admin-page-header ${className}`.trim()}>
      <div className="admin-page-header-content">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="admin-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1
              return (
                <React.Fragment key={crumb.label + idx}>
                  {idx > 0 && <ChevronRight size={12} className="breadcrumb-separator" />}
                  {crumb.href && !isLast ? (
                    <Link to={crumb.href} className="breadcrumb-link">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`breadcrumb-item ${isLast ? 'breadcrumb-current' : ''}`}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
        )}

        {eyebrow && !breadcrumbs && <div className="admin-eyebrow">{eyebrow}</div>}

        <div className="admin-title-row">
          <h1 className="admin-page-title">{title}</h1>
          {badge && <div className="admin-page-badge">{badge}</div>}
        </div>

        {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="admin-page-actions">{actions}</div>}
    </div>
  )
}
