import React from 'react'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className = '',
  style,
}) => {
  return (
    <div
      className={`admin-skeleton ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  )
}

export interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={`table-skeleton-wrap ${className}`.trim()}>
      <div className="skeleton-header-row">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`head-${i}`} height={16} width={i === 0 ? '40%' : '70%'} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`row-${r}`} className="skeleton-body-row">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={`cell-${r}-${c}`}
              height={14}
              width={c === 0 ? '60%' : c === columns - 1 ? '30%' : '80%'}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export interface CardSkeletonProps {
  count?: number
  columns?: number
  className?: string
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 4,
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`admin-stat-grid cols-${columns} ${className}`.trim()}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`card-skel-${i}`} className="admin-stat-card skeleton-card">
          <div className="stat-card-header">
            <Skeleton width="50%" height={14} />
            <Skeleton width={32} height={32} borderRadius={8} />
          </div>
          <div className="stat-card-body" style={{ marginTop: '12px' }}>
            <Skeleton width="40%" height={26} />
            <Skeleton width="70%" height={12} style={{ marginTop: '8px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
