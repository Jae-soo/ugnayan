'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Identity } from '@clockworklabs/spacetimedb-sdk'
import * as moduleBindings from '../../index'
import { safeSetItem } from '@/lib/storage'

type DbConnection = moduleBindings.DbConnection
type EventContext = moduleBindings.EventContext
type UserProfile = moduleBindings.UserProfile
type ServiceRequest = moduleBindings.ServiceRequest
type Report = moduleBindings.Report
type Announcement = moduleBindings.Announcement
type AuthEvent = moduleBindings.AuthEvent

export interface SpacetimeState {
  connected: boolean
  identity: Identity | null
  statusMessage: string
  userProfile: UserProfile | null
  connection: DbConnection | null
  serviceRequests: ServiceRequest[]
  reports: Report[]
  announcements: Announcement[]
  notifications: Array<{
    id: string
    type: 'ServiceRequest' | 'Report'
    entityId: string
    message: string
    createdAt: number
    read: boolean
  }>
}

export interface SpacetimeActions {
  registerUser: (
    username: string,
    password: string,
    email: string,
    phone: string,
    fullName: string,
    address: string
  ) => void
  loginUser: (username: string, password: string) => void
  logoutUser: () => void
  createServiceRequest: (
    fullName: string,
    email: string,
    phone: string,
    address: string,
    documentType: any,
    purpose: string
  ) => void
  createReport: (
    reportType: any,
    priority: any,
    fullName: string,
    email: string,
    phone: string,
    location: string,
    description: string
  ) => void
  submitFeedback: (serviceId: number, rating: number, comment: string) => void
  updateUserProfile: (email: string, phone: string, address: string) => void
  queryMyServiceRequests: () => void
  queryMyReports: () => void
  queryAllAnnouncements: () => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
}

export function useSpacetimeDB(): SpacetimeState & SpacetimeActions {
  type NotificationItem = {
    id: string
    type: 'ServiceRequest' | 'Report'
    entityId: string
    message: string
    createdAt: number
    read: boolean
  }

  const [connected, setConnected] = useState(false)
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [statusMessage, setStatusMessage] = useState('Connecting to database...')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  
  const connectionRef = useRef<DbConnection | null>(null)
  const isActiveRef = useRef<boolean>(true)
  const subscriptionRef = useRef<any>(null)

  const notificationsKey = (): string => {
    const idHex = identity ? identity.toHexString() : 'anonymous'
    return `notifications:${idHex}`
  }

  const persistNotifications = (items: NotificationItem[]): void => {
    try { safeSetItem(notificationsKey(), JSON.stringify(items)) } catch {}
  }

  const addNotification = (item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'> & { message: string }): void => {
    const newItem: NotificationItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: item.type,
      entityId: item.entityId,
      message: item.message,
      createdAt: Date.now(),
      read: false
    }
    setNotifications(prev => {
      const next = [newItem, ...prev].slice(0, 100)
      persistNotifications(next)
      return next
    })
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

  // Subscribe to tables
  const subscribeToTables = useCallback(() => {
    if (!connectionRef.current) return
    
    console.log('Subscribing to SpacetimeDB tables...')
    
    const queries = [
      'SELECT * FROM user_profiles',
      'SELECT * FROM service_requests',
      'SELECT * FROM reports',
      'SELECT * FROM announcements',
      'SELECT * FROM auth_events'
    ]
    
    connectionRef.current
      .subscriptionBuilder()
      .onApplied(() => {
        console.log('Subscription applied successfully')
        processInitialCache()
      })
      .onError((error: Error) => {
        console.error('Subscription error:', error)
        setStatusMessage(`Subscription error: ${error.message}`)
      })
      .subscribe(queries)
    try {
      // Store subscription handle if SDK returns one
      const builder: any = connectionRef.current.subscriptionBuilder()
      const handle = builder.onApplied(() => {}).onError(() => {}).subscribe(queries)
      subscriptionRef.current = handle || null
    } catch {}
  }, [])

  // Process initial cache data
  const processInitialCache = useCallback(() => {
    if (!connectionRef.current) return
    console.log('Processing initial cache...')
    
    // Load service requests
    const requests: ServiceRequest[] = []
    for (const req of connectionRef.current.db.serviceRequests.iter()) {
      requests.push(req)
    }
    setServiceRequests(requests)
    
    // Load reports
    const reps: Report[] = []
    for (const rep of connectionRef.current.db.reports.iter()) {
      reps.push(rep)
    }
    setReports(reps)
    
    // Load announcements
    const anns: Announcement[] = []
    for (const ann of connectionRef.current.db.announcements.iter()) {
      anns.push(ann)
    }
    setAnnouncements(anns)
    
    // Load current user profile
    if (identity) {
      const profile = connectionRef.current.db.userProfiles.identity().find(identity)
      if (profile) {
        setUserProfile(profile)
      }
    }
    try {
      const raw = localStorage.getItem(notificationsKey())
      const parsed: NotificationItem[] = raw ? JSON.parse(raw) : []
      setNotifications(parsed)
    } catch {}
  }, [identity])

  // Register table callbacks for live updates
  const registerTableCallbacks = useCallback((currentIdentity: Identity) => {
    if (!connectionRef.current) return
    
    console.log('Registering table callbacks...')

    // User profiles
    connectionRef.current.db.userProfiles.onInsert((_ctx: EventContext | undefined, profile: UserProfile) => {
      if (!isActiveRef.current) return
      if (profile.identity.toHexString() === currentIdentity.toHexString()) {
        setUserProfile(profile)
        console.log('User profile loaded:', profile.username)
      }
    })

    connectionRef.current.db.userProfiles.onUpdate((_ctx: EventContext | undefined, _old: UserProfile, profile: UserProfile) => {
      if (!isActiveRef.current) return
      if (profile.identity.toHexString() === currentIdentity.toHexString()) {
        setUserProfile(profile)
        console.log('User profile updated')
      }
    })

    // Service requests
    connectionRef.current.db.serviceRequests.onInsert((_ctx: EventContext | undefined, req: ServiceRequest) => {
      if (!isActiveRef.current) return
      setServiceRequests(prev => [...prev, req])
    })

    connectionRef.current.db.serviceRequests.onUpdate((_ctx: EventContext | undefined, old: ServiceRequest, req: ServiceRequest) => {
      if (!isActiveRef.current) return
      setServiceRequests(prev => prev.map(r => r.requestId === req.requestId ? req : r))
      const mine = req.userIdentity.toHexString() === currentIdentity.toHexString()
      const changed = old.status !== req.status
      if (mine && changed) {
        const statusText = (moduleBindings as any).ServiceRequestStatus[req.status]
        addNotification({
          type: 'ServiceRequest',
          entityId: String(req.requestId),
          message: `Service request ${String(req.requestId)} updated to ${statusText}`
        })
      }
    })

    connectionRef.current.db.serviceRequests.onDelete((_ctx: EventContext, req: ServiceRequest) => {
      if (!isActiveRef.current) return
      setServiceRequests(prev => prev.filter(r => r.requestId !== req.requestId))
    })

    // Reports
    connectionRef.current.db.reports.onInsert((_ctx: EventContext | undefined, rep: Report) => {
      if (!isActiveRef.current) return
      setReports(prev => [...prev, rep])
    })

    connectionRef.current.db.reports.onUpdate((_ctx: EventContext | undefined, old: Report, rep: Report) => {
      if (!isActiveRef.current) return
      setReports(prev => prev.map(r => r.reportId === rep.reportId ? rep : r))
      const mine = rep.userIdentity.toHexString() === currentIdentity.toHexString()
      const changed = old.status !== rep.status
      if (mine && changed) {
        const statusText = (moduleBindings as any).ReportStatus[rep.status]
        addNotification({
          type: 'Report',
          entityId: String(rep.reportId),
          message: `Report ${String(rep.reportId)} updated to ${statusText}`
        })
      }
    })

    connectionRef.current.db.reports.onDelete((_ctx: EventContext, rep: Report) => {
      if (!isActiveRef.current) return
      setReports(prev => prev.filter(r => r.reportId !== rep.reportId))
    })

    // Announcements
    connectionRef.current.db.announcements.onInsert((_ctx: EventContext | undefined, ann: Announcement) => {
      if (!isActiveRef.current) return
      setAnnouncements(prev => [...prev, ann])
    })

    connectionRef.current.db.announcements.onDelete((_ctx: EventContext, ann: Announcement) => {
      if (!isActiveRef.current) return
      setAnnouncements(prev => prev.filter(a => a.announcementId !== ann.announcementId))
    })

    // Auth events - listen for login responses
    connectionRef.current.db.authEvents.onInsert((_ctx: EventContext | undefined, authEvent: AuthEvent) => {
      if (!isActiveRef.current) return
      if (authEvent.identity.toHexString() === currentIdentity.toHexString()) {
        console.log('Auth event:', authEvent.message)
        setStatusMessage(authEvent.message)
      }
    })
  }, [])

  // Initialize connection
  useEffect(() => {
    isActiveRef.current = true
    if (connectionRef.current) {
      console.log('Connection already established')
      return
    }

    const dbHost = 'wss://maincloud.spacetimedb.com'
    const dbName = process.env.NEXT_PUBLIC_SPACETIME_MODULE_NAME || 'ugnayan-barangay'

    const onConnect = (connection: DbConnection, id: Identity, token: string) => {
      console.log('Connected to SpacetimeDB!')
      connectionRef.current = connection
      setIdentity(id)
      setConnected(true)
      safeSetItem('spacetime_token', token)
      setStatusMessage(`Connected as ${id.toHexString().substring(0, 8)}...`)
      
      // Set up subscriptions and callbacks
      subscribeToTables()
      registerTableCallbacks(id)
    }

    const onDisconnect = (_ctx: any, reason?: Error | null) => {
      const reasonStr = reason ? reason.message : 'No reason given'
      console.log('Disconnected:', reasonStr)
      setStatusMessage(`Disconnected: ${reasonStr}`)
      connectionRef.current = null
      setIdentity(null)
      setConnected(false)
    }

    moduleBindings.DbConnection.builder()
      .withUri(dbHost)
      .withModuleName(dbName)
      .withToken(localStorage.getItem('spacetime_token') || '')
      .onConnect(onConnect)
      .onDisconnect(onDisconnect)
      .build()
    return () => {
      isActiveRef.current = false
      try {
        if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') {
          subscriptionRef.current.unsubscribe()
        }
      } catch {}
      connectionRef.current = null
      setIdentity(null)
      setConnected(false)
      setUserProfile(null)
      setServiceRequests([])
      setReports([])
      setAnnouncements([])
    }
  }, [subscribeToTables, registerTableCallbacks])

  const logoutUser = useCallback(() => {
    isActiveRef.current = false
    try { localStorage.removeItem('spacetime_token') } catch {}
    try { if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') { subscriptionRef.current.unsubscribe() } } catch {}
    try {
      const conn: any = connectionRef.current
      if (conn && typeof conn.disconnect === 'function') {
        conn.disconnect()
      } else if (conn && typeof conn.close === 'function') {
        conn.close()
      }
    } catch {}
    connectionRef.current = null
    setIdentity(null)
    setConnected(false)
    setStatusMessage('Disconnected')
    setUserProfile(null)
    setServiceRequests([])
    setReports([])
    setAnnouncements([])
  }, [])

  // Reducer actions
  const registerUser = useCallback((
    username: string,
    password: string,
    email: string,
    phone: string,
    fullName: string,
    address: string
  ) => {
    if (!connectionRef.current) return
    connectionRef.current.reducers.registerUser(username, password, email, phone, fullName, address)
  }, [])

  const loginUser = useCallback((username: string, password: string) => {
    if (!connectionRef.current) return
    connectionRef.current.reducers.loginUser(username, password)
  }, [])

  const createServiceRequest = useCallback((
    fullName: string,
    email: string,
    phone: string,
    address: string,
    documentType: any,
    purpose: string
  ) => {
    if (!connectionRef.current) return
    connectionRef.current.reducers.createServiceRequest(fullName, email, phone, address, documentType, purpose)
  }, [])

  const createReport = useCallback((
    reportType: any,
    priority: any,
    fullName: string,
    email: string,
    phone: string,
    location: string,
    description: string
  ) => {
    if (!connectionRef.current) return
    connectionRef.current.reducers.createReport(reportType, priority, fullName, email, phone, location, description)
  }, [])

  const submitFeedback = useCallback((serviceId: number, rating: number, comment: string) => {
    if (!connectionRef.current) return
    connectionRef.current.reducers.submitFeedback(BigInt(serviceId), rating, comment)
  }, [])

  const updateUserProfile = useCallback((email: string, phone: string, address: string) => {
    if (!connectionRef.current) return
    connectionRef.current.reducers.updateUserProfile(email, phone, address)
  }, [])

  const queryMyServiceRequests = useCallback(() => {
    if (!connectionRef.current) return
    // Query only my requests, no filters, limit 100
    connectionRef.current.reducers.queryServiceRequests(
      true, // only_mine
      false, // use_status
      moduleBindings.ServiceRequestStatus.Pending, // status (not used)
      false, // use_document_type
      moduleBindings.DocumentType.Clearance, // document_type (not used)
      100 // limit
    )
  }, [])

  const queryMyReports = useCallback(() => {
    if (!connectionRef.current) return
    connectionRef.current.reducers.queryReports(
      true, // only_mine
      false, // use_status
      moduleBindings.ReportStatus.Pending, // status (not used)
      false, // use_type
      moduleBindings.ReportType.Emergency, // report_type (not used)
      false, // use_priority
      moduleBindings.Priority.Low, // priority (not used)
      100 // limit
    )
  }, [])

  const queryAllAnnouncements = useCallback(() => {
    if (!connectionRef.current) return
    connectionRef.current.reducers.queryAnnouncements(
      false, // use_category
      moduleBindings.AnnouncementCategory.General, // category (not used)
      false, // use_priority
      moduleBindings.Priority.Low, // priority (not used)
      100 // limit
    )
  }, [])

  return {
    connected,
    identity,
    statusMessage,
    userProfile,
    connection: connectionRef.current,
    serviceRequests,
    reports,
    announcements,
    notifications,
    registerUser,
    loginUser,
    logoutUser,
    createServiceRequest,
    createReport,
    submitFeedback,
    updateUserProfile,
    queryMyServiceRequests,
    queryMyReports,
    queryAllAnnouncements,
    markAllNotificationsRead,
    clearNotifications,
  }
}
