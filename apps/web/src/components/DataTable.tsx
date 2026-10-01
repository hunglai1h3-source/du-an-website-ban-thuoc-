import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from './EmptyState'

export interface Column<T> {
  key: string
  header: React.ReactNode
  width?: string | number
  align?: 'left' | 'center' | 'right'
  className?: string
  render?: (item: T, index: number) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T, index: number) => string | number
  loading?: boolean
  skeletonRows?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  currentPage?: number
  totalPages?: number
  pageSize?: number
  totalCount?: number
  onPageChange?: (page: number) => void
  onRowClick?: (item: T) => void
  density?: 'compact' | 'normal'
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  skeletonRows = 5,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription = 'Chưa có bản ghi nào phù hợp với bộ lọc hiện tại.',
  emptyAction,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
  density = 'normal',
  className = '',
}: DataTableProps<T>) {
  const hasPagination =
    currentPage !== undefined &&
    totalPages !== undefined &&
    totalPages > 1 &&
    onPageChange !== undefined

  return (
    <div className={`admin-data-table-container ${density} ${className}`.trim()}>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  className={col.className}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonRows }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="skeleton-row">
                  {columns.map((col, cIdx) => (
                    <td key={`skeleton-cell-${cIdx}`} style={{ textAlign: col.align || 'left' }}>
                      <div className="skeleton-cell" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-cell">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, rIdx) => (
                <tr
                  key={keyExtractor(item, rIdx)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={onRowClick ? 'clickable-row' : ''}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ textAlign: col.align || 'left' }}
                      className={col.className}
                    >
                      {col.render
                        ? col.render(item, rIdx)
                        : (item as Record<string, unknown>)[col.key] !== undefined
                        ? String((item as Record<string, unknown>)[col.key])
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasPagination && (
        <div className="admin-table-pagination">
          <span className="pagination-info">
            Trang <strong>{currentPage}</strong> / {totalPages}
          </span>
          <div className="pagination-buttons">
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={currentPage <= 1 || loading}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={16} />
              <span>Trước</span>
            </button>
            <button
              type="button"
              className="admin-pagination-btn"
              disabled={currentPage >= totalPages || loading}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Trang sau"
            >
              <span>Sau</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
