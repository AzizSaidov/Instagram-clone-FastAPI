import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { PasswordField } from '../components/PasswordField'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const error = useAuthStore((state) => state.error)
  const isLoading = useAuthStore((state) => state.isLoading)
  const loginUser = useAuthStore((state) => state.login)
  const clearError = useAuthStore((state) => state.clearError)
  const canSubmit = login.trim().length > 0 && password.length > 0

  useEffect(() => {
    clearError()
  }, [clearError])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit || isLoading) {
      return
    }

    try {
      await loginUser({ login: login.trim(), password })
      navigate('/', { replace: true })
    } catch {
      setPassword('')
    }
  }

  return (
    <AuthShell
      footer={
        <p>
          Нет аккаунта?{' '}
          <Link className="font-semibold text-ig-primary" to="/register">
            Создать аккаунт
          </Link>
        </p>
      }
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="auth-input"
          type="text"
          value={login}
          placeholder="Номер телефона или имя пользователя"
          autoComplete="username"
          disabled={isLoading}
          aria-label="Номер телефона или имя пользователя"
          onChange={(event) => setLogin(event.target.value)}
        />
        <PasswordField
          id="login-password"
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
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <div className="my-5 flex items-center gap-4 text-xs font-semibold uppercase text-ig-faint">
        <span className="h-px flex-1 bg-ig-border" />
        <span>или</span>
        <span className="h-px flex-1 bg-ig-border" />
      </div>
      <Link
        className="block text-center text-sm font-semibold text-ig-primary"
        to="/register"
      >
        Создать аккаунт
      </Link>
    </AuthShell>
  )
}
