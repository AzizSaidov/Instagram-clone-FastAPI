import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { RefreshResponse } from '../types/auth'

export const BASE_URL = 'http://localhost:8000'

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      const refresh = localStorage.getItem('refresh_token')

      if (refresh) {
        try {
          originalRequest._retry = true
          const { data } = await axios.post<RefreshResponse>(
            `${BASE_URL}/users/refresh/`,
            { refresh_token: refresh },
          )

          localStorage.setItem('access_token', data.access_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`

          return api.request(originalRequest)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api
