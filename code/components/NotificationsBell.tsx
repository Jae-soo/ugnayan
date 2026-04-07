'use client'
import React from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type NotificationItem = {
  id: string
  type: 'ServiceRequest' | 'Report' | 'Announcement' | 'Reply' | 'System' | string
  entityId: string
  message: string
  createdAt: number
  read: boolean
}

interface Props {
  notifications: NotificationItem[]
  onMarkAllRead: () => void
  onClearAll: () => void
  onOpenCenter: () => void
}

export default function NotificationsBell({ notifications, onMarkAllRead, onClearAll, onOpenCenter }: Props): React.JSX.Element {
  const unread = notifications.filter(n => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-green-700">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center animate-pulse">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 shadow-2xl border-green-100">
        <DropdownMenuLabel className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-800">Notifications</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">{unread} New</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onMarkAllRead} className="flex-1 h-8 text-xs">Mark read</Button>
            <Button variant="outline" size="sm" onClick={onClearAll} className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50">Clear</Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-6 py-10 text-center space-y-2">
              <Bell className="h-10 w-10 text-gray-200 mx-auto" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <DropdownMenuItem 
                key={n.id} 
                className={`flex flex-col items-start p-4 cursor-pointer transition-colors ${n.read ? 'opacity-70' : 'bg-green-50/30'}`}
                onClick={onOpenCenter}
              >
                <div className="w-full flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 h-4 uppercase tracking-wider">{n.type}</Badge>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className={`text-sm leading-tight ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.message}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <Button 
          variant="ghost" 
          className="w-full h-10 text-green-700 font-bold text-sm hover:bg-green-50 rounded-none"
          onClick={onOpenCenter}
        >
          Open Notification Center
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
