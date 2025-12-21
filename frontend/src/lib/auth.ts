import { create } from 'zustand'
import Cookies from 'js-cookie'
import { authApi } from './api'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: 'investor' | 'executive' | 'admin'
  is_kyc_verified: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    password_confirm: string
    first_name?: string
    last_name?: string
    phone?: string
  }) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    Cookies.set('access_token', response.access, { expires: 1 })
    Cookies.set('refresh_token', response.refresh, { expires: 7 })
    await get().fetchUser()
  },

  register: async (data) => {
    const response = await authApi.register(data)
    Cookies.set('access_token', response.tokens.access, { expires: 1 })
    Cookies.set('refresh_token', response.tokens.refresh, { expires: 7 })
    set({ user: response.user, isAuthenticated: true, isLoading: false })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore errors on logout
    }
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    const token = Cookies.get('access_token')
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }

    try {
      const user = await authApi.getProfile()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },
}))
