'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Identity } from '@clockworklabs/spacetimedb-sdk'
import * as moduleBindings from '../index'
import { safeSetItem } from './code/lib/storage'

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
}

export function useSpacetimeDB(): SpacetimeState & SpacetimeActions {
  const [connected, setConnected] = useState(false)
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [statusMessage, setStatusMessage] = useState('Connecting to database...')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  
  const connectionRef = useRef<DbConnection | null>(null)

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
  }, [identity])

  // Register table callbacks for live updates
  const registerTableCallbacks = useCallback((currentIdentity: Identity) => {
    if (!connectionRef.current) return
    
    console.log('Registering table callbacks...')

    // User profiles
    connectionRef.current.db.userProfiles.onInsert((_ctx: EventContext | undefined, profile: UserProfile) => {
      if (profile.identity.toHexString() === currentIdentity.toHexString()) {
        setUserProfile(profile)
        console.log('User profile loaded:', profile.username)
      }
    })

    connectionRef.current.db.userProfiles.onUpdate((_ctx: EventContext | undefined, _old: UserProfile, profile: UserProfile) => {
      if (profile.identity.toHexString() === currentIdentity.toHexString()) {
        setUserProfile(profile)
        console.log('User profile updated')
      }
    })

    // Service requests
    connectionRef.current.db.serviceRequests.onInsert((_ctx: EventContext | undefined, req: ServiceRequest) => {
      setServiceRequests(prev => [...prev, req])
    })

    connectionRef.current.db.serviceRequests.onUpdate((_ctx: EventContext | undefined, _old: ServiceRequest, req: ServiceRequest) => {
      setServiceRequests(prev => prev.map(r => r.requestId === req.requestId ? req : r))
    })

    connectionRef.current.db.serviceRequests.onDelete((_ctx: EventContext, req: ServiceRequest) => {
      setServiceRequests(prev => prev.filter(r => r.requestId !== req.requestId))
    })

    // Reports
    connectionRef.current.db.reports.onInsert((_ctx: EventContext | undefined, rep: Report) => {
      setReports(prev => [...prev, rep])
    })

    connectionRef.current.db.reports.onUpdate((_ctx: EventContext | undefined, _old: Report, rep: Report) => {
      setReports(prev => prev.map(r => r.reportId === rep.reportId ? rep : r))
    })

    connectionRef.current.db.reports.onDelete((_ctx: EventContext, rep: Report) => {
      setReports(prev => prev.filter(r => r.reportId !== rep.reportId))
    })

    // Announcements
    connectionRef.current.db.announcements.onInsert((_ctx: EventContext | undefined, ann: Announcement) => {
      setAnnouncements(prev => [...prev, ann])
    })

    connectionRef.current.db.announcements.onDelete((_ctx: EventContext, ann: Announcement) => {
      setAnnouncements(prev => prev.filter(a => a.announcementId !== ann.announcementId))
    })

    // Auth events - listen for login responses
    connectionRef.current.db.authEvents.onInsert((_ctx: EventContext | undefined, authEvent: AuthEvent) => {
      if (authEvent.identity.toHexString() === currentIdentity.toHexString()) {
        console.log('Auth event:', authEvent.message)
        setStatusMessage(authEvent.message)
      }
    })
  }, [])

  // Initialize connection
  useEffect(() => {
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
      .withToken(typeof window !== 'undefined' ? localStorage.getItem('spacetime_token') || '' : '')
      .onConnect(onConnect)
      .onDisconnect(onDisconnect)
      .build()
  }, [subscribeToTables, registerTableCallbacks])

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
    registerUser,
    loginUser,
    createServiceRequest,
    createReport,
    submitFeedback,
    updateUserProfile,
    queryMyServiceRequests,
    queryMyReports,
    queryAllAnnouncements,
  }
}
