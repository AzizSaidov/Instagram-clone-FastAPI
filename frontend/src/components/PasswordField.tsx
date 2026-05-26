import { useState } from 'react'

interface PasswordFieldProps {
  id: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function PasswordField({
  id,
  value,
  disabled = false,
  onChange,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        className="auth-input pr-20"
        type={isVisible ? 'text' : 'password'}
        value={value}
        placeholder="Пароль"
        autoComplete={id === 'login-password' ? 'current-password' : 'new-password'}
        disabled={disabled}
        aria-label="Пароль"
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-ig-text transition hover:text-ig-muted"
          type="button"
          disabled={disabled}
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? 'Скрыть' : 'Показать'}
        </button>
      )}
    </div>
  )
}
