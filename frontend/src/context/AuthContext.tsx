import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/lib/api'
import { User, RegisterRequest, LoginRequest, ApiResponse } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      refreshUser()
    }
    setLoading(false)
  }, [])

  const refreshUser = async () => {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/me')
      if (response.data.success && response.data.data) {
        setUser(response.data.data)
        localStorage.setItem('user', JSON.stringify(response.data.data))
      }
    } catch {
      logout()
    }
  }

  const login = async (data: LoginRequest) => {
    try {
      setError(null)
      const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data)
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(typeof err === 'object' && err && 'response' in err && 
        (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Login failed')
      throw err
    }
  }

  const register = async (data: RegisterRequest) => {
    try {
      setError(null)
      const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data)
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
      }
    } catch (err: unknown) {
      setError(typeof err === 'object' && err && 'response' in err && 
        (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Registration failed')
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
