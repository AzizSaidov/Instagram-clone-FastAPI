import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface RouteGuardProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: RouteGuardProps) {
  const accessToken = useAuthStore((state) => state.accessToken)

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function PublicRoute({ children }: RouteGuardProps) {
  const accessToken = useAuthStore((state) => state.accessToken)

  if (accessToken) {
    return <Navigate to="/" replace />
  }

  return children
}
