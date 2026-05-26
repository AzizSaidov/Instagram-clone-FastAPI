import { create } from 'zustand'
import { getMeRequest, loginRequest, registerRequest } from '../api/auth'
import type { LoginPayload, MeUser, RegisterPayload } from '../types/auth'
import { getApiError } from '../utils/apiError'

interface AuthState {
  user: MeUser | null
  accessToken: string | null
  isLoading: boolean
  error: string | null
  login: (payload: LoginPayload) => Promise<void>
  registerAndLogin: (payload: RegisterPayload) => Promise<void>
  loadMe: () => Promise<void>
  logout: () => void
  clearError: () => void
}

function getStoredAccessToken() {
  return localStorage.getItem('access_token')
}

function persistTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: getStoredAccessToken(),
  isLoading: false,
  error: null,

  login: async (payload) => {
    set({ isLoading: true, error: null })

    try {
      const tokens = await loginRequest(payload)
      persistTokens(tokens.access_token, tokens.refresh_token)
      set({ accessToken: tokens.access_token, error: null })
    } catch (error) {
      const message = getApiError(error)
      set({ error: message })
      throw new Error(message, { cause: error })
    } finally {
      set({ isLoading: false })
    }
  },

  registerAndLogin: async (payload) => {
    set({ isLoading: true, error: null })

    try {
      await registerRequest(payload)
      const tokens = await loginRequest({
        login: payload.username,
        password: payload.password,
      })
      persistTokens(tokens.access_token, tokens.refresh_token)
      set({ accessToken: tokens.access_token, error: null })
    } catch (error) {
      const message = getApiError(error)
      set({ error: message })
      throw new Error(message, { cause: error })
    } finally {
      set({ isLoading: false })
    }
  },

  loadMe: async () => {
    if (!get().accessToken) {
      return
    }

    set({ isLoading: true, error: null })

    try {
      const { user } = await getMeRequest()
      set({ user })
    } catch (error) {
      const message = getApiError(error)
      set({ error: message })
      get().logout()
      throw new Error(message, { cause: error })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ accessToken: null, user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))
