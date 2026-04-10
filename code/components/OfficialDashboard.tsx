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
  LogOut,
  Shield,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
  Send,
  History,
  Trash2,
  Paperclip,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Brain,
  Zap,
  TrendingDown,
  ArrowRight,
  CloudRain
} from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ServiceRequest, Report, Reply } from '@/lib/types'
import { getServiceRequests as getLocalServiceRequests, getReports as getLocalReports, updateServiceRequestStatus as updateLocalServiceRequestStatus, updateReportStatus as updateLocalReportStatus, safeSetItem } from '@/lib/storage'
import { toast } from 'sonner'
import RealTimeClock from './RealTimeClock'
import CommunityMapWrapper from './CommunityMapWrapper'

interface OfficialDashboardProps {
  officialInfo: {
    name: string
    role: string
    username: string
  }
  onLogout: () => void
}

interface Announcement {
  id: string
  title: string
  content: string
  category: 'general' | 'event' | 'alert' | 'emergency'
  priority: 'low' | 'medium' | 'high'
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

type ApiServiceRequest = {
  _id: string
  residentName: string
  residentEmail: string
  residentPhone: string
  residentAddress?: string
  documentType?: string
  type?: string
  purpose?: string
  status: ServiceRequest['status']
  createdAt: string
  additionalInfo?: string
}

type ApiReport = {
  _id: string
  category: Report['reportType']
  priority: Report['priority']
  reporterName: string
  reporterEmail: string
  reporterPhone?: string
  location?: string
  description: string
  status: Report['status'] | 'open'
  createdAt: string
}

function PredictiveAnalyticsTab({ analyticsData }: { analyticsData: any }): React.JSX.Element {
  if (!analyticsData || !analyticsData.trends) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Brain className="h-16 w-12 mb-4 opacity-20" />
        <p>Analyzing historical data for predictions...</p>
        <p className="text-xs mt-2">More data points required for accurate forecasting</p>
      </div>
    )
  }

  // Group trends by month
  const monthlyData: Record<string, { month: string, requests: number, reports: number, total: number }> = {}
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  analyticsData.trends.forEach((t: any) => {
    const key = `${t.year}-${t.month}`
    if (!monthlyData[key]) {
      monthlyData[key] = { month: `${monthNames[t.month - 1]} ${t.year}`, requests: 0, reports: 0, total: 0 }
    }
    if (t.type === 'request') monthlyData[key].requests += t.count
    else monthlyData[key].reports += t.count
    monthlyData[key].total += t.count
  })

  const chartData = Object.values(monthlyData)
  
  // Simple Prediction: Average growth rate
  let predictedNextMonth = 0
  let trendDirection: 'up' | 'down' | 'stable' = 'up'
  
  if (chartData.length >= 2) {
    const last = chartData[chartData.length - 1].total
    const prev = chartData[chartData.length - 2].total
    const growth = last - prev
    predictedNextMonth = Math.max(0, Math.round(last + growth))
    trendDirection = growth > 0 ? 'up' : growth < 0 ? 'down' : 'stable'
  } else if (chartData.length === 1) {
    predictedNextMonth = chartData[0].total
  }

  // Hotspot prediction (mock logic based on most frequent locations)
  const topLocations = analyticsData.reports.byLocation.slice(0, 3)
  const riskLevels = ['High', 'Elevated', 'Moderate']

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              Projected Volume (Next Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{predictedNextMonth}</div>
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              {trendDirection === 'up' ? <TrendingUp className="h-3 w-3" /> : trendDirection === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
              {trendDirection === 'up' ? 'Increasing' : trendDirection === 'down' ? 'Decreasing' : 'Stable'} trend detected
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Predicted Risk Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topLocations.length > 0 ? topLocations.map((loc: any, i: number) => (
                <div key={loc.name} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{loc.name}</span>
                  <Badge variant="outline" className={i === 0 ? "bg-red-100 text-red-700 border-red-200" : "bg-orange-100 text-orange-700 border-orange-200"}>
                    {riskLevels[i] || 'Moderate'}
                  </Badge>
                </div>
              )) : <p className="text-xs text-orange-600">Insufficient data for risk mapping</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Resource Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-green-800 space-y-2">
              <p>• Suggest increasing staff on <strong>Mondays</strong> based on request patterns.</p>
              <p>• Pre-position response teams near <strong>{topLocations[0]?.name || 'hazard zones'}</strong> during upcoming rainy days.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Service Volume Trends & Projections
          </CardTitle>
          <CardDescription>Historical data vs. automated AI projections</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="requests" 
                stroke="#2563eb" 
                strokeWidth={2} 
                name="Document Requests" 
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="reports" 
                stroke="#dc2626" 
                strokeWidth={2} 
                name="Incident Reports"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                name="Total Trend"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seasonal Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border">
                <div className="p-2 bg-blue-100 rounded-full">
                  <CloudRain className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Rainy Season Impact</h4>
                  <p className="text-xs text-gray-600 mt-1">Historically, flooding reports increase by 45% in the coming quarter. Recommendation: Clear drainage systems in Purok 18.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <FileText className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">School Opening Peak</h4>
                  <p className="text-xs text-gray-600 mt-1">Expect a 30% surge in residency certificates next month. Recommendation: Open an additional processing window.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proactive Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <ArrowRight className="h-4 w-4 text-green-500" />
                Inspect landslide sensors in high-risk zones.
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <ArrowRight className="h-4 w-4 text-green-500" />
                Stockpile emergency supplies for predicted weather events.
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <ArrowRight className="h-4 w-4 text-green-500" />
                Schedule community awareness program for fire safety.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OfficialDashboard({ officialInfo, onLogout }: OfficialDashboardProps): React.JSX.Element {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  
  const [reports, setReports] = useState<Report[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState<boolean>(false)
  const [showReplyDialog, setShowReplyDialog] = useState<boolean>(false)
  const [showAllServiceRequestsDialog, setShowAllServiceRequestsDialog] = useState<boolean>(false)
  const [showAllReportsDialog, setShowAllReportsDialog] = useState<boolean>(false)
  const [replyType, setReplyType] = useState<'service-request' | 'report'>('service-request')
  const [replyReferenceId, setReplyReferenceId] = useState<string>('')
  const [replyRecipient, setReplyRecipient] = useState<{ email: string; phone: string; name: string }>({ email: '', phone: '', name: '' })
  const [replyMessage, setReplyMessage] = useState<string>('')
  const [repliesHistory, setRepliesHistory] = useState<Reply[]>([])
  const [showRepliesDialog, setShowRepliesDialog] = useState<boolean>(false)
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false)
  const [replyFiles, setReplyFiles] = useState<Array<{ name: string; size: number; type: string; dataUrl: string }>>([])
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' })
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'general' as 'general' | 'event' | 'alert' | 'emergency',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })
  const [stats, setStats] = useState({
    totalServiceRequests: 0,
    totalReports: 0,
    pendingServiceRequests: 0,
    urgentReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    activeUsers: 0
  })

  const [analyticsData, setAnalyticsData] = useState<{
    requests: {
      total: number
      pending: number
      completed: number
      byStatus: { name: string; value: number }[]
      byType: { name: string; value: number }[]
      byDocumentType: { name: string; value: number }[]
    }
    reports: {
      total: number
      resolved: number
      byStatus: { name: string; value: number }[]
      byCategory: { name: string; value: number }[]
      byLocation: { name: string; value: number }[]
    }
    trends?: {
      year: number
      month: number
      type: 'request' | 'report'
      count: number
    }[]
    users: {
      totalResidents: number
    }
  } | null>(null)

  // Enable all features for all officials as requested
  const canViewReports = true
  const reportsOnly = false
  const isSK = false

  useEffect(() => {
    loadData()
    loadUsers()
    loadAnnouncements()
    loadAnalytics()
    const storageHandler = (e: StorageEvent): void => {
      if (e.key === 'barangay_announcements') loadAnnouncements()
      if (e.key === 'barangay_service_requests') loadLocalServiceRequests()
      if (e.key === 'barangay_reports') loadLocalReports()
    }
    const customHandler = (): void => {
      loadAnnouncements()
    }
    const reqHandler = (): void => { loadLocalServiceRequests() }
    const repHandler = (): void => { loadLocalReports() }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', storageHandler)
      window.addEventListener('barangay_announcements_updated', customHandler as EventListener)
      window.addEventListener('barangay_service_requests_updated', reqHandler as EventListener)
      window.addEventListener('barangay_reports_updated', repHandler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', storageHandler)
        window.removeEventListener('barangay_announcements_updated', customHandler as EventListener)
        window.removeEventListener('barangay_service_requests_updated', reqHandler as EventListener)
        window.removeEventListener('barangay_reports_updated', repHandler as EventListener)
      }
    }
  }, [])

  const loadAnalytics = async (): Promise<void> => {
    try {
      const res = await fetch('/api/analytics')
      const json = await res.json()
      if (json.success) {
        setAnalyticsData(json.data)
      }
    } catch (error) {
      console.error('Failed to load analytics', error)
    }
  }

  const loadData = async (): Promise<void> => {
    // Instant local view to avoid delay
    loadLocalServiceRequests()
    loadLocalReports()
    try {
      const [reqRes] = await Promise.all([
        fetch('/api/service-request')
      ])
      let requests: ServiceRequest[] = []
      let allReports: Report[] = []

      try {
        const reqJson = await reqRes.json()
        if (reqRes.ok && Array.isArray(reqJson.requests)) {
          const allUnifiedRequests = (reqJson.requests as ApiServiceRequest[]).map((r) => ({
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
          
          requests = allUnifiedRequests.filter(r => r.reportType === undefined)
          allReports = allUnifiedRequests.filter(r => r.reportType !== undefined)
        }
      } catch {}

      if (requests.length === 0) {
        const localReqs = getLocalServiceRequests()
        requests = localReqs as unknown as ServiceRequest[]
      }
      if (allReports.length === 0) {
        const localReps = getLocalReports()
        allReports = localReps as unknown as Report[]
      }

      setServiceRequests(requests)
      setReports(allReports)
      setStats({
        totalServiceRequests: requests.length,
        totalReports: allReports.length,
        pendingServiceRequests: requests.filter((r) => r.status === 'pending').length,
        urgentReports: allReports.filter((r) => r.priority === 'high').length,
        resolvedReports: allReports.filter((r) => r.status === 'resolved').length,
        totalUsers: 0,
        activeUsers: 0
      })
    } catch {
      const localReqs = getLocalServiceRequests()
      const localReps = getLocalReports()
      setServiceRequests(localReqs as unknown as ServiceRequest[])
      setReports(localReps as unknown as Report[])
      setStats({
        totalServiceRequests: localReqs.length,
        totalReports: localReps.length,
        pendingServiceRequests: localReqs.filter((r) => r.status === 'pending').length,
        urgentReports: localReps.filter((r) => r.priority === 'high').length,
        resolvedReports: localReps.filter((r) => r.status === 'resolved').length,
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers
      })
    }
  }

  const loadLocalServiceRequests = (): void => {
    const localReqs = getLocalServiceRequests()
    setServiceRequests(localReqs as unknown as ServiceRequest[])
    setStats(prev => ({
      ...prev,
      totalServiceRequests: localReqs.length,
      pendingServiceRequests: localReqs.filter((r) => r.status === 'pending').length
    }))
  }

  const loadLocalReports = (): void => {
    const localReps = getLocalReports()
    setReports(localReps as unknown as Report[])
    setStats(prev => ({
      ...prev,
      totalReports: localReps.length,
      urgentReports: localReps.filter((r) => r.priority === 'high').length,
      resolvedReports: localReps.filter((r) => r.status === 'resolved').length
    }))
  }

  const loadUsers = (): void => {
    const storedUsers = localStorage.getItem('barangay_users')
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers) as UserData[]
      setUsers(parsedUsers)
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: parsedUsers.length,
        activeUsers: parsedUsers.filter((u) => u.status === 'active').length
      }))
    }
  }

  const loadAnnouncements = (): void => {
    try {
      const raw = localStorage.getItem('barangay_announcements')
      const anns: Announcement[] = raw ? JSON.parse(raw) as Announcement[] : []
      setAnnouncements(anns)
    } catch {
      setAnnouncements([])
    }
  }

  const handleUpdateRequestStatus = async (referenceId: string, newStatus: string): Promise<void> => {
    try {
      const res = await fetch('/api/service-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: referenceId, status: newStatus })
      })
      if (!res.ok) throw new Error('api-failed')
      await loadData()
      toast.success(`Request ${referenceId} updated to ${newStatus}`)

      // Notify resident about status update
      const request = serviceRequests.find(r => r.referenceId === referenceId)
      if (request) {
        let message = `Your service request regarding ${request.documentType} has been updated to: ${newStatus.replace('_', ' ')}.`
        
        if (newStatus === 'ready_for_pickup' || newStatus === 'ready') {
          message = `Good news! Your ${request.documentType} is ready for pickup at the Barangay Hall.`
        } else if (newStatus === 'processing') {
          message = `Your request for ${request.documentType} is now being processed.`
        } else if (newStatus === 'rejected') {
          message = `Your request for ${request.documentType} has been declined.`
        }

        const identifiers = [request.email, request.phone, request.fullName].filter(Boolean) as string[]
        
        await Promise.all(identifiers.map(recipientId => 
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId,
              type: 'ServiceRequest',
              title: 'Service Request Update',
              message,
              relatedId: referenceId,
              link: '/services'
            })
          })
        )).catch(console.error)
      }
    } catch {
      updateLocalServiceRequestStatus(referenceId, newStatus)
      const localReqs = getLocalServiceRequests()
      setServiceRequests(localReqs as unknown as ServiceRequest[])
      toast.success(`Request ${referenceId} updated locally to ${newStatus}`)
    }
  }

  

  const handleUpdateReportStatus = async (referenceId: string, newStatus: string): Promise<void> => {
    try {
      const res = await fetch('/api/service-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: referenceId, status: newStatus })
      })
      if (!res.ok) throw new Error('api-failed')
      await loadData()
      toast.success(`Report ${referenceId} updated to ${newStatus}`)

      // Notify resident about status update
      const report = reports.find(r => r.referenceId === referenceId)
      if (report) {
        const identifiers = [report.email, report.phone, report.fullName].filter(Boolean) as string[]
        
        await Promise.all(identifiers.map(recipientId => 
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientId,
              type: 'Report',
              title: 'Report Status Update',
              message: `Your report regarding ${report.reportType} has been updated to: ${newStatus}.`,
              relatedId: referenceId,
              link: '/services'
            })
          })
        )).catch(console.error)
      }
    } catch {
      updateLocalReportStatus(referenceId, newStatus)
      const localReps = getLocalReports()
      setReports(localReps as unknown as Report[])
      toast.success(`Report ${referenceId} updated locally to ${newStatus}`)
    }
  }

  const handleDeleteServiceRequest = (referenceId: string): void => {
    // Update local storage
    const reqs = getLocalServiceRequests().filter(r => r.referenceId !== referenceId)
    safeSetItem('barangay_service_requests', JSON.stringify(reqs))
    
    // Update state by filtering current state (preserving remote requests)
    setServiceRequests(prev => prev.filter(r => r.referenceId !== referenceId))
    
    setStats(prev => ({
      ...prev,
      totalServiceRequests: prev.totalServiceRequests - 1,
      pendingServiceRequests: prev.pendingServiceRequests - (serviceRequests.find(r => r.referenceId === referenceId)?.status === 'pending' ? 1 : 0)
    }))
    toast.success(`Service request ${referenceId} deleted`)
    void fetch(`/api/service-request?id=${referenceId}`, { method: 'DELETE' }).catch(() => {})
  }

  const handleDeleteReport = (referenceId: string): void => {
    // Update local storage
    const reps = getLocalReports().filter(r => r.referenceId !== referenceId)
    safeSetItem('barangay_reports', JSON.stringify(reps))
    
    // Update state by filtering current state (preserving remote reports)
    setReports(prev => prev.filter(r => r.referenceId !== referenceId))
    
    setStats(prev => ({
      ...prev,
      totalReports: prev.totalReports - 1,
      urgentReports: prev.urgentReports - (reports.find(r => r.referenceId === referenceId)?.priority === 'high' ? 1 : 0),
      resolvedReports: prev.resolvedReports - (reports.find(r => r.referenceId === referenceId)?.status === 'resolved' ? 1 : 0)
    }))
    toast.success(`Report ${referenceId} deleted`)
    void fetch(`/api/service-request?id=${referenceId}`, { method: 'DELETE' }).catch(() => {})
  }

  

  const handleDeleteAnnouncement = (id: string): void => {
    try {
      const raw = localStorage.getItem('barangay_announcements')
      const anns: Announcement[] = raw ? JSON.parse(raw) as Announcement[] : []
      const updated = anns.filter(a => a.id !== id)
      safeSetItem('barangay_announcements', JSON.stringify(updated))
      setAnnouncements(updated)
      try { window.dispatchEvent(new Event('barangay_announcements_updated')) } catch {}
      toast.success('Announcement deleted')
    } catch {
      toast.error('Failed to delete announcement')
    }
  }

  const handleCreateAnnouncement = (): void => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all fields')
      return
    }
    const ann: Announcement = {
      id: `ANN-${Date.now()}`,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      category: newAnnouncement.category,
      priority: newAnnouncement.priority,
      postedAt: new Date().toISOString()
    }
    try {
      const raw = localStorage.getItem('barangay_announcements')
      const anns: Announcement[] = raw ? JSON.parse(raw) as Announcement[] : []
      const updated = [ann, ...anns]
      safeSetItem('barangay_announcements', JSON.stringify(updated))
      setAnnouncements(updated)
      setNewAnnouncement({ title: '', content: '', category: 'general', priority: 'medium' })
      setShowAnnouncementDialog(false)
      try { window.dispatchEvent(new Event('barangay_announcements_updated')) } catch {}
      
      // Notify all users about the announcement
      users.forEach(user => {
        if (user.email) {
            fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: user.email,
                    type: 'Announcement',
                    title: `New Announcement: ${newAnnouncement.title}`,
                    message: newAnnouncement.content.substring(0, 100) + (newAnnouncement.content.length > 100 ? '...' : ''),
                    relatedId: ann.id,
                    link: '/announcements'
                })
            }).catch(console.error)
        }
      })

      toast.success('Announcement created successfully!')
    } catch {
      toast.error('Failed to create announcement')
    }
  }

  const handleOpenReply = (referenceId: string, type: 'service-request' | 'report', recipient: { email: string; phone: string; name: string }): void => {
    setReplyReferenceId(referenceId)
    setReplyType(type)
    setReplyRecipient(recipient)
    setReplyMessage('')
    setReplyFiles([])
    setShowReplyDialog(true)
  }

  const handleSendReply = async (): Promise<void> => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    setIsSendingReply(true)

    try {
      const reply: Reply = {
        id: `REPLY-${Date.now()}`,
        referenceId: replyReferenceId,
        type: replyType,
        officialName: officialInfo.name,
        officialRole: officialInfo.role,
        message: replyMessage,
        sentAt: new Date().toISOString(),
        recipientEmail: replyRecipient.email,
        recipientPhone: replyRecipient.phone,
        emailSent: false,
        smsSent: false,
        attachments: replyFiles.length > 0 ? replyFiles : undefined
      }

      // Save reply message to the corresponding record so the resident can see it in their account
      try {
        if (replyType === 'service-request') {
          await fetch('/api/service-request', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: replyReferenceId, adminNotes: replyMessage })
          })
        } else {
          await fetch('/api/reports', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: replyReferenceId, response: replyMessage })
          })
        }

      // Create notification for the resident for all available identifiers
      const identifiers = [
        replyRecipient.email,
        replyRecipient.phone,
        replyRecipient.name
      ].filter(Boolean) as string[];
      
      await Promise.all(identifiers.map(recipientId => 
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId,
            type: 'Reply',
            title: `New Reply from ${officialInfo.role}`,
            message: `You have received a reply: "${replyMessage.length > 50 ? replyMessage.substring(0, 50) + '...' : replyMessage}"`,
            relatedId: replyReferenceId,
            link: replyType === 'service-request' ? '/services' : '/reports'
          })
        })
      )).catch(console.error)

      // Save reply to persistent DB
      await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceId: replyReferenceId,
          type: replyType,
          officialName: officialInfo.name,
          officialRole: officialInfo.role,
          message: replyMessage,
          recipientEmail: replyRecipient.email,
          recipientPhone: replyRecipient.phone,
          recipientName: replyRecipient.name,
          attachments: replyFiles.length > 0 ? replyFiles : undefined
        })
      })

      // Force a re-fetch of the requests/reports to update the UI
      await loadData()
    } catch (error) {
      console.error('Error in handleSendReply:', error)
    }

    const existingRaw = localStorage.getItem('barangay_replies')
    const existing: Reply[] = existingRaw ? JSON.parse(existingRaw) as Reply[] : []
    const updatedReplies = [reply, ...existing]
    safeSetItem('barangay_replies', JSON.stringify(updatedReplies))
    
    // Fallback for offline/local view
    try {
      const perAccountKey = `replies:${replyRecipient.email || replyRecipient.phone || replyRecipient.name}`
      const accRaw = localStorage.getItem(perAccountKey)
      const acc: Reply[] = accRaw ? JSON.parse(accRaw) as Reply[] : []
      safeSetItem(perAccountKey, JSON.stringify([reply, ...acc]))
    } catch {}

    toast.success('Reply sent successfully!', {
      description: 'The resident will see this reply in their account and receive a notification.'
    })

    setShowReplyDialog(false)
    setReplyMessage('')
  } catch (error) {
    console.error('Error sending reply:', error)
    toast.error('Failed to send reply', { description: 'Please try again later' })
  } finally {
    setIsSendingReply(false)
  }
}

const handleViewReplies = async (referenceId: string): Promise<void> => {
  try {
    const res = await fetch(`/api/replies?referenceId=${referenceId}`)
    const json = await res.json()
    if (json.success && json.replies) {
      setRepliesHistory(json.replies)
    } else {
      // Fallback to local
      const stored = localStorage.getItem('barangay_replies')
      const all: Reply[] = stored ? JSON.parse(stored) as Reply[] : []
      const replies = all.filter(r => r.referenceId === referenceId)
      setRepliesHistory(replies)
    }
  } catch {
    const stored = localStorage.getItem('barangay_replies')
    const all: Reply[] = stored ? JSON.parse(stored) as Reply[] : []
    const replies = all.filter(r => r.referenceId === referenceId)
    setRepliesHistory(replies)
  }
  setShowRepliesDialog(true)
}

  const exportData = (type: string): void => {
    let data: unknown[] = []
    let filename = ''

    switch (type) {
      case 'service-requests':
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
      'in_progress': { variant: 'default', color: 'text-blue-600 bg-blue-50 border-blue-600' },
      'processing': { variant: 'default', color: 'text-blue-600 bg-blue-50 border-blue-600' },
      'ready': { variant: 'default', color: 'text-green-600 bg-green-50 border-green-600' },
      'ready_for_pickup': { variant: 'default', color: 'text-green-600 bg-green-50 border-green-600' },
      'completed': { variant: 'secondary', color: 'text-gray-600' },
      'resolved': { variant: 'secondary', color: 'text-green-600 bg-green-50' },
      'rejected': { variant: 'destructive', color: 'text-red-600' }
    }

    const config = variants[status] || variants['pending']
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.replace('_', ' ')}
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

  const sortData = (data: any[]) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      if (sortConfig.key === 'date') {
        aValue = new Date(a.submittedAt || a.postedAt || a.createdAt || 0).getTime()
        bValue = new Date(b.submittedAt || b.postedAt || b.createdAt || 0).getTime()
      } else if (sortConfig.key === 'status') {
        aValue = a.status || ''
        bValue = b.status || ''
      } else if (sortConfig.key === 'name') {
        aValue = a.fullName || a.title || ''
        bValue = b.fullName || b.title || ''
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }

  const filteredServiceRequests = sortData(serviceRequests.filter(req =>
    req.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.email.toLowerCase().includes(searchQuery.toLowerCase())
  ))

  const filteredReports = sortData(reports.filter(rep =>
    rep.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rep.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rep.location.toLowerCase().includes(searchQuery.toLowerCase())
  ))

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-full">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Ugnayan Admin</h1>
                <p className="text-green-100 text-sm">Barangay Irisan Management Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RealTimeClock />
              <div className="text-right mr-4">
                <p className="text-sm font-medium">{officialInfo.name}</p>
                <p className="text-xs text-green-100">{officialInfo.role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="text-white hover:bg-green-800"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Welcome Card */}
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
                <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.totalServiceRequests}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pendingServiceRequests} pending
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.totalReports}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.urgentReports} urgent • {stats.resolvedReports} resolved
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{users.length}</div>
                <p className="text-xs text-gray-500 mt-1">Registered members</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">Active</div>
                <p className="text-xs text-gray-500 mt-1">Real-time monitoring</p>
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
                  variant="outline"
                  onClick={() => exportData('service-requests')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Service Requests
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAllServiceRequestsDialog(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Service Requests
                </Button>
                <Button
                  onClick={() => setShowAnnouncementDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Announcement
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAllReportsDialog(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Reports
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportData('reports')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Reports
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Management Tabs */}
          <Tabs defaultValue="service-requests" className="space-y-4">
            <TabsList className="flex flex-wrap w-full gap-2 p-1 bg-gray-100/50 rounded-xl h-auto">
              <TabsTrigger value="service-requests" className="flex-1 min-w-[120px] py-2.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4 mr-2" />
                Services
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex-1 min-w-[120px] py-2.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 min-w-[120px] py-2.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="map" className="flex-1 min-w-[140px] py-2.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <MapPin className="h-4 w-4 mr-2" />
                Community Map
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 min-w-[100px] py-2.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="announcements" className="flex-1 min-w-[150px] py-2.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Bell className="h-4 w-4 mr-2" />
                Announcements
              </TabsTrigger>
            </TabsList>

            {/* Service Requests Tab */}
            <TabsContent value="service-requests">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Service Requests</CardTitle>
                      <CardDescription>Manage document service requests from residents</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={sortConfig.key} onValueChange={(val) => setSortConfig({ ...sortConfig, key: val })}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                        title={sortConfig.direction === 'asc' ? "Ascending" : "Descending"}
                      >
                        {sortConfig.direction === 'asc' ? "↑" : "↓"}
                      </Button>
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Document Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredServiceRequests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-500">
                              No service requests found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredServiceRequests.map((request) => (
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
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedRequest(request)}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleOpenReply(
                                        request.referenceId,
                                        'service-request',
                                        { email: request.email, phone: request.phone, name: request.fullName }
                                      )
                                    }
                                    title="Send Reply"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewReplies(request.referenceId)}
                                    title="View Reply History"
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteServiceRequest(request.referenceId)}
                                    title="Delete Request"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            

            

            {/* Reports Tab */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Reports</CardTitle>
                      <CardDescription>Review and respond to community reports</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={sortConfig.key} onValueChange={(val) => setSortConfig({ ...sortConfig, key: val })}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                        title={sortConfig.direction === 'asc' ? "Ascending" : "Descending"}
                      >
                        {sortConfig.direction === 'asc' ? "↑" : "↓"}
                      </Button>
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[900px]">
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
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenReply(
                                      report.referenceId,
                                      'report',
                                      { email: report.email, phone: report.phone, name: report.fullName }
                                    )}
                                    title="Send Reply"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewReplies(report.referenceId)}
                                    title="View Reply History"
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteReport(report.referenceId)}
                                    title="Delete Report"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                      </Table>
                    </div>
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
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[900px]">
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
                    </div>
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
                                      {new Date(announcement.postedAt).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                                    title="Delete Announcement"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
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
            <TabsContent value="analytics" className="space-y-6 mt-2 md:mt-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsData?.requests.total ?? stats.totalServiceRequests}</div>
                      <p className="text-xs text-muted-foreground">
                        {(analyticsData?.requests.completed ?? 0)} completed
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsData?.reports.total ?? stats.totalReports}</div>
                      <p className="text-xs text-muted-foreground">
                        {(analyticsData?.reports.resolved ?? stats.resolvedReports)} resolved
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsData?.users.totalResidents ?? stats.totalUsers}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Service Request Status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData?.requests.byStatus ?? []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(analyticsData?.requests.byStatus ?? []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
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
                        <BarChart data={analyticsData?.requests.byType ?? []} maxBarSize={50}>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Incident Report Status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData?.reports.byStatus ?? []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(analyticsData?.reports.byStatus ?? []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
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
                      <CardTitle>Incident Report Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData?.reports.byCategory ?? []} maxBarSize={50}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Reports by Location */}
                <div className="grid gap-4 md:grid-cols-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Reports by Location (Hotspots)</CardTitle>
                      <CardDescription>Areas with the most reported incidents</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData?.reports.byLocation ?? []} maxBarSize={50}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <RechartsTooltip />
                          <Bar dataKey="value" fill="#ff8042" name="Reports" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Integrated Predictive Insights */}
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Brain className="h-6 w-6 text-purple-600" />
                    Predictive Insights & Projections
                  </h3>
                  <PredictiveAnalyticsTab analyticsData={analyticsData} />
                </div>
              </TabsContent>
              <TabsContent value="map">
                <Card>
                  <CardHeader>
                    <CardTitle>Barangay Community Map</CardTitle>
                    <CardDescription>View and manage community locations, hazards, and landmarks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[700px] border rounded-lg overflow-hidden">
                      <CommunityMapWrapper />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Create Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>
              Post an announcement to inform the community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter announcement title"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newAnnouncement.category}
                  onValueChange={(value: 'general' | 'event' | 'alert' | 'emergency') =>
                    setNewAnnouncement({ ...newAnnouncement, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" sideOffset={5} className="z-[11000]">
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newAnnouncement.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setNewAnnouncement({ ...newAnnouncement, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" sideOffset={5} className="z-[11000]">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

      {/* Send Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Reply</DialogTitle>
            <DialogDescription>
              Reply to {replyType === 'service-request' ? 'Service Request' : 'Report'} {replyReferenceId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Recipient Information</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Name:</strong> {replyRecipient.name}</p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <strong>Email:</strong> {replyRecipient.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <strong>Phone:</strong> {replyRecipient.phone || 'Not provided'}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="reply-message">Your Message</Label>
              <Textarea
                id="reply-message"
                placeholder="Type your response here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
                ℹ️ This message will be saved to the resident&apos;s account for request/report <strong>{replyReferenceId}</strong>.
          </p>
        </div>
        {replyType === 'service-request' && (
          <div>
            <Label htmlFor="reply-attachments" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attach Files (optional)
            </Label>
            <Input
              id="reply-attachments"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="mt-2"
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                const previews: Array<{ name: string; size: number; type: string; dataUrl: string }> = []
                for (const file of files) {
                  const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = () => reject(reader.error as unknown as string)
                    reader.readAsDataURL(file)
                  })
                  previews.push({ name: file.name, size: file.size, type: file.type, dataUrl })
                }
                setReplyFiles(previews)
              }}
            />
            {replyFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {replyFiles.map((f) => (
                  <div key={f.name} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[60%]">{f.name}</span>
                    <span className="text-gray-500">{Math.round(f.size / 1024)} KB</span>
                    <a href={f.dataUrl} download className="text-green-700 hover:underline">Preview</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowReplyDialog(false)}
                disabled={isSendingReply}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendReply} 
                className="bg-green-600 hover:bg-green-700"
                disabled={isSendingReply}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSendingReply ? 'Sending...' : 'Send Reply'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Reply History Dialog */}
      <Dialog open={showRepliesDialog} onOpenChange={setShowRepliesDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reply History</DialogTitle>
            <DialogDescription>
              All replies sent for this request
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-4">
              {repliesHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No replies yet</p>
                </div>
              ) : (
                repliesHistory.map((reply) => (
                  <Card key={reply.id} className="border-l-4 border-l-green-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{reply.officialName}</p>
                          <p className="text-sm text-gray-500">{reply.officialRole}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(reply.sentAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap mb-3">{reply.message}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{reply.recipientEmail}</span>
                        </div>
                        {reply.recipientPhone && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{reply.recipientPhone}</span>
                          </div>
                        )}
                        <Badge className={reply.emailSent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {reply.emailSent ? '✓ Email Sent' : 'Email Pending'}
                        </Badge>
                        {reply.recipientPhone && (
                          <Badge className={reply.smsSent ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                            {reply.smsSent ? '✓ SMS Sent' : 'SMS Pending'}
                          </Badge>
                        )}
                        {reply.attachments && reply.attachments.length > 0 && (
                          <div className="flex flex-col gap-1">
                            {reply.attachments.map((att) => (
                              <a key={att.name} href={att.dataUrl} download className="text-sm text-green-700 hover:underline">
                                {att.name} ({Math.round(att.size / 1024)} KB)
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* View Service Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent>
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
              {selectedRequest.idPicture && (
                <div>
                  <Label>Verification Picture</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[200px]">
                    {selectedRequest.idPicture.startsWith('data:image') || selectedRequest.idPicture.startsWith('http') ? (
                      <img 
                        src={selectedRequest.idPicture} 
                        alt="Verification" 
                        className="max-w-full max-h-[400px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Load+Error';
                        }}
                      />
                    ) : (
                      <p className="text-gray-500 text-sm italic">{selectedRequest.idPicture}</p>
                    )}
                  </div>
                </div>
              )}
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
              {selectedRequest.additionalInfo && (
                <div>
                  <Label>Additional Info</Label>
                  <p className="text-sm mt-1">{selectedRequest.additionalInfo}</p>
                </div>
              )}
              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              <div>
                <Label>Submitted</Label>
                <p className="text-sm mt-1">{new Date(selectedRequest.submittedAt).toLocaleString()}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Full Service Requests View */}
      <Dialog open={showAllServiceRequestsDialog} onOpenChange={setShowAllServiceRequestsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto z-[11000]">
          <DialogHeader>
            <DialogTitle>All Service Requests</DialogTitle>
            <DialogDescription>Browse all submitted service requests</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Reference ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">No service requests</TableCell>
                  </TableRow>
                ) : (
                  serviceRequests.map((request) => (
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
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      

      
      

      {/* Full Reports View */}
      <Dialog open={showAllReportsDialog} onOpenChange={setShowAllReportsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Reports</DialogTitle>
            <DialogDescription>Browse all submitted community reports</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh]">
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Reference ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">No reports</TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
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
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* View Report Details Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent>
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
              {(selectedReport as any).idPicture && (
                <div>
                  <Label>Verification Picture</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[200px]">
                    {(selectedReport as any).idPicture.startsWith('data:image') || (selectedReport as any).idPicture.startsWith('http') ? (
                      <img 
                        src={(selectedReport as any).idPicture} 
                        alt="Verification" 
                        className="max-w-full max-h-[400px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Image+Load+Error';
                        }}
                      />
                    ) : (
                      <p className="text-gray-500 text-sm italic">{(selectedReport as any).idPicture}</p>
                    )}
                  </div>
                </div>
              )}
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

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3">Barangay Irisan</h3>
              <p className="text-gray-300 text-sm">
                Administrative portal for managing community services and operations
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Contact Information</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  (074) 123-4567
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  irisan.baguio@gmail.com
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Purok 18, Baguio City
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Office Hours</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Monday - Friday
                </li>
                <li>8:00 AM - 5:00 PM</li>
                <li className="text-gray-400">Weekends & Holidays: Closed</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Barangay Irisan. Developed by UC College of IT Students.</p>
            <p className="mt-1">Dalog, De Vera, Manzano</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
