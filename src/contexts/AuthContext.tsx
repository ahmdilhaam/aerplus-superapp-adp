import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getUserFromToken } from '../utils/jwt'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken) {
        try {
          // Try to use stored user data first, then fall back to token data
          let userData: User | null = null
          if (storedUser) {
            userData = JSON.parse(storedUser)
          } else {
            const userFromToken = getUserFromToken(storedToken)
            if (userFromToken) {
              userData = userFromToken
            }
          }
          setToken(storedToken)
          if (userData) {
            setUser(userData)
          }
        } catch (error) {
          console.error('Failed to restore session:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
