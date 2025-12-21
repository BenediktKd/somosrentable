import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = Cookies.get('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })
          const { access } = response.data
          Cookies.set('access_token', access)
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout user
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login/', { email, password })
    return response.data
  },

  register: async (data: {
    email: string
    password: string
    password_confirm: string
    first_name?: string
    last_name?: string
    phone?: string
  }) => {
    const response = await api.post('/auth/register/', data)
    return response.data
  },

  logout: async () => {
    const refreshToken = Cookies.get('refresh_token')
    await api.post('/auth/logout/', { refresh: refreshToken })
    Cookies.remove('access_token')
    Cookies.remove('refresh_token')
  },

  getProfile: async () => {
    const response = await api.get('/auth/me/')
    return response.data
  },

  updateProfile: async (data: { first_name?: string; last_name?: string; phone?: string }) => {
    const response = await api.patch('/auth/me/', data)
    return response.data
  },
}

// Projects API
export const projectsApi = {
  getAll: async (params?: { featured?: boolean }) => {
    const response = await api.get('/projects/', { params })
    return response.data
  },

  getBySlug: async (slug: string) => {
    const response = await api.get(`/projects/${slug}/`)
    return response.data
  },

  calculateReturn: async (slug: string, amount: number) => {
    const response = await api.post(`/projects/${slug}/calculate-return/`, { amount })
    return response.data
  },
}

// Reservations API
export const reservationsApi = {
  create: async (data: {
    email: string
    name?: string
    phone?: string
    project_id: string
    amount: number
  }) => {
    const response = await api.post('/reservations/', data)
    return response.data
  },

  getByToken: async (token: string) => {
    const response = await api.get(`/reservations/${token}/`)
    return response.data
  },

  getMine: async () => {
    const response = await api.get('/reservations/my/')
    return response.data
  },

  convert: async (token: string) => {
    const response = await api.post(`/reservations/${token}/convert/`)
    return response.data
  },
}

// KYC API
export const kycApi = {
  getStatus: async () => {
    const response = await api.get('/kyc/status/')
    return response.data
  },

  submit: async (data: FormData) => {
    const response = await api.post('/kyc/submit/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// Investments API
export const investmentsApi = {
  getAll: async () => {
    const response = await api.get('/investments/')
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/investments/${id}/`)
    return response.data
  },

  create: async (data: { project_id: string; amount: number }) => {
    const response = await api.post('/investments/create/', data)
    return response.data
  },

  getProjection: async (id: string) => {
    const response = await api.get(`/investments/${id}/projection/`)
    return response.data
  },
}

// Payments API
export const paymentsApi = {
  uploadProof: async (data: FormData) => {
    const response = await api.post('/payments/proof/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Admin endpoints
  getPending: async () => {
    const response = await api.get('/payments/pending/')
    return response.data
  },

  review: async (id: string, data: { action: 'approve' | 'reject'; rejection_reason?: string }) => {
    const response = await api.post(`/payments/${id}/review/`, data)
    return response.data
  },
}

// Leads API (Admin)
export const leadsApi = {
  getAll: async (params?: { status?: string }) => {
    const response = await api.get('/leads/', { params })
    return response.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/leads/${id}/`)
    return response.data
  },

  updateStatus: async (id: string, data: { status: string; notes?: string }) => {
    const response = await api.patch(`/leads/${id}/`, data)
    return response.data
  },
}

// Admin KYC API
export const adminKycApi = {
  getPending: async () => {
    const response = await api.get('/kyc/pending/')
    return response.data
  },

  review: async (id: string, data: { action: 'approve' | 'reject'; rejection_reason?: string }) => {
    const response = await api.post(`/kyc/${id}/review/`, data)
    return response.data
  },
}

// Statistics API (Admin)
export const statisticsApi = {
  getPlatform: async () => {
    const response = await api.get('/statistics/platform/')
    return response.data
  },

  getExecutives: async () => {
    const response = await api.get('/statistics/executives/')
    return response.data
  },
}

// Admin Projects API
export const adminProjectsApi = {
  create: async (data: FormData) => {
    const response = await api.post('/projects/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  update: async (slug: string, data: FormData) => {
    const response = await api.patch(`/projects/${slug}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  delete: async (slug: string) => {
    await api.delete(`/projects/${slug}/`)
  },
}

export default api
