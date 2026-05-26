import { useCallback, useEffect, useRef, useState } from 'react'
import { BASE_URL } from '../api/client'

export interface RealtimeEvent {
  type: string
  [key: string]: unknown
}

export type RealtimeEventHandler = (event: RealtimeEvent) => void

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const manuallyClosedRef = useRef(false)
  const subscribersRef = useRef(new Map<string, Set<RealtimeEventHandler>>())
  const connectRef = useRef<() => void>(() => undefined)
  const [isConnected, setIsConnected] = useState(false)

  const notify = useCallback((event: RealtimeEvent) => {
    const typedHandlers = subscribersRef.current.get(event.type)
    const wildcardHandlers = subscribersRef.current.get('*')

    typedHandlers?.forEach((handler) => handler(event))
    wildcardHandlers?.forEach((handler) => handler(event))
  }, [])

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token')

    if (!token || socketRef.current) {
      return
    }

    const wsBaseUrl = BASE_URL.replace(/^http/, 'ws')
    const socket = new WebSocket(
      `${wsBaseUrl}/ws/?token=${encodeURIComponent(token)}`,
    )

    socketRef.current = socket

    socket.addEventListener('open', () => {
      setIsConnected(true)
    })

    socket.addEventListener('message', (message) => {
      try {
        const event = JSON.parse(message.data) as RealtimeEvent
        const backendEvent = event.event

        if (!event.type && typeof backendEvent === 'string') {
          event.type = backendEvent
        }

        if (event.type) {
          notify(event)
        }
      } catch {
        // Ignore malformed real-time payloads so the socket stays alive.
      }
    })

    socket.addEventListener('error', () => {
      socket.close()
    })

    socket.addEventListener('close', () => {
      socketRef.current = null
      setIsConnected(false)

      if (!manuallyClosedRef.current) {
        reconnectTimerRef.current = window.setTimeout(() => {
          connectRef.current()
        }, 3000)
      }
    })
  }, [notify])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    manuallyClosedRef.current = false
    connect()

    return () => {
      manuallyClosedRef.current = true

      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current)
      }

      socketRef.current?.close()
      socketRef.current = null
    }
  }, [connect])

  const subscribe = useCallback(
    (type: string, handler: RealtimeEventHandler) => {
      const handlers = subscribersRef.current.get(type) ?? new Set()
      handlers.add(handler)
      subscribersRef.current.set(type, handlers)
    },
    [],
  )

  const unsubscribe = useCallback(
    (type: string, handler: RealtimeEventHandler) => {
      const handlers = subscribersRef.current.get(type)

      if (!handlers) {
        return
      }

      handlers.delete(handler)

      if (handlers.size === 0) {
        subscribersRef.current.delete(type)
      }
    },
    [],
  )

  return { subscribe, unsubscribe, isConnected }
}
