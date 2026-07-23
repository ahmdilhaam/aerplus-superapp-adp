import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface Option {
  id: string
  name: string
}

interface MultiSelectProps {
  options: Option[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  placeholder?: string
  label?: string
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedIds,
  onChange,
  placeholder = 'Select options...',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOptions = options.filter((opt) => selectedIds.includes(opt.id))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (optionId: string) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId))
    } else {
      onChange([...selectedIds, optionId])
    }
  }

  const handleRemoveTag = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedIds.filter((id) => id !== optionId))
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white cursor-pointer flex items-center justify-between min-h-12"
      >
        <div className="flex flex-wrap gap-2 flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <div key={option.id} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm">
                <span>{option.name}</span>
                <button
                  onClick={(e) => handleRemoveTag(option.id, e)}
                  className="ml-1 hover:text-indigo-900 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
          {options.length > 0 ? (
            options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => handleToggle(option.id)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                />
                <span className="text-gray-700">{option.name}</span>
              </label>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-gray-500 text-sm">No options available</div>
          )}
        </div>
      )}
    </div>
  )
}
