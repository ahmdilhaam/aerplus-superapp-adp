import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { Header } from '../components/Header'

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-64 w-full">
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden pt-20 bg-secondary-50/50">
          <div className="container mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
