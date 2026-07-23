import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Mail, Loader, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useLogin } from '../hooks/useLogin'
import { useAuth } from '../contexts/AuthContext'
import { getUserFromToken } from '../utils/jwt'
import { getMeAPI, setAuthTokens } from '../services/api'

export const Login = () => {
  const navigate = useNavigate()
  const { login: authLogin, isAuthenticated } = useAuth()
  const { login, loading: loginLoading, error: loginError } = useLogin()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    companySlug: 'demo',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formData.username.trim()) {
      setFormError('Username is required')
      return
    }
    if (!formData.password.trim()) {
      setFormError('Password is required')
      return
    }

    const response = await login({
      username: formData.username,
      password: formData.password,
      companySlug: formData.companySlug,
    })

    if (response.success && response.data?.accessToken) {
      // Save access + refresh tokens first
      setAuthTokens(response.data.accessToken, response.data.refreshToken)

      const userData = response.data?.user

      // If user data is in response, use it directly
      if (userData) {
        authLogin(response.data.accessToken, userData)

        if (rememberMe) {
          localStorage.setItem('username', formData.username)
        }

        // Show success state
        setLoginSuccess(true)
        // Redirect to dashboard
        setTimeout(() => navigate('/'), 800)
      } else {
        // Try to fetch from API or extract from token
        try {
          const apiUserData = await getMeAPI()
          if (apiUserData) {
            authLogin(response.data.accessToken, apiUserData)
          } else {
            // Fallback: extract from token
            const tokenUser = getUserFromToken(response.data.accessToken)
            if (tokenUser) {
              authLogin(response.data.accessToken, tokenUser)
            } else {
              setFormError('Failed to retrieve user information')
              return
            }
          }

          if (rememberMe) {
            localStorage.setItem('username', formData.username)
          }

          setLoginSuccess(true)
          setTimeout(() => navigate('/'), 800)
        } catch (err) {
          console.error('Failed to fetch user data:', err)
          // Last fallback: extract from token
          const tokenUser = getUserFromToken(response.data.accessToken)
          if (tokenUser) {
            authLogin(response.data.accessToken, tokenUser)

            if (rememberMe) {
              localStorage.setItem('username', formData.username)
            }

            setLoginSuccess(true)
            setTimeout(() => navigate('/'), 800)
          } else {
            setFormError('Failed to retrieve user information')
          }
        }
      }
    } else {
      setFormError(response.error || response.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-secondary-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary-600/20 rounded-full blur-[128px] animate-pulse"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-accent-600/20 rounded-full blur-[128px] animate-pulse delay-1000"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-275 flex flex-col md:flex-row bg-secondary-900/50 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden">
        {/* Left Side: Illustration / Branding */}
        <div className="hidden md:flex md:w-1/2 bg-linear-to-br from-primary-600 via-primary-700 to-primary-950 p-16 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-xl font-black italic text-primary-700">A+</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">AerPlus</h1>
            </div>

            <div className="space-y-6">
              <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
                Master your <br />
                <span className="text-primary-300">Operations</span> <br />
                with ease.
              </h2>
              <p className="text-primary-100/70 text-lg font-medium max-w-sm">
                The most advanced management console for your business ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center bg-white/5 md:bg-transparent">
          <div className="mb-10 block md:hidden">
            <h1 className="text-2xl font-black text-white tracking-widest italic uppercase flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-sm font-black italic">A+</span>
              </div>
              AerPlus
            </h1>
          </div>

          <div className="mb-10">
            <h3 className="text-3xl font-black text-white tracking-tight mb-2">Sign In</h3>
            <p className="text-secondary-400 font-medium text-sm">Enter your credentials to access your account.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-[0.2em] mb-2 ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-secondary-500 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300 font-medium"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-secondary-500 uppercase tracking-[0.2em] mb-2 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-secondary-500 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300 font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between ml-1 text-xs">
              <label className="flex items-center text-secondary-400 font-bold cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded-md border-2 mr-3 flex items-center justify-center transition-all duration-300 ${rememberMe ? 'bg-primary-600 border-primary-600' : 'border-white/10 bg-white/5 group-hover:border-white/30'}`}>
                  {rememberMe && <CheckCircle size={12} className="text-white" />}
                </div>
                <span>Keep me signed in</span>
              </label>
            </div>

            {(formError || loginError) && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-500 animate-in fade-in zoom-in duration-300">
                <div className="shrink-0 w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <span className="font-bold text-sm">!</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-tight">{formError || loginError}</p>
              </div>
            )}

            {loginSuccess && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-500 animate-in fade-in zoom-in duration-300">
                <CheckCircle className="w-5 h-5" />
                <p className="text-xs font-bold uppercase tracking-tight">Login Successful! Redirecting...</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading || loginSuccess}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group ${loginSuccess
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-600/30 active:scale-[0.98]'
                }`}
            >
              {loginLoading ? (
                <Loader className="animate-spin" size={20} />
              ) : loginSuccess ? (
                <>
                  <CheckCircle size={20} />
                  <span>Success</span>
                </>
              ) : (
                <>
                  <span>Log In to Account</span>
                </>
              )}
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none"></div>
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-secondary-500 text-[10px] font-black uppercase tracking-[0.2em]">Don't have an account? <a href="#" className="text-white hover:text-primary-400 transition-colors ml-1 underline underline-offset-4">Contact Admin</a></p>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-secondary-600 text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap hidden sm:block">
        &copy; {new Date().getFullYear()} AerPlus Admin Console
      </p>
    </div>
  )
}

