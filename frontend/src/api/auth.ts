import api from './client'
import type {
  ChangePasswordPayload,
  LoginPayload,
  MeResponse,
  RegisterPayload,
  RegisterResponse,
  TokenResponse,
} from '../types/auth'

export async function loginRequest(payload: LoginPayload) {
  const { data } = await api.post<TokenResponse>('/users/login/', payload)
  return data
}

export async function registerRequest(payload: RegisterPayload) {
  const { data } = await api.post<RegisterResponse>(
    '/users/register/',
    payload,
  )
  return data
}

export async function getMeRequest() {
  const { data } = await api.get<MeResponse>('/profiles/me/')
  return data
}

export async function changePasswordRequest(payload: ChangePasswordPayload) {
  const { data } = await api.put('/users/change-password/', payload)
  return data
}
