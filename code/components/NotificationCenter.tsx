'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Trash2, CheckCircle2, MessageSquare, AlertTriangle, FileText, X, Info } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  relatedId?: string
  link?: string
  read: boolean
  createdAt: string
}

export default function NotificationCenter({ residentUser, onBack, onNavigate }: { residentUser: any; onBack?: () => void; onNavigate?: (tab: string) => void }): React.JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const identifiers = [
        residentUser.email,
        residentUser.phone,
        residentUser.fullName,
        residentUser.id
      ].filter(Boolean) as string[]

      const results = await Promise.all(identifiers.map(async (id) => {
        const res = await fetch(`/api/notifications?username=${encodeURIComponent(id)}`)
        const data = await res.json()
        return data.success ? data.notifications : []
      }))

      // Flatten and remove duplicates by _id
      const all = results.flat()
      const unique = Array.from(new Map(all.map(n => [n._id, n])).values())
      
      // Sort by date descending
      unique.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setNotifications(unique as Notification[])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast.error('Could not load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (residentUser) {
      fetchNotifications()
    }
  }, [residentUser])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true })
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id))
        toast.success('Notification deleted')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return

    try {
      const identifiers = [
        residentUser.email,
        residentUser.phone,
        residentUser.fullName,
        residentUser.id
      ].filter(Boolean) as string[]

      await Promise.all(identifiers.map(id => 
        fetch(`/api/notifications?username=${encodeURIComponent(id)}`, { method: 'DELETE' })
      ))
      
      setNotifications([])
      toast.success('All notifications cleared')
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast.error('Failed to clear notifications')
    }
  }

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'reply': return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'report': return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'servicerequest': return <FileText className="h-5 w-5 text-indigo-500" />
      default: return <Bell className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 hover:bg-white/50">
          <X className="h-4 w-4" />
          Close Notification Center
        </Button>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3">
                <Bell className="h-8 w-8" />
                Notification Center
              </CardTitle>
              <CardDescription className="text-green-100 mt-2 text-lg">
                Stay updated with replies and announcements from Barangay Irisan
              </CardDescription>
            </div>
            <Badge className="bg-white/20 hover:bg-white/30 text-white text-lg px-4 py-1">
              {notifications.filter(n => !n.read).length} New
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="text-gray-500 font-medium">Loading your notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center px-6">
                <div className="bg-gray-100 p-6 rounded-full">
                  <Bell className="h-16 w-16 text-gray-300" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-700">No Notifications</h3>
                  <p className="text-gray-500 mt-2 max-w-sm">
                    You're all caught up! New updates from officials will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <div 
                    key={notif._id} 
                    className={`p-6 transition-all hover:bg-green-50/30 group relative ${!notif.read ? 'bg-green-50/50 border-l-4 border-l-green-600' : ''}`}
                    onClick={() => !notif.read && markAsRead(notif._id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${!notif.read ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-bold text-lg truncate ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-sm text-gray-400 whitespace-nowrap ml-4">
                            {new Date(notif.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className={`text-base leading-relaxed mb-3 ${!notif.read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-3">
                          {!notif.read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-100 h-8 px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif._id);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark Read
                            </Button>
                          )}
                          {notif.link && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-8 px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigate) {
                                  // Map /services -> services, /reports -> report
                                  const tab = notif.link?.replace('/', '') === 'reports' ? 'report' : 'services';
                                  onNavigate(tab);
                                } else if (notif.link) {
                                  window.location.href = notif.link;
                                }
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif._id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700 leading-relaxed">
          <strong>Tip:</strong> Notifications are synced to the cloud. You can access your full conversation history with officials in the 
          <strong> Services &gt; My Requests</strong> tab at any time.
        </p>
      </div>
    </div>
  )
}
