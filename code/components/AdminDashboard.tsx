'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Bell,
  Plus,
  Search,
  Download,
  RefreshCw,
  Eye,
  UserCheck,
  Activity,
  Trash2,
  Link as LinkIcon
} from 'lucide-react'
import type { ServiceRequest, Report } from '@/lib/types'
import { getServiceRequests, updateServiceRequestStatus, getReports, updateReportStatus, safeSetItem } from '@/lib/storage'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'

interface AdminDashboardProps {
  officialInfo: {
    name: string
    role: string
    username: string
    id?: string
  }
}

interface Announcement {
  id: string
  title: string
  content: string
  category: 'general' | 'event' | 'alert' | 'emergency'
  priority: 'low' | 'medium' | 'high'
  eventDate?: string
  postedAt: string
}

interface UserData {
  id: string
  fullName: string
  email: string
  phone: string
  address: string
  registeredAt: string
  status: 'active' | 'inactive'
}

export default function AdminDashboard({ officialInfo }: AdminDashboardProps): React.JSX.Element {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState<boolean>(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'general' as 'general' | 'event' | 'alert' | 'emergency',
    priority: 'medium' as 'low' | 'medium' | 'high',
    eventDate: ''
  })
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState<string>('')
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalReports: 0,
    urgentReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    activeUsers: 0
  })

  

  const loadData = async (): Promise<void> => {
    const localRequests = getServiceRequests()
    const localReports = getReports()
    let remoteRequests: ServiceRequest[] = []
    let remoteReports: Report[] = []

    try {
      const [reqRes] = await Promise.all([
        fetch('/api/service-request')
      ])
      if (reqRes.ok) {
        const reqJson = await reqRes.json()
        const apiRequests = (reqJson.requests || []) as Array<{ _id: string; residentName: string; residentEmail: string; residentPhone: string; residentAddress?: string; documentType?: string; type?: string; purpose?: string; status: ServiceRequest['status']; createdAt: string; additionalInfo?: string }>
        
        const allUnified = apiRequests.map((r) => ({
          referenceId: r._id,
          fullName: r.residentName,
          email: r.residentEmail,
          phone: r.residentPhone,
          address: r.residentAddress || (r as any).location || '',
          documentType: r.documentType || r.type || '',
          purpose: r.purpose || (r as any).description || '',
          status: r.status,
          submittedAt: r.createdAt,
          additionalInfo: r.additionalInfo || '',
          location: (r as any).location,
          priority: (r as any).priority,
          reportType: r.type !== 'document' ? r.type as any : undefined
        }))

        remoteRequests = allUnified.filter(r => r.reportType === undefined)
        remoteReports = allUnified.filter(r => r.reportType !== undefined)
      }
    } catch {}

    const mergeById = <T extends { referenceId: string }>(a: T[], b: T[]): T[] => {
      const map = new Map<string, T>()
      for (const item of [...a, ...b]) { map.set(item.referenceId, item) }
      return Array.from(map.values())
    }

    const requests = mergeById(localRequests, remoteRequests)
    const allReports = mergeById(localReports, remoteReports)

    setServiceRequests(requests)
    setReports(allReports)

    setStats(prevStats => ({
      ...prevStats,
      totalRequests: requests.length,
      pendingRequests: requests.filter((r) => r.status === 'pending').length,
      completedRequests: requests.filter((r) => r.status === 'completed').length,
      totalReports: allReports.length,
      urgentReports: allReports.filter((r) => r.priority === 'high').length,
      resolvedReports: allReports.filter((r) => r.status === 'resolved').length
    }))
  }

  const loadUsers = (): void => {
    // Simulate loading users from storage
    const storedUsers = localStorage.getItem('barangay_users')
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers)
      setUsers(parsedUsers)
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: parsedUsers.length,
        activeUsers: parsedUsers.filter((u: UserData) => u.status === 'active').length
      }))
    }
  }

  const loadAnnouncements = (): void => {
    try {
      const stored = localStorage.getItem('barangay_announcements')
      const anns: Announcement[] = stored ? JSON.parse(stored) as Announcement[] : []
      setAnnouncements(anns)
    } catch {
      setAnnouncements([])
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
      loadUsers()
      loadAnnouncements()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleUpdateRequestStatus = (referenceId: string, newStatus: string): void => {
    updateServiceRequestStatus(referenceId, newStatus)
    loadData()
    toast.success(`Request ${referenceId} updated to ${newStatus}`)
  }

  const handleUpdateReportStatus = (referenceId: string, newStatus: string): void => {
    updateReportStatus(referenceId, newStatus)
    loadData()
    toast.success(`Report ${referenceId} updated to ${newStatus}`)
    void fetch('/api/service-request', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: referenceId, status: newStatus })
    }).catch(() => {})
  }

  const handleCreateAnnouncement = (): Promise<void> | void => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all required fields')
      return
    }

    const announcement: Announcement = {
      id: `ANN-${Date.now()}`,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      category: newAnnouncement.category,
      priority: newAnnouncement.priority,
      eventDate: newAnnouncement.eventDate || undefined,
      postedAt: new Date().toISOString()
    }

    const existing = localStorage.getItem('barangay_announcements')
    const arr: Announcement[] = existing ? JSON.parse(existing) as Announcement[] : []
    const updated = [announcement, ...arr]
    safeSetItem('barangay_announcements', JSON.stringify(updated))
    setAnnouncements(updated)
    try { window.dispatchEvent(new Event('barangay_announcements_updated')) } catch {}
    toast.success('Announcement created locally!')
    setNewAnnouncement({
      title: '',
      content: '',
      category: 'general',
      priority: 'medium',
      eventDate: ''
    })
    setShowAnnouncementDialog(false)
  }

  const handleDeleteAnnouncement = (announcementId: string): void => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return
    }
    const existing = localStorage.getItem('barangay_announcements')
    const arr: Announcement[] = existing ? JSON.parse(existing) as Announcement[] : []
    const updated = arr.filter(a => a.id !== announcementId)
    safeSetItem('barangay_announcements', JSON.stringify(updated))
    setAnnouncements(updated)
    try { window.dispatchEvent(new Event('barangay_announcements_updated')) } catch {}
    toast.success('Announcement deleted!')
  }

  const exportData = (type: string): void => {
    let data: unknown[] = []
    let filename = ''

    switch (type) {
      case 'requests':
        data = serviceRequests
        filename = 'service-requests.json'
        break
      case 'reports':
        data = reports
        filename = 'reports.json'
        break
      case 'users':
        data = users
        filename = 'users.json'
        break
      default:
        return
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    
    URL.revokeObjectURL(url)
    toast.success(`Exported ${type} data successfully!`)
  }

  const getStatusBadge = (status: string): React.JSX.Element => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', color: string }> = {
      'pending': { variant: 'outline', color: 'text-yellow-600 border-yellow-600' },
      'in-progress': { variant: 'default', color: 'text-blue-600 bg-blue-50 border-blue-600' },
      'ready': { variant: 'default', color: 'text-green-600 bg-green-50 border-green-600' },
      'completed': { variant: 'secondary', color: 'text-gray-600' },
      'resolved': { variant: 'secondary', color: 'text-green-600 bg-green-50' },
      'rejected': { variant: 'destructive', color: 'text-red-600' }
    }

    const config = variants[status] || variants['pending']
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string): React.JSX.Element => {
    const colors: Record<string, string> = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colors[priority] || colors['low']}>
        {priority}
      </Badge>
    )
  }

  const getCategoryBadge = (category: string): React.JSX.Element => {
    const colors: Record<string, string> = {
      'general': 'bg-blue-100 text-blue-800',
      'event': 'bg-purple-100 text-purple-800',
      'alert': 'bg-orange-100 text-orange-800',
      'emergency': 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colors[category] || colors['general']}>
        {category}
      </Badge>
    )
  }

  const filteredRequests = serviceRequests.filter(req =>
    req.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredReports = reports.filter(rep =>
    rep.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rep.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rep.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Activity className="h-8 w-8" />
                Welcome, {officialInfo.name}
              </CardTitle>
              <CardDescription className="text-green-100 text-lg mt-2">
                {officialInfo.role} - Administrative Dashboard
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                loadData()
                loadUsers()
                loadAnnouncements()
                toast.success('Dashboard refreshed!')
              }}
              className="bg-white text-green-700 hover:bg-green-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalRequests}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.pendingRequests} pending • {stats.completedRequests} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.totalReports}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.urgentReports} urgent • {stats.resolvedReports} resolved
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Bell className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{announcements.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {announcements.filter(a => a.priority === 'high').length} high priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowAnnouncementDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData('requests')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Requests
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData('reports')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
            <Button
              variant="outline"
              onClick={() => exportData('users')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Management Tabs */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="requests">
            <FileText className="h-4 w-4 mr-2" />
            Service Requests
          </TabsTrigger>
          <TabsTrigger value="reports">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Bell className="h-4 w-4 mr-2" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Service Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Service Requests</CardTitle>
                  <CardDescription>Update status of document requests</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          No service requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.referenceId}>
                          <TableCell className="font-mono text-sm">{request.referenceId}</TableCell>
                          <TableCell className="font-medium">{request.fullName}</TableCell>
                          <TableCell>{request.documentType}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{request.email}</div>
                              <div className="text-gray-500">{request.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(request.submittedAt).toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={request.status}
                                onValueChange={(value: string) => handleUpdateRequestStatus(request.referenceId, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="ready">Ready</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{serviceRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  {serviceRequests.filter(r => r.status === 'completed' || r.status === 'ready' || r.status === 'ready_for_pickup').length} completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
                <p className="text-xs text-muted-foreground">
                  {reports.filter(r => r.status === 'resolved').length} resolved
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Request Status</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        [
                          { name: 'pending', value: serviceRequests.filter(r => r.status === 'pending').length },
                          { name: 'in-progress', value: serviceRequests.filter(r => r.status === 'in-progress' || r.status === 'processing').length },
                          { name: 'ready', value: serviceRequests.filter(r => r.status === 'ready' || r.status === 'ready_for_pickup').length },
                          { name: 'completed', value: serviceRequests.filter(r => r.status === 'completed').length },
                          { name: 'rejected', value: serviceRequests.filter(r => r.status === 'rejected').length },
                        ]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'].map((c, i) => (
                        <Cell key={`cell-${i}`} fill={c} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Request Types</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={
                    Object.entries(
                      serviceRequests.reduce<Record<string, number>>((acc, r) => {
                        const key = (r.documentType || 'unknown').toLowerCase();
                        acc[key] = (acc[key] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([name, value]) => ({ name, value }))
                  } maxBarSize={50}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Report Status</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={
                    [
                      { name: 'pending', value: reports.filter(r => r.status === 'pending').length },
                      { name: 'in-progress', value: reports.filter(r => r.status === 'in-progress').length },
                      { name: 'resolved', value: reports.filter(r => r.status === 'resolved').length },
                      { name: 'rejected', value: reports.filter(r => r.status === 'rejected').length },
                    ]
                  } maxBarSize={50}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reports by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={
                    Object.entries(
                      reports.reduce<Record<string, number>>((acc, r) => {
                        const key = (r.reportType || 'unknown').toLowerCase();
                        acc[key] = (acc[key] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([name, value]) => ({ name, value }))
                  } maxBarSize={50}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manage Reports</CardTitle>
                  <CardDescription>Review and respond to community reports</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500">
                          No reports found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((report) => (
                        <TableRow key={report.referenceId}>
                          <TableCell className="font-mono text-sm">{report.referenceId}</TableCell>
                          <TableCell className="capitalize">{report.reportType}</TableCell>
                          <TableCell>{getPriorityBadge(report.priority)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{report.fullName}</div>
                              <div className="text-gray-500">{report.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{report.location}</TableCell>
                          <TableCell>{new Date(report.submittedAt).toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={report.status}
                                onValueChange={(value: string) => handleUpdateReportStatus(report.referenceId, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedReport(report)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registered Users</CardTitle>
                  <CardDescription>View and manage community members</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p>No registered users found</p>
                          <p className="text-xs mt-1">Users will appear here once they register</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-sm">{user.id}</TableCell>
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{user.address}</TableCell>
                          <TableCell>{new Date(user.registeredAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {user.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Community Announcements</CardTitle>
              <CardDescription>Manage barangay announcements and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No announcements yet</p>
                      <p className="text-xs mt-1">Create your first announcement using the button above</p>
                    </div>
                  ) : (
                    announcements.map((announcement) => (
                      <Card key={announcement.id} className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{announcement.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                {getCategoryBadge(announcement.category)}
                                {getPriorityBadge(announcement.priority)}
                                <span className="text-xs text-gray-500">
                                  Posted: {new Date(announcement.postedAt).toLocaleString()}
                                </span>
                                {announcement.eventDate && (
                                  <span className="text-xs text-blue-600 font-semibold">
                                    Event: {new Date(announcement.eventDate).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 50 }}>
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>
              Post an announcement to inform the community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter announcement title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter announcement content"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newAnnouncement.category}
                  onValueChange={(value: 'general' | 'event' | 'alert' | 'emergency') =>
                    setNewAnnouncement({ ...newAnnouncement, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" sideOffset={5} className="z-[9999]">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={newAnnouncement.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setNewAnnouncement({ ...newAnnouncement, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" sideOffset={5} className="z-[9999]">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="eventDate">Event Date (Optional)</Label>
              <Input
                id="eventDate"
                type="date"
                value={newAnnouncement.eventDate}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, eventDate: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty if this is not an event announcement</p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAnnouncement} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Service Request Details</DialogTitle>
              <DialogDescription>Reference ID: {selectedRequest.referenceId}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <p className="text-sm mt-1">{selectedRequest.fullName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm mt-1">{selectedRequest.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm mt-1">{selectedRequest.phone}</p>
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <p className="text-sm mt-1">{selectedRequest.address}</p>
              </div>
              <div>
                <Label>Document Type</Label>
                <p className="text-sm mt-1">{selectedRequest.documentType}</p>
              </div>
              <div>
                <Label>Purpose</Label>
                <p className="text-sm mt-1">{selectedRequest.purpose}</p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <Label>Submitted</Label>
                <p className="text-sm mt-1">{new Date(selectedRequest.submittedAt).toLocaleString()}</p>
              </div>
              
              <div className="pt-4 border-t">
                <Label htmlFor="attachmentUrl">Attach File URL (Optional)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="attachmentUrl"
                    placeholder="https://example.com/document.pdf"
                    value={replyAttachmentUrl}
                    onChange={(e) => setReplyAttachmentUrl(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (replyAttachmentUrl) {
                        toast.success('Attachment URL saved!')
                        // In production, you would send this to the API
                      }
                    }}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Provide a URL to a document or file stored online (Google Drive, Dropbox, etc.)
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Report Details Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
              <DialogDescription>Reference ID: {selectedReport.referenceId}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reporter Name</Label>
                <p className="text-sm mt-1">{selectedReport.fullName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="text-sm mt-1">{selectedReport.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="text-sm mt-1">{selectedReport.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Report Type</Label>
                  <p className="text-sm mt-1 capitalize">{selectedReport.reportType}</p>
                </div>
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedReport.priority)}</div>
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <p className="text-sm mt-1">{selectedReport.location}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
              </div>
              <div>
                <Label>Submitted</Label>
                <p className="text-sm mt-1">{new Date(selectedReport.submittedAt).toLocaleString()}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
