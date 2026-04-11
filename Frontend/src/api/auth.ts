import api from '../lib/axios'
import type { AuthResponse, LoginInput, RegisterInput } from '../types'

/* ============================================================
   Auth API calls
   ============================================================ */

export const loginApi = async (
  input: LoginInput
): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', input)
  return data
}

export const registerApi = async (
  input: RegisterInput
): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/register', input)
  return data
}

export const logoutApi = async (): Promise<void> => {
  await api.post('/auth/logout')
}

export const getMeApi = async () => {
  const { data } = await api.get('/users/me')
  return data
}