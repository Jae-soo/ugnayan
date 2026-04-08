'use client'

import { useState, useEffect, useCallback } from 'react'
import { getServiceRequests as getLocalServiceRequests, getReports as getLocalReports, updateServiceRequestStatus as updateLocalServiceRequestStatus, updateReportStatus as updateLocalReportStatus, getSyncServerId, setSyncMapEntry, safeSetItem } from '@/lib/storage'

export interface UserProfile {
  id: string
  username: string
  email: string
  phone: string
  fullName: string
  address: string
  isAdmin: boolean
}

export interface ServiceRequestItem {
  id: string
  userId: string
  fullName: string
  email: string
  phone: string
  address: string
  documentType: string
  purpose: string
  status: string
  submittedAt: Date
  updatedAt: Date
}

export interface ReportItem {
  id: string
  userId: string
  reportType: string
  priority: string
  fullName: string
  email: string
  phone: string
  location: string
  description: string
  status: string
  submittedAt: Date
  updatedAt: Date
}

export interface AnnouncementItem {
  id: string
  adminId: string
  category: string
  priority: string
  title: string
  content: string
  postedAt: Date
  updatedAt: Date
}

export interface DatabaseState {
  authenticated: boolean
  userProfile: UserProfile | null
  statusMessage: string
  serviceRequests: ServiceRequestItem[]
  reports: ReportItem[]
  announcements: AnnouncementItem[]
}

export interface DatabaseActions {
  registerUser: (
    username: string,
    password: string,
    email: string,
    phone: string,
    fullName: string,
    address: string
  ) => Promise<void>
  loginUser: (username: string, password: string) => Promise<void>
  logoutUser: () => void
  createServiceRequest: (
    fullName: string,
    email: string,
    phone: string,
    address: string,
    documentType: string,
    purpose: string
  ) => Promise<void>
  createReport: (
    reportType: string,
    priority: string,
    fullName: string,
    email: string,
    phone: string,
    location: string,
    description: string
  ) => Promise<void>
  fetchServiceRequests: (userId?: string) => Promise<void>
  fetchReports: (userId?: string) => Promise<void>
  fetchAnnouncements: () => Promise<void>
  updateServiceRequestStatus: (id: string, status: string) => Promise<void>
  updateReportStatus: (id: string, status: string) => Promise<void>
}

export function useDatabase(): DatabaseState & DatabaseActions {
  const [authenticated, setAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [statusMessage, setStatusMessage] = useState('Ready')
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestItem[]>([])
  const [reports, setReports] = useState<ReportItem[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ugnayan_user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      setUserProfile(user)
      setAuthenticated(true)
      setStatusMessage(`Welcome back, ${user.fullName}`)
    }
  }, [])

  // Fetch announcements on mount
  useEffect(() => {
    fetchAnnouncements()
  }, [])

  useEffect(() => {
    const trySync = async (): Promise<void> => {
      try {
        const res = await fetch('/api/db/health', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data.status !== 'healthy') return
        await syncLocalData()
      } catch {}
    }
    trySync()
    const onlineHandler = (): void => { void syncLocalData() }
    if (typeof window !== 'undefined') {
      window.addEventListener('online', onlineHandler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onlineHandler)
      }
    }
  }, [])

  const registerUser = useCallback(async (
    username: string,
    password: string,
    email: string,
    phone: string,
    fullName: string,
    address: string
  ) => {
    try {
      setStatusMessage('Registering...')
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', username, password, email, phone, fullName, address }),
      })

      const data = await response.json()

      if (data.success) {
        setStatusMessage('Registration successful! Please login.')
      } else {
        setStatusMessage(data.message || 'Registration failed')
      }
    } catch (error: unknown) {
      console.error('Registration error:', error)
      setStatusMessage('Registration failed')
    }
  }, [])

  const loginUser = useCallback(async (username: string, password: string) => {
    try {
      setStatusMessage('Logging in...')
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      })

      const data = await response.json()

      if (data.success && data.user) {
        setUserProfile(data.user)
        setAuthenticated(true)
        safeSetItem('ugnayan_user', JSON.stringify(data.user))
        setStatusMessage(`Welcome, ${data.user.fullName}!`)
        
        // Fetch user's data
        await fetchServiceRequests(data.user.id)
        await fetchReports(data.user.id)
      } else {
        setStatusMessage(data.message || 'Login failed')
      }
    } catch (error: unknown) {
      console.error('Login error:', error)
      setStatusMessage('Login failed')
    }
  }, [])

  const logoutUser = useCallback(() => {
    setUserProfile(null)
    setAuthenticated(false)
    setServiceRequests([])
    setReports([])
    localStorage.removeItem('ugnayan_user')
    setStatusMessage('Logged out successfully')
  }, [])

  const createServiceRequest = useCallback(async (
    fullName: string,
    email: string,
    phone: string,
    address: string,
    documentType: string,
    purpose: string
  ) => {
    if (!userProfile) {
      setStatusMessage('Please login first')
      return
    }

    try {
      setStatusMessage('Submitting service request...')
      const response = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          fullName,
          email,
          phone,
          address,
          documentType,
          purpose,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStatusMessage('Service request submitted successfully')
        await fetchServiceRequests(userProfile.id)
      } else {
        setStatusMessage(data.message || 'Failed to submit service request')
        const local = getLocalServiceRequests().filter(r => !userProfile || !userProfile.id || !('userId' in r) || r.email === email)
        setServiceRequests(local as unknown as ServiceRequestItem[])
      }
    } catch (error: unknown) {
      const local = getLocalServiceRequests().filter(r => r.email === email)
      setServiceRequests(local as unknown as ServiceRequestItem[])
      setStatusMessage('Saved locally')
    }
  }, [userProfile])

  const createReport = useCallback(async (
    reportType: string,
    priority: string,
    fullName: string,
    email: string,
    phone: string,
    location: string,
    description: string
  ) => {
    if (!userProfile) {
      setStatusMessage('Please login first')
      return
    }

    try {
      setStatusMessage('Submitting issue report...')
      const response = await fetch('/api/service-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          type: reportType,
          priority,
          residentName: fullName,
          residentEmail: email,
          residentPhone: phone,
          location,
          description,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStatusMessage('Issue report submitted successfully')
        await fetchServiceRequests(userProfile.id)
      } else {
        setStatusMessage(data.message || 'Failed to submit issue report')
      }
    } catch (error: unknown) {
      console.error('Issue report error:', error)
      setStatusMessage('Failed to submit issue report')
    }
  }, [userProfile, fetchServiceRequests])

  const fetchServiceRequests = useCallback(async (userId?: string) => {
    try {
      const url = userId ? `/api/service-request?email=${userId}` : '/api/service-request'
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        const items = data.serviceRequests || data.requests || []
        const reqs = items.filter((r: any) => r.type === 'document')
        const reps = items.filter((r: any) => r.type !== 'document')
        setServiceRequests(reqs as unknown as ServiceRequestItem[])
        setReports(reps as unknown as ReportItem[])
      } else {
        const local = getLocalServiceRequests()
        setServiceRequests(local as unknown as ServiceRequestItem[])
        const localReps = getLocalReports()
        setReports(localReps as unknown as ReportItem[])
      }
    } catch (error: unknown) {
      const local = getLocalServiceRequests()
      setServiceRequests(local as unknown as ServiceRequestItem[])
      const localReps = getLocalReports()
      setReports(localReps as unknown as ReportItem[])
    }
  }, [])

  const fetchReports = useCallback(async (userId?: string) => {
    // Already handled in fetchServiceRequests
    return fetchServiceRequests(userId)
  }, [fetchServiceRequests])

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch('/api/announcements')
      const data = await response.json()

      if (data.success) {
        setAnnouncements(data.announcements)
      } else {
        const raw = localStorage.getItem('barangay_announcements')
        const anns = raw ? JSON.parse(raw) : []
        setAnnouncements(anns)
      }
    } catch (error: unknown) {
      const raw = localStorage.getItem('barangay_announcements')
      const anns = raw ? JSON.parse(raw) : []
      setAnnouncements(anns)
    }
  }, [])

  const updateServiceRequestStatus = useCallback(async (id: string, status: string) => {
    try {
      const response = await fetch('/api/service-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      const data = await response.json()

      if (data.success) {
        setStatusMessage('Status updated successfully')
        await fetchServiceRequests()
      } else {
        updateLocalServiceRequestStatus(id, status)
        const local = getLocalServiceRequests()
        setServiceRequests(local as unknown as ServiceRequestItem[])
        setStatusMessage('Updated locally')
      }
    } catch (error: unknown) {
      updateLocalServiceRequestStatus(id, status)
      const local = getLocalServiceRequests()
      setServiceRequests(local as unknown as ServiceRequestItem[])
      setStatusMessage('Updated locally')
    }
  }, [fetchServiceRequests])

  const updateReportStatus = useCallback(async (id: string, status: string) => {
    try {
      setStatusMessage('Updating report status...')
      const response = await fetch('/api/service-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      const data = await response.json()

      if (data.success) {
        setStatusMessage('Report status updated successfully')
        if (userProfile) await fetchServiceRequests(userProfile.id)
      } else {
        setStatusMessage(data.message || 'Failed to update report status')
      }
    } catch (error: unknown) {
      console.error('Update report status error:', error)
      setStatusMessage('Failed to update report status')
    }
  }, [userProfile, fetchServiceRequests])

  const syncLocalData = useCallback(async (): Promise<void> => {
    try {
      const localReqs = getLocalServiceRequests()
      for (const r of localReqs) {
        const serverId = getSyncServerId(r.referenceId)
        if (serverId) {
          try { await fetch('/api/service-request', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: serverId, status: r.status }) }) } catch {}
          continue
        }
        try {
          const res = await fetch('/api/service-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'service', description: r.additionalInfo || r.purpose, residentName: r.fullName, residentEmail: r.email, residentPhone: r.phone, residentAddress: r.address, documentType: r.documentType, purpose: r.purpose }) })
          if (res.ok) {
            const data = await res.json()
            const createdId = data.request?._id as string | undefined
            if (createdId) setSyncMapEntry(r.referenceId, 'service', createdId)
          }
        } catch {}
      }

      const localReps = getLocalReports()
      for (const rep of localReps) {
        const serverId = getSyncServerId(rep.referenceId)
        if (serverId) {
          try { await fetch('/api/reports', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: serverId, status: rep.status }) }) } catch {}
          continue
        }
        try {
          const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: rep.reportType, category: rep.reportType, description: rep.description, location: rep.location, reporterName: rep.fullName, reporterEmail: rep.email, reporterPhone: rep.phone, priority: rep.priority }) })
          if (res.ok) {
            const data = await res.json()
            const createdId = data.report?._id as string | undefined
            if (createdId) setSyncMapEntry(rep.referenceId, 'report', createdId)
          }
        } catch {}
      }
      try { window.dispatchEvent(new Event('barangay_data_synced')) } catch {}
    } catch {}
  }, [])

  return {
    authenticated,
    userProfile,
    statusMessage,
    serviceRequests,
    reports,
    announcements,
    registerUser,
    loginUser,
    logoutUser,
    createServiceRequest,
    createReport,
    fetchServiceRequests,
    fetchReports,
    fetchAnnouncements,
    updateServiceRequestStatus,
    updateReportStatus,
  }
}
