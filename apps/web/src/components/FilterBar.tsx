import React from 'react'
import { RotateCw, Search, X } from 'lucide-react'

export interface FilterBarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onRefresh?: () => void
  isRefreshing?: boolean
  totalCount?: number
  filteredCount?: number
  unitLabel?: string
  children?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  onRefresh,
  isRefreshing = false,
  totalCount,
  filteredCount,
  unitLabel = 'bản ghi',
  children,
  actions,
  className = '',
}) => {
  return (
    <div className={`admin-filter-bar ${className}`.trim()}>
      <div className="filter-bar-main">
        {onSearchChange !== undefined && (
          <div className="filter-search-input-wrap">
            <Search size={16} className="filter-search-icon" />
            <input
              type="text"
              className="filter-search-input"
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
            />
            {searchValue ? (
              <button
                type="button"
                className="filter-search-clear"
                onClick={() => onSearchChange('')}
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        )}

        {children && <div className="filter-bar-controls">{children}</div>}
      </div>

      <div className="filter-bar-meta">
        {totalCount !== undefined && (
          <div className="filter-count-badge">
            {filteredCount !== undefined && filteredCount !== totalCount ? (
              <span>
                Hiển thị <strong>{filteredCount}</strong> / {totalCount} {unitLabel}
              </span>
            ) : (
              <span>
                Tổng cộng <strong>{totalCount}</strong> {unitLabel}
              </span>
            )}
          </div>
        )}

        {actions && <div className="filter-bar-actions">{actions}</div>}

        {onRefresh && (
          <button
            type="button"
            className="admin-icon-button filter-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Làm mới dữ liệu"
          >
            <RotateCw size={15} className={isRefreshing ? 'spin' : ''} />
          </button>
        )}
      </div>
    </div>
  )
}
