'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Calendar, Users, AlertCircle, Plus, ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { safeSetItem } from '@/lib/storage'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  priority: string
  eventDate?: string
  postedAt: string
}

export default function AnnouncementsBoard({ onBack }: { onBack?: () => void }): React.JSX.Element {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isOfficial, setIsOfficial] = useState<boolean>(false)
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState<boolean>(false)
  const [newAnnouncement, setNewAnnouncement] = useState<{ title: string; content: string; category: 'general' | 'event' | 'alert' | 'emergency'; priority: 'low' | 'medium' | 'high'; eventDate: string }>({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    eventDate: ''
  })

  useEffect(() => {
    fetchAnnouncements()
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('official') : null
      setIsOfficial(!!stored)
    } catch {
      setIsOfficial(false)
    }
    const storageHandler = (e: StorageEvent): void => {
      if (e.key === 'barangay_announcements') {
        fetchAnnouncements()
      }
    }
    const customHandler = (): void => {
      fetchAnnouncements()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', storageHandler)
      window.addEventListener('barangay_announcements_updated', customHandler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', storageHandler)
        window.removeEventListener('barangay_announcements_updated', customHandler as EventListener)
      }
    }
  }, [])

  const fetchAnnouncements = (): void => {
    try {
      setIsLoading(true)
      const stored = localStorage.getItem('barangay_announcements')
      const anns: Announcement[] = stored ? JSON.parse(stored) as Announcement[] : []
      const sorted = anns.sort((a, b) => new Date(b.postedAt || b.eventDate || '').getTime() - new Date(a.postedAt || a.eventDate || '').getTime())
      setAnnouncements(sorted)
    } catch {
      setAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryIcon = (category: string): React.JSX.Element => {
    switch (category) {
      case 'event': return <Users className="h-4 w-4" />
      case 'alert': return <AlertCircle className="h-4 w-4" />
      case 'emergency': return <AlertCircle className="h-4 w-4" />
      case 'general': return <Bell className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'event': return 'bg-blue-100 text-blue-800'
      case 'alert': return 'bg-orange-100 text-orange-800'
      case 'emergency': return 'bg-red-100 text-red-800'
      case 'general': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityBadge = (priority: string): React.JSX.Element => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="ml-2">HIGH PRIORITY</Badge>
      case 'medium':
        return <Badge variant="default" className="ml-2 bg-orange-600">Medium</Badge>
      case 'low':
        return <Badge variant="secondary" className="ml-2">Low</Badge>
      default:
        return <></>
    }
  }

  const handleCreateAnnouncement = (): void => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all required fields')
      return
    }
    const ann: Announcement = {
      id: `ANN-${Date.now()}`,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      category: newAnnouncement.category,
      priority: newAnnouncement.priority,
      eventDate: newAnnouncement.eventDate || undefined,
      postedAt: new Date().toISOString()
    }
    try {
      const existingRaw = localStorage.getItem('barangay_announcements')
      const existing: Announcement[] = existingRaw ? JSON.parse(existingRaw) as Announcement[] : []
      const updated = [ann, ...existing]
      safeSetItem('barangay_announcements', JSON.stringify(updated))
      setAnnouncements(updated)
      toast.success('Announcement created')
      setNewAnnouncement({ title: '', content: '', category: 'general', priority: 'medium', eventDate: '' })
      setShowAnnouncementDialog(false)
      try { window.dispatchEvent(new Event('barangay_announcements_updated')) } catch {}
    } catch {
      toast.error('Failed to save announcement')
    }
  }

  const handleDeleteAnnouncement = (id: string): void => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    const updated = announcements.filter(a => a.id !== id)
    safeSetItem('barangay_announcements', JSON.stringify(updated))
    setAnnouncements(updated)
    try { window.dispatchEvent(new Event('barangay_announcements_updated')) } catch {}
    toast.success('Announcement deleted')
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    return date.toLocaleDateString('en-US', options)
  }

  const countByPriority = (priority: string): number => {
    return announcements.filter((ann: Announcement) => ann.priority === priority).length
  }

  const countByCategory = (category: string): number => {
    return announcements.filter((ann: Announcement) => ann.category === category).length
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Bell className="h-6 w-6" />
              Community Announcements & Updates
            </CardTitle>
            <CardDescription className="text-purple-100">
              Stay informed about barangay events, alerts, and important notices
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 py-8">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2 animate-pulse" />
              <p>Loading announcements...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      )}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Bell className="h-6 w-6" />
            Community Announcements & Updates
          </CardTitle>
          <CardDescription className="text-purple-100">
            Stay informed about barangay events, alerts, and important notices
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isOfficial && (
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowAnnouncementDialog(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </div>
          )}
          {announcements.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No announcements available</p>
              <p className="text-xs mt-1">Check back later for updates from the barangay</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement: Announcement) => (
                <Card key={announcement.id} className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className={getCategoryColor(announcement.category)}>
                            {getCategoryIcon(announcement.category)}
                            <span className="ml-1 capitalize">{announcement.category}</span>
                          </Badge>
                          {getPriorityBadge(announcement.priority)}
                        </div>
                        <CardTitle className="text-xl mb-1">{announcement.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {announcement.eventDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Event Date: {formatDate(announcement.eventDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Bell className="h-4 w-4 text-gray-600" />
                        <span>Posted: {formatDate(announcement.postedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>Post an announcement to inform the community</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="Enter announcement title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea id="content" placeholder="Enter announcement content" value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} rows={6} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={newAnnouncement.category} onValueChange={(value: 'general' | 'event' | 'alert' | 'emergency') => setNewAnnouncement({ ...newAnnouncement, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select value={newAnnouncement.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewAnnouncement({ ...newAnnouncement, priority: value })}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="eventDate">Event Date (Optional)</Label>
              <Input id="eventDate" type="date" value={newAnnouncement.eventDate} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, eventDate: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateAnnouncement} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{countByCategory('event')}</p>
            <p className="text-sm text-gray-600">scheduled events</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{countByPriority('high')}</p>
            <p className="text-sm text-gray-600">urgent notices</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              Total Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{announcements.length}</p>
            <p className="text-sm text-gray-600">active announcements</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
