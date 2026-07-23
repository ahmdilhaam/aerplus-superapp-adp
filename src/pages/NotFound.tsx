import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '../components/Button'

export const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 Header */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <p className="text-xl font-semibold text-gray-600">Page Not Found</p>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-base">
          Sorry, the page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center pt-4">
          <Button variant="primary" onClick={() => navigate('/')}>
            <Home size={18} className="inline mr-2" />
            Back to Dashboard
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>

        {/* Decorative Element */}
        <div className="pt-8">
          <svg
            className="w-32 h-32 mx-auto text-gray-300 opacity-50"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zm-2-9a9 9 0 00-9 9v7a2 2 0 104 0v-7a5 5 0 1110 0v7a2 2 0 104 0V8a9 9 0 00-9-9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
