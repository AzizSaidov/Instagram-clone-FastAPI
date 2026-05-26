import {
  Clapperboard,
  Compass,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  PlusSquare,
  Search,
  Settings,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useWebSocket, type RealtimeEvent } from '../hooks/useWebSocket'
import { useAuthStore } from '../store/authStore'
import { useNotificationsStore } from '../store/notificationsStore'
import type { NotificationItem } from '../types/notifications'
import { NotificationsPanel } from './NotificationsPanel'

const navItems = [
  { label: 'Главная', to: '/', icon: Home },
  { label: 'Reels', to: '/reels', icon: Clapperboard },
  { label: 'Сообщения', to: '/messages', icon: MessageCircle },
  { label: 'Поиск', to: '/search', icon: Search },
  { label: 'Интересное', to: '/explore', icon: Compass },
]

const motion = 'ease-[cubic-bezier(0.2,0,0,1)]'

function sidebarTextClass(isExpanded: boolean) {
  return `pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap text-base transition-[opacity,transform] duration-150 ${motion} ${
    isExpanded
      ? 'translate-x-0 opacity-100 delay-75'
      : '-translate-x-1 opacity-0 delay-0'
  }`
}

function navLinkClass(isActive: boolean, isExpanded: boolean) {
  return `relative flex h-12 items-center rounded-lg transition-[width,background-color] duration-200 ${motion} hover:bg-[#1A1A1A] ${
    isExpanded ? 'w-[220px]' : 'w-12'
  } ${isActive ? 'font-bold' : 'font-normal'}`
}

interface SidebarProps {
  onCreateClick: () => void
}

export function Sidebar({ onCreateClick }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const hasUnreadNotifications = useNotificationsStore((state) => state.hasUnread)
  const loadNotifications = useNotificationsStore(
    (state) => state.loadNotifications,
  )
  const receiveNotification = useNotificationsStore(
    (state) => state.receiveNotification,
  )
  const { subscribe, unsubscribe } = useWebSocket()
  const visibleExpanded = isExpanded && !isNotificationsOpen
  const profilePath = user?.profile.username
    ? `/profile/${user.profile.username}`
    : '/'

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadNotifications])

  useEffect(() => {
    function handleNotification(event: RealtimeEvent) {
      const notification = event.notification as NotificationItem | undefined

      if (notification) {
        receiveNotification(notification)
      }
    }

    subscribe('notification', handleNotification)
    subscribe('new_notification', handleNotification)

    return () => {
      unsubscribe('notification', handleNotification)
      unsubscribe('new_notification', handleNotification)
    }
  }, [receiveNotification, subscribe, unsubscribe])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <aside
      className={`fixed inset-y-0 left-0 z-30 hidden flex-col overflow-y-auto overscroll-contain border-r border-ig-border bg-ig-bg px-3 py-6 text-ig-text transition-[width,box-shadow] duration-200 ${motion} [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden ${
        visibleExpanded
          ? 'w-[244px] shadow-[16px_0_40px_rgba(0,0,0,0.42)]'
          : 'w-[72px] shadow-none'
      }`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsExpanded(false)
        }
      }}
      onFocus={() => {
        if (!isNotificationsOpen) {
          setIsExpanded(true)
        }
      }}
      onMouseEnter={() => {
        if (!isNotificationsOpen) {
          setIsExpanded(true)
        }
      }}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="mb-8 flex h-[96px] shrink-0 items-center justify-center">
        <img
          className="h-11 w-11 shrink-0 rounded-2xl shadow-[0_0_28px_rgba(221,42,123,0.22)]"
          src="/instagram.svg"
          alt="Instagram"
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              className={({ isActive }) => navLinkClass(isActive, isExpanded)}
              key={item.label}
              title={item.label}
              to={item.to}
              onClick={() => setIsNotificationsOpen(false)}
            >
              <Icon
                className="absolute left-3 shrink-0"
                size={24}
                strokeWidth={2}
              />
              <span className={sidebarTextClass(visibleExpanded)}>{item.label}</span>
            </NavLink>
          )
        })}
        <button
          className={navLinkClass(isNotificationsOpen, visibleExpanded)}
          title="Уведомления"
          type="button"
          onClick={() => {
            setIsExpanded(false)
            setIsNotificationsOpen((current) => !current)
          }}
        >
          <Heart
            className="absolute left-3 shrink-0"
            size={24}
            strokeWidth={2}
            fill={isNotificationsOpen ? 'currentColor' : 'none'}
          />
          {hasUnreadNotifications && (
            <span className="absolute left-[31px] top-2 h-2.5 w-2.5 rounded-full border-2 border-ig-bg bg-ig-danger" />
          )}
          <span className={sidebarTextClass(visibleExpanded)}>Уведомления</span>
        </button>
        <button
          className={navLinkClass(false, visibleExpanded)}
          title="Создать"
          type="button"
          onClick={() => {
            setIsExpanded(false)
            setIsNotificationsOpen(false)
            onCreateClick()
          }}
        >
          <PlusSquare
            className="absolute left-3 shrink-0"
            size={24}
            strokeWidth={2}
          />
          <span className={sidebarTextClass(visibleExpanded)}>Создать</span>
        </button>
        <NavLink
          className={({ isActive }) => navLinkClass(isActive, visibleExpanded)}
          title="Профиль"
          onClick={() => setIsNotificationsOpen(false)}
          to={profilePath}
        >
          <User className="absolute left-3 shrink-0" size={24} strokeWidth={2} />
          <span className={sidebarTextClass(visibleExpanded)}>Профиль</span>
        </NavLink>
      </nav>

      <div className="shrink-0 space-y-2 pb-2">
        <details>
          <summary
            className={`relative flex h-12 cursor-pointer list-none items-center rounded-lg text-base transition-[width,background-color] duration-200 ${motion} hover:bg-[#1A1A1A] ${
              visibleExpanded ? 'w-[220px]' : 'w-12'
            }`}
          >
            <Menu className="absolute left-3 shrink-0" size={24} />
            <span className={sidebarTextClass(visibleExpanded)}>Ещё</span>
          </summary>
          <div
            className={`mb-2 mt-1 w-[220px] overflow-hidden rounded-lg border border-ig-border bg-ig-surface p-1 shadow-2xl transition-[opacity,transform] duration-150 ${motion} ${
              visibleExpanded
                ? 'translate-y-0 opacity-100 delay-75'
                : 'pointer-events-none -translate-y-1 opacity-0 delay-0'
            }`}
          >
            <NavLink
              className="flex h-11 items-center gap-3 rounded-md px-3 text-sm transition hover:bg-ig-elevated"
              to="/settings"
            >
              <Settings size={18} />
              <span>Настройки</span>
            </NavLink>
            <button
              className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition hover:bg-ig-elevated"
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Выйти</span>
            </button>
          </div>
        </details>
      </div>
      </aside>
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  )
}
