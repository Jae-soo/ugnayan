'use client'

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
  UserCircle,
  LogOut,
  TrendingUp,
  Search
} from 'lucide-react'
import ServiceRequestForm from '@/components/ServiceRequestForm'
import MyRequests from '@/components/MyRequests'
import BlotterForm from '@/components/BlotterForm'
import CommunityMap from '@/components/CommunityMap'
import AnnouncementsBoard from '@/components/AnnouncementsBoard'
import FeedbackSystem from '@/display/FeedbackSystem'
import EmergencyContacts from '@/display/EmergencyContacts'
import RealTimeClock from '@/components/RealTimeClock'
import ChatbotWidget from '@/components/ChatbotWidget'
import UserRegistration from '@/components/UserRegistration'
import UserLogin from '@/components/UserLogin'
import UserProfile from '@/components/UserProfile'
import { useSpacetimeDB } from '@/hooks/useSpacetime'
import { useNotifications } from '@/hooks/useNotifications'
import { sdk } from "@farcaster/miniapp-sdk"
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import NotificationsBell from '@/components/NotificationsBell'
import NotificationCenter from '@/components/NotificationCenter'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ServiceRequest, Report } from '@/lib/types'
import { getServiceRequests, getReports, getUserServiceRequests, getUserReports } from '@/lib/storage'

function ResidentAnalytics(): React.JSX.Element {
  const [serviceRequests, setServiceRequests] = React.useState<ServiceRequest[]>([])
  const [reports, setReports] = React.useState<Report[]>([])
  React.useEffect(() => {
    let email: string | null = null
    try {
      const stored = localStorage.getItem('resident_user')
      if (stored) {
        const u = JSON.parse(stored) as { email?: string }
        email = u?.email || null
      }
    } catch {}
    if (email) {
      setServiceRequests(getUserServiceRequests(email))
      setReports(getUserReports(email))
    } else {
      setServiceRequests(getServiceRequests())
      setReports(getReports())
    }
  }, [])
  return (
    <div className="space-y-6 mt-2 md:mt-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {serviceRequests.filter(r => r.status === 'completed' || r.status === 'ready').length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Reports</CardTitle>
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
            <CardTitle className="text-sm font-medium">Open Items</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceRequests.filter(r => r.status === 'pending' || r.status === 'in-progress').length + reports.filter(r => r.status === 'pending' || r.status === 'in-progress').length}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'pending', value: serviceRequests.filter(r => r.status === 'pending').length },
                    { name: 'in-progress', value: serviceRequests.filter(r => r.status === 'in-progress').length },
                    { name: 'ready', value: serviceRequests.filter(r => r.status === 'ready').length },
                    { name: 'completed', value: serviceRequests.filter(r => r.status === 'completed').length },
                    { name: 'rejected', value: serviceRequests.filter(r => r.status === 'rejected').length },
                  ]}
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
            <CardTitle>Report Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'pending', value: reports.filter(r => r.status === 'pending').length },
                  { name: 'in-progress', value: reports.filter(r => r.status === 'in-progress').length },
                  { name: 'resolved', value: reports.filter(r => r.status === 'resolved').length },
                  { name: 'rejected', value: reports.filter(r => r.status === 'rejected').length },
                ]}
                maxBarSize={50}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Types</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(serviceRequests.reduce<Record<string, number>>((acc, r) => {
                  const key = (r.documentType || 'unknown').toLowerCase()
                  acc[key] = (acc[key] || 0) + 1
                  return acc
                }, {})).map(([name, value]) => ({ name, value }))}
                maxBarSize={50}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8884d8" />
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
              <BarChart
                data={Object.entries(reports.reduce<Record<string, number>>((acc, r) => {
                  const key = (r.reportType || 'unknown').toLowerCase()
                  acc[key] = (acc[key] || 0) + 1
                  return acc
                }, {})).map(([name, value]) => ({ name, value }))}
                maxBarSize={50}
              >
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
    </div>
  )
}

export default function UgnayanAppWithAuth(): React.JSX.Element {
  const router = useRouter()
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
          console.log("Farcaster SDK initialized successfully");
        } catch (error) {
          console.error('Failed to initialize Farcaster SDK:', error);
        }
      };
      initializeFarcaster();
    }, [])

  const { connected, userProfile, statusMessage, logoutUser } = useSpacetimeDB()
  const { notifications, markAllRead, clearAll } = useNotifications()
  const [activeTab, setActiveTab] = useState<string>('home')
  const [serviceSubTab, setServiceSubTab] = useState<'documents' | 'report' | 'myrequests'>('documents')
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false)
  const [loginOpen, setLoginOpen] = useState<boolean>(false)
  // Removed official login modal for residents
  const [registerOpen, setRegisterOpen] = useState<boolean>(false)
  const [profileOpen, setProfileOpen] = useState<boolean>(false)
  // Official login/state removed from resident dashboard

  const handleUserLoginSuccess = (): void => {
    toast.success('Welcome back!')
  }

  const handleRegisterSuccess = (): void => {
    toast.success('Registration successful! You are now logged in.')
  }

  // Official logout removed from resident dashboard

  return (
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
                onMarkAllRead={markAllRead}
                onClearAll={clearAll}
                onOpenCenter={() => setShowNotificationCenter(true)}
              />
              
              {/* Connection Status */}
              {!connected && (
                <span className="text-yellow-200 text-sm">{statusMessage}</span>
              )}
              
              {/* User Status */}
              {userProfile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{(userProfile.fullName?.[0] || userProfile.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white">{userProfile.fullName}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                      <UserCircle className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      try { localStorage.removeItem('resident_user') } catch {}
                      logoutUser()
                      toast.success('Logged out successfully')
                      try { router.replace('/login') } catch {}
                    }}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setLoginOpen(true)}
                  className="bg-white text-green-700 hover:bg-green-50"
                  disabled={!connected}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {connected ? 'Sign In' : 'Connecting...'}
                </Button>
              )}
              
              {/* Official login removed from resident dashboard */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showNotificationCenter ? (
          <NotificationCenter 
            residentUser={userProfile} 
            onBack={() => setShowNotificationCenter(false)} 
            onNavigate={(tab) => {
              setActiveTab(tab)
              setShowNotificationCenter(false)
            }}
          />
        ) : (
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
            <TabsTrigger value="myrequests" className="flex flex-col items-center gap-1 py-3">
              <Users className="h-5 w-5" />
              <span className="text-xs">My Requests</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 py-3">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Analytics</span>
            </TabsTrigger>
            {/* Admin tab removed from resident dashboard */}
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-6">
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-3xl">Welcome to Barangay Irisan</CardTitle>
                <CardDescription className="text-green-100">
                  {userProfile ? `Hello, ${userProfile.fullName}! ` : ''}
                  Your digital gateway to community services and assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">
                  Ugnayan is your one-stop platform for accessing barangay services, reporting issues, 
                  and staying connected with our community in Baguio City.
                </p>
                {!userProfile && (
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-4">
                    <p className="text-sm mb-3">Create an account to access all services and track your requests!</p>
                    <Button 
                      variant="secondary" 
                      onClick={() => setRegisterOpen(true)}
                      className="bg-white text-green-700 hover:bg-green-50"
                      disabled={!connected}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      {connected ? 'Create Account' : 'Connecting...'}
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => setActiveTab('services')}
                    className="bg-white text-green-700 hover:bg-green-50"
                  >
                    Request Services
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Services */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Quick Access Services</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => setActiveTab('services')}
                >
                  <CardHeader>
                    <FileText className="h-10 w-10 text-blue-600 mb-2" />
                    <CardTitle className="text-lg">Document Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Request barangay clearance, certificates, and permits online
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => setActiveTab('map')}
                >
                  <CardHeader>
                    <Map className="h-10 w-10 text-green-600 mb-2" />
                    <CardTitle className="text-lg">Community Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      View transportation and hazard zones
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => setActiveTab('announcements')}
                >
                  <CardHeader>
                    <Bell className="h-10 w-10 text-purple-600 mb-2" />
                    <CardTitle className="text-lg">Announcements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Stay updated with community news and events
                    </p>
                  </CardContent>
                </Card>
              </div>
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
                  <div className="flex justify-between">
                    <span className="font-medium">Saturday:</span>
                    <span>8:00 AM - 12:00 PM</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span className="font-medium">Sunday:</span>
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

          {/* Other Tabs */}
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
              <ServiceRequestForm onBack={() => setActiveTab('home')} residentUser={userProfile} initialCategory="document" />
            ) : serviceSubTab === 'report' ? (
              <ServiceRequestForm onBack={() => setActiveTab('home')} residentUser={userProfile} initialCategory="report" />
            ) : (
              <MyRequests residentUser={userProfile} onBack={() => setActiveTab('home')} />
            )}
          </TabsContent>
          <TabsContent value="map"><CommunityMap /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsBoard /></TabsContent>
          <TabsContent value="feedback"><FeedbackSystem /></TabsContent>
          <TabsContent value="emergency"><EmergencyContacts /></TabsContent>
          <TabsContent value="myrequests"><MyRequests /></TabsContent>
          <TabsContent value="analytics">
            <ResidentAnalytics />
          </TabsContent>

          {/* Admin dashboard removed from resident dashboard */}
        </Tabs>
         )}
      </main>

      {/* Modals */}
      
      <UserLogin
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onLoginSuccess={handleUserLoginSuccess}
        onRegisterClick={() => {
          setLoginOpen(false)
          setRegisterOpen(true)
        }}
      />
      
      <UserRegistration
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSuccess={handleRegisterSuccess}
      />
      
      <UserProfile
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      {/* Chatbot Widget */}
      <ChatbotWidget />

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3">About Ugnayan</h3>
              <p className="text-gray-300 text-sm">
                A community-based barangay service management system with real-time data persistence using SpacetimeDB.
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
            <p>&copy; 2025 Barangay Irisan. Developed with SpacetimeDB.</p>
            <p className="mt-1">Dalog, De Vera, Manzano</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
