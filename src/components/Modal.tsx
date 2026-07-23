import React from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidthClassName?: string
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidthClassName = 'max-w-lg' }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />

      {/* Modal Content */}
      <div className={`relative z-50 bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.3)] ${maxWidthClassName} w-full overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-10 sm:slide-in-from-bottom-0 duration-500 ease-out border border-white/20`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-6 sm:py-8 border-b border-secondary-50 bg-gradient-to-r from-white to-secondary-50/30">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-secondary-900 tracking-tight">{title}</h2>
            <div className="h-1 w-8 bg-primary-500 rounded-full mt-1"></div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-3 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all duration-300 group"
            title="Close"
          >
            <X size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-10 py-6 sm:py-8 max-h-[85vh] overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  )
}
