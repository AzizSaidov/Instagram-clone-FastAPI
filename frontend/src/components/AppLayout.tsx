import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { CreateModal } from './CreateModal'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../store/authStore'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const loadMe = useAuthStore((state) => state.loadMe)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (accessToken && !user) {
      void loadMe().catch(() => undefined)
    }
  }, [accessToken, loadMe, user])

  return (
    <div className="min-h-svh overflow-x-hidden bg-ig-bg text-ig-text">
      <Sidebar onCreateClick={() => setIsCreateOpen(true)} />
      <div className="lg:pl-[72px]">{children}</div>
      <CreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  )
}
