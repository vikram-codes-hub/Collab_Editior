import axios from 'axios'
import { API_URL, TOKEN_KEY } from './constants'



const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

/* ── Request interceptor — attach token ───────────────────── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* ── Response interceptor — handle errors ─────────────────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token expired or invalid → redirect to auth
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/auth'
    }

    // Extract error message from backend
    const message =
      error.response?.data?.error   ||
      error.response?.data?.message ||
      error.message                 ||
      'Something went wrong'

    return Promise.reject(new Error(message))
  }
)

export default api