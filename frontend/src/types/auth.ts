export interface Profile {
  id: number
  user_id?: number
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  is_private: boolean
}

export interface MeUser {
  id: number
  phone_number: string
  created_at?: string
  profile: Profile
}

export interface MeResponse {
  user: MeUser
}

export interface LoginPayload {
  login: string
  password: string
}

export interface RegisterPayload {
  phone_number: string
  username: string
  password: string
}

export interface RegisterResponse {
  user: MeUser
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RefreshResponse {
  access_token: string
  token_type: string
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
}
