import type { ReactNode } from 'react'
import { InstagramLogo } from './InstagramLogo'

interface AuthShellProps {
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ children, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-ig-bg px-4 py-8 text-ig-text">
      <section className="w-full max-w-[350px]">
        <div className="border border-ig-border bg-ig-surface px-10 py-8">
          <InstagramLogo />
          <div className="mt-8">{children}</div>
        </div>
        <div className="mt-3 border border-ig-border bg-ig-surface px-8 py-5 text-center text-sm">
          {footer}
        </div>
      </section>
    </main>
  )
}
