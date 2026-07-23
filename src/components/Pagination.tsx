import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Get visible pages (max 5)
  const getVisiblePages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)

    if (currentPage <= 3) return [1, 2, 3, 4, 5]
    if (currentPage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]

    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]
  }

  const pages = getVisiblePages()

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-secondary-500 bg-secondary-50 hover:bg-white hover:text-primary-600 border-2 border-transparent hover:border-primary-100 rounded-xl sm:rounded-2xl transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed group shadow-sm hover:shadow-lg hover:shadow-primary-100/50"
        title="Previous page"
      >
        <ChevronLeft size={20} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <div className="flex items-center gap-1 p-1 bg-secondary-50 rounded-[1rem] sm:rounded-[1.25rem]">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 px-1 sm:px-2 rounded-lg sm:rounded-[1rem] font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 ${page === currentPage
              ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
              : 'text-secondary-400 hover:text-secondary-900 hover:bg-white'
              }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-secondary-500 bg-secondary-50 hover:bg-white hover:text-primary-600 border-2 border-transparent hover:border-primary-100 rounded-xl sm:rounded-2xl transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed group shadow-sm hover:shadow-lg hover:shadow-primary-100/50"
        title="Next page"
      >
        <ChevronRight size={20} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  )
}
