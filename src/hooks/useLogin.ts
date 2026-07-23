import { useState } from 'react'
import { loginAPI, type LoginRequest, type LoginResponse } from '../services/api'

export const useLogin = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    setLoading(true)
    setError(null)

    try {
      const response = await loginAPI(credentials)

      if (!response.success && response.error) {
        setError(response.error)
      }

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      return {
        success: false,
        error: errorMessage,
      }
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}
