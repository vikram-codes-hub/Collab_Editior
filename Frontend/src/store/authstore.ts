import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TOKEN_KEY, USER_KEY } from '../lib/constants'
import type { User } from '../types'
import api from '../lib/axios'

/*
   Auth Store — Zustand
   Persisted to localStorage so user stays logged in
   */

interface AuthState {
  token:   string | null
  user:    User   | null
  loading: boolean
  error:   string | null

  // Actions
  login:    (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout:   () => void
  getMe:    () => Promise<void>
  clearError: () => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token:   localStorage.getItem(TOKEN_KEY),
      user:    null,
      loading: false,
      error:   null,

      /*Login*/
      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { data } = await api.post('/auth/login', {
            email,
            password,
          })

          localStorage.setItem(TOKEN_KEY, data.token)

          set({
            token:   data.token,
            user:    data.user,
            loading: false,
            error:   null,
          })
        } catch (err: any) {
          set({
            loading: false,
            error:   err.message || 'Login failed',
          })
          throw err
        }
      },

      /*Register*/
      register: async (username, email, password) => {
        set({ loading: true, error: null })
        try {
          const { data } = await api.post('/auth/register', {
            username,
            email,
            password,
          })

          localStorage.setItem(TOKEN_KEY, data.token)

          set({
            token:   data.token,
            user:    data.user,
            loading: false,
            error:   null,
          })
        } catch (err: any) {
          set({
            loading: false,
            error:   err.message || 'Registration failed',
          })
          throw err
        }
      },

      /*Logout*/
      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        set({ token: null, user: null, error: null })
        window.location.href = '/auth'
      },

      /*Get current user*/
      getMe: async () => {
        const { token } = get()
        if (!token) return

        try {
          const { data } = await api.get('/users/me')
          set({ user: data })
        } catch {
          // Token invalid — logout
          get().logout()
        }
      },

      /*Clear error*/
      clearError: () => set({ error: null }),
    }),
    {
      name:    'depot-auth',
      // Only persist token + user, not loading/error
      partialize: (state) => ({
        token: state.token,
        user:  state.user,
      }),
    }
  )
)

export default useAuthStore