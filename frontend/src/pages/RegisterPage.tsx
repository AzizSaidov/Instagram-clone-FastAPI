import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { PasswordField } from '../components/PasswordField'
import { useAuthStore } from '../store/authStore'

export function RegisterPage() {
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const error = useAuthStore((state) => state.error)
  const isLoading = useAuthStore((state) => state.isLoading)
  const registerAndLogin = useAuthStore((state) => state.registerAndLogin)
  const clearError = useAuthStore((state) => state.clearError)
  const canSubmit =
    phoneNumber.trim().length > 0 &&
    username.trim().length > 0 &&
    password.length > 0

  useEffect(() => {
    clearError()
  }, [clearError])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit || isLoading) {
      return
    }

    try {
      await registerAndLogin({
        phone_number: phoneNumber.trim(),
        username: username.trim(),
        password,
      })
      navigate('/', { replace: true })
    } catch {
      setPassword('')
    }
  }

  return (
    <AuthShell
      footer={
        <p>
          Уже есть аккаунт?{' '}
          <Link className="font-semibold text-ig-primary" to="/login">
            Войти
          </Link>
        </p>
      }
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="auth-input"
          type="tel"
          value={phoneNumber}
          placeholder="Номер телефона"
          autoComplete="tel"
          disabled={isLoading}
          aria-label="Номер телефона"
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
        <input
          className="auth-input"
          type="text"
          value={username}
          placeholder="Имя пользователя"
          autoComplete="username"
          disabled={isLoading}
          aria-label="Имя пользователя"
          onChange={(event) => setUsername(event.target.value)}
        />
        <PasswordField
          id="register-password"
          value={password}
          disabled={isLoading}
          onChange={setPassword}
        />
        {error && (
          <p className="rounded-sm border border-ig-danger/50 bg-ig-danger/10 px-3 py-2 text-center text-xs leading-5 text-ig-text">
            {error}
          </p>
        )}
        <button
          className="h-8 w-full rounded-lg bg-ig-primary text-sm font-semibold text-white transition hover:bg-[#1877F2] disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={!canSubmit || isLoading}
        >
          {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
    </AuthShell>
  )
}
