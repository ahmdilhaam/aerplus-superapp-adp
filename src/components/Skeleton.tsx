import React from 'react'

interface SkeletonProps {
  className?: string
  count?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 animate-pulse rounded ${className}`}
        />
      ))}
    </>
  )
}

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="px-6 py-4">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, colIdx) => (
                <Skeleton key={colIdx} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
