'use client'
export const dynamic = 'force-static'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  FileText, 
  AlertTriangle, 
  Map, 
  Bell, 
  MessageSquare,
  Phone,
  Clock,
  MapPin,
  Users,
  Shield,
  Lightbulb,
  CloudRain,
  Mountain,
  LogIn,
  LogOut,
  TrendingUp,
  Search
} from 'lucide-react'
import ServiceRequestForm from '@/components/ServiceRequestForm'
import BlotterForm from '@/components/BlotterForm'
import CommunityMapWrapper from '@/components/CommunityMapWrapper'
import AnnouncementsBoard from '@/components/AnnouncementsBoard'
import FeedbackSystem from '@/components/FeedbackSystem'
import EmergencyContacts from '@/components/EmergencyContacts'
import MyRequests from '@/components/MyRequests'
import RealTimeClock from '@/components/RealTimeClock'
// Official login removed from resident dashboard
// Official login removed from resident dashboard
import ChatbotWidget from '@/components/ChatbotWidget'
import OfficialDashboard from '@/components/OfficialDashboard'
import WelcomePage from '@/components/WelcomePage'
import UserLogin from '@/components/UserLogin'
import UserRegistration from '@/components/UserRegistration'
import { sdk } from "@farcaster/miniapp-sdk"
import { toast } from 'sonner'
import { useAddMiniApp } from "@/hooks/useAddMiniApp";
import { useQuickAuth } from "@/hooks/useQuickAuth";
import { useIsInFarcaster } from "@/hooks/useIsInFarcaster";
import { useRouter } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import NotificationsBell from '@/components/NotificationsBell'
import NotificationCenter from '@/components/NotificationCenter'
import type { ServiceRequest, Report } from '@/lib/types'
import { getServiceRequests, getReports, getUserServiceRequests, getUserReports, safeSetItem } from '@/lib/storage'

export default function UgnayanApp(): React.JSX.Element {
    const { addMiniApp } = useAddMiniApp();
    const isInFarcaster = useIsInFarcaster()
    useQuickAuth('promised-moving-017.app.ohara.ai')
    const router = useRouter()
    useEffect(() => {
      const tryAddMiniApp = async () => {
        try {
          await addMiniApp()
        } catch (error) {
          console.error('Failed to add mini app:', error)
        }

      }

    

      tryAddMiniApp()
    }, [addMiniApp])
    useEffect(() => {
      const initializeFarcaster = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (document.readyState !== 'complete') {
            await new Promise(resolve => {
              if (document.readyState === 'complete') {
                resolve(void 0);
              } else {
                window.addEventListener('load', () => resolve(void 0), { once: true });
              }

            });
          }

          await sdk.actions.ready();
          console.log("Farcaster SDK initialized successfully - app fully loaded");
        } catch (error) {
          console.error('Failed to initialize Farcaster SDK:', error);
          setTimeout(async () => {
            try {
              await sdk.actions.ready();
              console.log('Farcaster SDK initialized on retry');
            } catch (retryError) {
              console.error('Farcaster SDK retry failed:', retryError);
            }

          }, 1000);
        }

      };
      initializeFarcaster();
    }, []);
  const [activeTab, setActiveTab] = useState<string>('home')
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false)
  const [serviceSubTab, setServiceSubTab] = useState<'documents' | 'blotter' | 'myrequests'>('documents')
  const [loginOpen, setLoginOpen] = useState<boolean>(false)
  const [loggedInOfficial, setLoggedInOfficial] = useState<{ username: string; role: string; name: string } | null>(null)
  const [showWelcome, setShowWelcome] = useState<boolean>(true)
  const [residentUser, setResidentUser] = useState<{ id: string; username: string; fullName: string; email: string; phone: string; address: string; isAdmin: boolean } | null>(null)
  const [residentLoginOpen, setResidentLoginOpen] = useState<boolean>(false)
  const [residentRegisterOpen, setResidentRegisterOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  type NotificationItem = { 
    id: string; 
    type: 'ServiceRequest' | 'Report' | 'Reply' | 'Announcement' | string; 
    entityId: string; 
    message: string; 
    createdAt: number; 
    read: boolean 
  }
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('official')
      const visitedBefore = localStorage.getItem('visited_ugnayan')
      const storedResident = localStorage.getItem('resident_user')
      
      if (stored) {
        const official = JSON.parse(stored)
        setLoggedInOfficial(official)
        setShowWelcome(false)
        setIsLoading(false)
      } else if (storedResident) {
        const user = JSON.parse(storedResident)
        setResidentUser(user)
        setShowWelcome(false)
        setIsLoading(false)
      } else if (!visitedBefore) {
        setShowWelcome(true)
        setIsLoading(false)
      } else {
        // Not logged in and visited before, redirect to login
        router.replace('/login')
      }
    } catch {
      setIsLoading(false)
    }
  }, [router])

  const notifKey = (u?: { id: string; email: string }): string => {
    const k = u?.id || u?.email || 'anonymous'
    return `notifications:${k}`
  }

  useEffect(() => {
    try {
      if (!residentUser) return
      const raw = localStorage.getItem(notifKey(residentUser))
      const parsed: NotificationItem[] = raw ? JSON.parse(raw) : []
      setNotifications(parsed)
    } catch {}
  }, [residentUser])

  const persistNotifications = (items: NotificationItem[]): void => {
    try { safeSetItem(notifKey(residentUser || undefined), JSON.stringify(items)) } catch {}
  }

  const markAllNotificationsRead = (): void => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }))
      persistNotifications(next)
      return next
    })
  }

  const clearNotifications = (): void => {
    setNotifications([])
    persistNotifications([])
  }

  useEffect(() => {
    let timer: any
    const poll = async (): Promise<void> => {
      try {
        if (!residentUser) return
        
        // 1. Fetch Cloud Notifications for all possible identifiers
        const identifiers = [
          residentUser.email,
          residentUser.phone,
          residentUser.fullName,
          residentUser.id
        ].filter(Boolean) as string[]

        const notifPromises = identifiers.map(id => 
          fetch(`/api/notifications?username=${encodeURIComponent(id)}`).then(res => res.json())
        )
        const notifResults = await Promise.all(notifPromises)
        
        // 2. Get Requests & Reports from Local Storage for Status Changes
        const email = residentUser.email || residentUser.id || residentUser.phone
        const reqJson = { 
          success: true, 
          serviceRequests: getUserServiceRequests(email) 
        }
        const repJson = { 
          success: true, 
          reports: getUserReports(email) 
        }
        
        const prevMapRaw = localStorage.getItem(`notif_prev:${notifKey(residentUser)}`)
        const prevMap = prevMapRaw ? JSON.parse(prevMapRaw) as Record<string, { status?: string; note?: string }> : {}
        const nextPrev: Record<string, { status?: string; note?: string }> = { ...prevMap }
        
        const cloudNotifs: NotificationItem[] = []
        const pushNotifs: NotificationItem[] = []

        // Process Cloud Notifications from all identifiers
        for (const notifData of notifResults) {
          if (notifData.success && Array.isArray(notifData.notifications)) {
            for (const n of notifData.notifications) {
              cloudNotifs.push({
                id: n._id,
                type: n.type || 'Reply',
                entityId: n.relatedId || '',
                message: n.message,
                createdAt: new Date(n.createdAt).getTime(),
                read: n.read || false
              })
            }
          }
        }

        const push = (type: 'ServiceRequest' | 'Report', idStr: string, status: string): void => {
          const item: NotificationItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type,
            entityId: idStr,
            message: `${type === 'ServiceRequest' ? 'Service request' : 'Report'} ${idStr} updated to ${status}`,
            createdAt: Date.now(),
            read: false
          }
          pushNotifs.push(item)
        }

        const pushReply = (type: 'ServiceRequest' | 'Report', idStr: string, message: string): void => {
          const item: NotificationItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type,
            entityId: idStr,
            message: `Reply on ${type === 'ServiceRequest' ? 'service request' : 'report'} ${idStr}: ${message}`,
            createdAt: Date.now(),
            read: false
          }
          pushNotifs.push(item)
        }

        if (reqJson && reqJson.success && Array.isArray(reqJson.serviceRequests)) {
          for (const r of reqJson.serviceRequests) {
            const idStr = String(r._id || r.id || r.requestId || '')
            const prev = prevMap[idStr] || {}
            const currStatus = String(r.status || '')
            const currNote = String(r.adminNotes || r.additionalInfo || '')
            nextPrev[idStr] = { status: currStatus, note: currNote }
            if (prev.status && prev.status !== currStatus) push('ServiceRequest', idStr, currStatus)
            if (currNote && prev.note !== currNote) pushReply('ServiceRequest', idStr, currNote)
          }
        }

        if (repJson && repJson.success && Array.isArray(repJson.reports)) {
          for (const rp of repJson.reports) {
            const idStr = String(rp._id || rp.id || rp.reportId || '')
            const prev = prevMap[idStr] || {}
            const currStatus = String(rp.status || '')
            const currNote = String(rp.response || '')
            nextPrev[idStr] = { status: currStatus, note: currNote }
            if (prev.status && prev.status !== currStatus) push('Report', idStr, currStatus)
            if (currNote && prev.note !== currNote) pushReply('Report', idStr, currNote)
          }
        }

        if (Object.keys(nextPrev).length > 0) {
          try { safeSetItem(`notif_prev:${notifKey(residentUser)}`, JSON.stringify(nextPrev)) } catch {}
        }

        setNotifications(prev => {
          const next = [...prev];
          let changed = false;
          
          for (const n of cloudNotifs) {
            if (!next.some(existing => existing.id === n.id)) {
              next.unshift(n);
              changed = true;
            }
          }
          
          for (const n of pushNotifs) {
            if (!next.some(existing => existing.id === n.id)) {
              next.unshift(n);
              changed = true;
            }
          }
          
          if (changed) {
            const final = next.slice(0, 100);
            persistNotifications(final);
            return final;
          }
          return prev;
        })
      } catch (err) {
        console.error('Polling error:', err)
      }
    }
    timer = setInterval(poll, 15000)
    poll()
    return () => { try { clearInterval(timer) } catch {} }
  }, [residentUser])



  const [latestAnnouncements, setLatestAnnouncements] = useState<Array<{ id: string; title: string; category: string; content: string; postedAt: string; eventDate?: string; priority: string }>>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState<boolean>(true)
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null)

  useEffect(() => {
    const load = (): void => {
      try {
        const stored = localStorage.getItem('barangay_announcements')
        const deletedIdsRaw = localStorage.getItem('deleted_barangay_announcements')
        const deletedIds: string[] = deletedIdsRaw ? JSON.parse(deletedIdsRaw) as string[] : []
        const anns = stored ? JSON.parse(stored) as Array<{ id: string; title: string; category: string; content: string; postedAt?: string; eventDate?: string; priority: string }> : []
        const visible = anns.filter(a => !deletedIds.includes(a.id))
        const sorted = visible.sort((a, b) => {
          const da = new Date(a.postedAt || a.eventDate || 0).getTime()
          const db = new Date(b.postedAt || b.eventDate || 0).getTime()
          return db - da
        })
        setLatestAnnouncements(sorted.slice(0, 3) as Array<{ id: string; title: string; category: string; content: string; postedAt: string; eventDate?: string; priority: string }>)
        setAnnouncementsError(null)
      } catch {
        setLatestAnnouncements([])
        setAnnouncementsError(null)
      } finally {
        setLoadingAnnouncements(false)
      }
    }
    const timer = setTimeout(() => load(), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleLoginSuccess = (official: { username: string; role: string; name: string }): void => {
    setLoggedInOfficial(official)
  }

  const handleLogout = (): void => {
    localStorage.removeItem('official')
    setLoggedInOfficial(null)
    setShowWelcome(true)
    setActiveTab('home')
    toast.success('Logged out successfully')
    try { router.replace('/login') } catch {}
  }

  const handleResidentContinue = (): void => {
    safeSetItem('visited_ugnayan', 'true')
    router.push('/login')
  }

  const handleResidentLoginSuccess = (): void => {
    try {
      const storedResident = localStorage.getItem('resident_user')
      if (storedResident) {
        const user = JSON.parse(storedResident) as { id: string; username: string; fullName: string; email: string; phone: string; address: string; isAdmin: boolean }
        setResidentUser(user)
      }
    } catch {
    }
  }

  const handleResidentLogout = (): void => {
    try {
      localStorage.removeItem('resident_user')
      localStorage.removeItem('spacetime_token')
    } catch {
    }
    setResidentUser(null)
    toast.success('Logged out successfully')
    try { router.replace('/login') } catch {}
  }

  // Official login click removed from resident dashboard

  if (loggedInOfficial) {
    return <OfficialDashboard officialInfo={loggedInOfficial} onLogout={handleLogout} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <>
      {showWelcome ? (
        <WelcomePage 
          onResidentContinue={handleResidentContinue}
        />
      ) : (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-white opacity-90" />
              <div>
                <h1 className="text-3xl font-bold">Ugnayan</h1>
                <p className="text-green-100 text-sm">Barangay Irisan Service Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/90 text-sm">Baguio City</span>
              <RealTimeClock />
              <NotificationsBell
                notifications={notifications}
                onMarkAllRead={markAllNotificationsRead}
                onClearAll={clearNotifications}
                onOpenCenter={() => setShowNotificationCenter(true)}
              />
              {residentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{(residentUser.fullName?.[0] || residentUser.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{residentUser.fullName}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleResidentLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setResidentLoginOpen(true)}
                  className="border-white text-white hover:bg-green-700"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Resident Login
                </Button>
              )}
              {/* Official Login button removed */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showNotificationCenter ? (
          <NotificationCenter 
            residentUser={residentUser} 
            onBack={() => setShowNotificationCenter(false)} 
            onNavigate={(tab) => {
              setActiveTab(tab)
              setShowNotificationCenter(false)
            }}
          />
        ) : (
          <>
            {/* Welcome Section - Now at the Top */}
            <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-none shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">Welcome to Barangay Irisan</CardTitle>
            <CardDescription className="text-green-100">
              Your digital gateway to community services and assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-2">
              Ugnayan is your one-stop platform for accessing barangay services, reporting issues, 
              and staying connected with our community in Baguio City.
            </p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid gap-2 bg-white p-2 shadow-md h-auto grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="home" className="flex flex-col items-center gap-1 py-3">
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex flex-col items-center gap-1 py-3">
              <FileText className="h-5 w-5" />
              <span className="text-xs">Services</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex flex-col items-center gap-1 py-3">
              <Map className="h-5 w-5" />
              <span className="text-xs">Map</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex flex-col items-center gap-1 py-3">
              <Bell className="h-5 w-5" />
              <span className="text-xs">News</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex flex-col items-center gap-1 py-3">
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex flex-col items-center gap-1 py-3">
              <Phone className="h-5 w-5" />
              <span className="text-xs">Emergency</span>
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6">
            {/* Emergency Contacts on Home */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">In Case of Emergency</h2>
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-red-600" />
                    Quick Contacts
                  </CardTitle>
                  <CardDescription>Immediate access to essential hotlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <span>911</span>
                          <span className="text-xs text-gray-500">24/7</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-2">National Emergency Hotline</p>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => window.location.href = 'tel:911'}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <span>(074) 123-4567</span>
                          <span className="text-xs text-gray-500">Office</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-2">Barangay Irisan Office</p>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => window.location.href = 'tel:0741234567'}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <span>(074) 442-4216</span>
                          <span className="text-xs text-gray-500">Hospital</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-2">Baguio General Hospital</p>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = 'tel:0744424216'}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => setActiveTab('emergency')}>
                      View full emergency list
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>



            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Latest Announcements</h2>
              {loadingAnnouncements && (
                <p className="text-gray-600">Loading announcements...</p>
              )}
              {!loadingAnnouncements && announcementsError && (
                <p className="text-red-600">{announcementsError}</p>
              )}
              {!loadingAnnouncements && !announcementsError && latestAnnouncements.length === 0 && (
                <p className="text-gray-600">No announcements yet.</p>
              )}
              {!loadingAnnouncements && !announcementsError && latestAnnouncements.length > 0 && (
                <div className="grid md:grid-cols-3 gap-4">
                  {latestAnnouncements.map((a) => (
                    <Card key={a.id} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{a.title}</CardTitle>
                        <CardDescription className="capitalize">{a.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 mb-2">{a.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(a.eventDate || a.postedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <Button
                          className="mt-3"
                          onClick={() => {
                            setActiveTab('announcements')
                            setTimeout(() => {
                              const el = document.getElementById(`announcement-${a.id}`)
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              }
                            }, 100)
                          }}
                        >
                          View
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Barangay Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Office Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Monday - Friday:</span>
                    <span>8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span className="font-medium">Weekends & Holidays:</span>
                    <span>Closed</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Address:</strong></p>
                  <p className="text-gray-700">Purok 18, Barangay Irisan</p>
                  <p className="text-gray-700">Baguio City, Benguet</p>
                  <p className="text-gray-700">Philippines 2600</p>
                </CardContent>
              </Card>
            </div>

            {/* Community Concerns */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Community Safety Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mountain className="h-6 w-6 text-red-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">Landslide Alerts</h4>
                      <p className="text-sm text-gray-600">Report hazardous areas and slopes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CloudRain className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold">Flood Monitoring</h4>
                      <p className="text-sm text-gray-600">Report flooding and drainage issues</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Requests Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex flex-col items-center justify-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Service Type</h2>
              <div className="inline-flex p-1 bg-gray-100 rounded-lg border border-gray-200">
                <Button 
                  variant={serviceSubTab === 'documents' ? 'default' : 'ghost'}
                  onClick={() => setServiceSubTab('documents')}
                  className={serviceSubTab === 'documents' ? 'bg-blue-600' : ''}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Document Requests
                </Button>
                <Button 
                  variant={serviceSubTab === 'blotter' ? 'default' : 'ghost'}
                  onClick={() => setServiceSubTab('blotter')}
                  className={serviceSubTab === 'blotter' ? 'bg-red-700' : ''}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Report Form
                </Button>
                <Button 
                  variant={serviceSubTab === 'report' ? 'default' : 'ghost'}
                  onClick={() => setServiceSubTab('report')}
                  className={serviceSubTab === 'report' ? 'bg-orange-600' : ''}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report Issues
                </Button>
                <Button 
                  variant={serviceSubTab === 'myrequests' ? 'default' : 'ghost'}
                  onClick={() => setServiceSubTab('myrequests')}
                  className={serviceSubTab === 'myrequests' ? 'bg-indigo-600' : ''}
                >
                  <Search className="mr-2 h-4 w-4" />
                  My Requests
                </Button>
              </div>
            </div>

            {serviceSubTab === 'documents' ? (
              <ServiceRequestForm onBack={() => setActiveTab('home')} residentUser={residentUser} initialCategory="document" />
            ) : serviceSubTab === 'blotter' ? (
              <BlotterForm onBack={() => setActiveTab('home')} />
            ) : serviceSubTab === 'report' ? (
              <ServiceRequestForm onBack={() => setActiveTab('home')} residentUser={residentUser} initialCategory="report" />
            ) : (
              <MyRequests residentUser={residentUser} onBack={() => setActiveTab('home')} />
            )}
          </TabsContent>

          {/* Community Map Tab */}
          <TabsContent value="map">
            <CommunityMapWrapper onBack={() => setActiveTab('home')} />
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <AnnouncementsBoard onBack={() => setActiveTab('home')} />
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <FeedbackSystem onBack={() => setActiveTab('home')} />
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency">
            <EmergencyContacts onBack={() => setActiveTab('home')} />
          </TabsContent>
        </Tabs>
          </>
        )}
      </main>

      {/* Modals */}

      <UserLogin
        open={residentLoginOpen}
        onOpenChange={setResidentLoginOpen}
        onLoginSuccess={handleResidentLoginSuccess}
        onRegisterClick={() => {
          setResidentLoginOpen(false)
          setResidentRegisterOpen(true)
        }}
      />

      <UserRegistration
        open={residentRegisterOpen}
        onOpenChange={setResidentRegisterOpen}
        onSuccess={() => {
          setResidentRegisterOpen(false)
          setResidentLoginOpen(true)
        }}
      />

      {/* Chatbot Widget */}
      <ChatbotWidget onNavigate={setActiveTab} />

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3">About Ugnayan</h3>
              <p className="text-gray-300 text-sm">
                A community-based barangay service management system designed to enhance 
                accessibility, transparency, and efficiency in Barangay Irisan.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="hover:text-white cursor-pointer" onClick={() => setActiveTab('services')}>Request Services</li>
                <li className="hover:text-white cursor-pointer" onClick={() => setActiveTab('emergency')}>Emergency Contacts</li>
                <li className="hover:text-white cursor-pointer" onClick={() => setActiveTab('feedback')}>Send Feedback</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-3">Contact Information</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>📞 Barangay Hall: (074) 123-4567</li>
                <li>📧 Email: irisan.baguio@gmail.com</li>
                <li>📍 Purok 18, Barangay Irisan, Baguio City</li>
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
      )}
      {/* Official login modal removed */}
    </>
  )
}
