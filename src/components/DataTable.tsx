import type { Column } from '../types'

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
}

export const DataTable = <T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
}: DataTableProps<T>) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-secondary-200/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-secondary-50 bg-secondary-50/30">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-50/50">
            {data.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-secondary-50/50 transition-all duration-300 group ${onRowClick ? 'cursor-pointer' : ''
                  }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-8 py-5 text-sm text-secondary-600 group-hover:text-primary-600 transition-colors duration-300 ${column.className || ''}`}
                  >
                    {column.render ? (
                      column.render(row)
                    ) : (
                      <span className="font-semibold">{String(row[column.key as keyof T])}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="px-8 py-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-[2rem] bg-secondary-50 flex items-center justify-center text-secondary-300 mb-6 border-2 border-dashed border-secondary-100 group">
            <svg className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </div>
          <h4 className="text-lg font-extrabold text-secondary-900 tracking-tight">No data available</h4>
          <p className="text-sm text-secondary-500 font-medium mt-1">There are no records to display at this time.</p>
        </div>
      )}
    </div>
  )
}
