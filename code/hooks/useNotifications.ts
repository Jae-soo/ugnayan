'use client'

import { useState, useEffect, useCallback } from 'react'

export type NotificationItem = {
  id: string
  type: string
  entityId: string
  message: string
  createdAt: number
  read: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('resident_user')
      if (!storedUser) return

      const user = JSON.parse(storedUser)
      // Prefer email as it is more reliable for matching with official dashboard data
      const identifier = user.email || user.username
      if (!identifier) return

      setLoading(true)
      const res = await fetch(`/api/notifications?username=${encodeURIComponent(identifier)}`)
      const data = await res.json()

      if (data.success) {
        setNotifications(data.notifications.map((n: any) => ({
          id: n._id,
          type: n.type,
          entityId: n.relatedId || n.link || '',
          message: n.message,
          createdAt: new Date(n.createdAt).getTime(),
          read: n.read
        })))
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true })
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      fetchNotifications() // Revert on error
    }
  }

  const markAllRead = async () => {
    try {
      const storedUser = localStorage.getItem('resident_user')
      if (!storedUser) return
      const user = JSON.parse(storedUser)
      const identifier = user.email || user.username

      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, username: identifier })
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      fetchNotifications()
    }
  }

  const clearAll = async () => {
    try {
      const storedUser = localStorage.getItem('resident_user')
      if (!storedUser) return
      const user = JSON.parse(storedUser)
      const identifier = user.email || user.username

      // Optimistic update
      setNotifications([])

      await fetch(`/api/notifications?username=${encodeURIComponent(identifier)}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Failed to clear notifications:', error)
      fetchNotifications()
    }
  }

  return {
    notifications,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    clearAll
  }
}
