'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, AlertTriangle, MessageSquare, Calendar, ArrowLeft, Shield } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { getUserServiceRequests, getUserReports, getUserBlotters, getRepliesForReference } from '@/lib/storage'
import { Reply, Blotter as BlotterType } from '@/lib/types'

interface ServiceRequest {
  id: string
  fullName: string
  email: string
  phone: string
  address: string
  documentType: string
  purpose: string
  additionalInfo: string
  status: string
  submittedAt: string
  adminNotes?: string
  replies?: Reply[]
}

interface Report {
  id: string
  fullName: string
  email: string
  phone: string
  location: string
  reportType: string
  priority: string
  description: string
  status: string
  submittedAt: string
  response?: string
  replies?: Reply[]
}

interface Blotter {
  id: string
  entryNo: string
  complainantName: string
  complainantContact: string
  placeOfIncident: string
  incidentType: string
  dateReported: string
  timeReported: string
  respondentName: string
  status: string
  submittedAt: string
  replies?: Reply[]
}

interface Feedback {
  id: string
  name: string
  email: string
  category: string
  rating: number
  message: string
  submittedAt: string
}

export default function MyRequests({ residentUser, onBack }: { residentUser?: any; onBack?: () => void }): React.JSX.Element {
  const [searchEmail, setSearchEmail] = useState<string>(residentUser?.email || '')
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [blotters, setBlotters] = useState<Blotter[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [hasSearched, setHasSearched] = useState<boolean>(false)

  type ApiServiceRequest = {
    _id: string
    residentName: string
    residentEmail: string
    residentPhone: string
    residentAddress?: string
    documentType?: string
    type?: string
    purpose?: string
    additionalInfo?: string
    status: ServiceRequest['status']
    createdAt: string
    adminNotes?: string
    idPicture?: string
  }

  type ApiReport = {
    _id: string
    reporterName: string
    reporterEmail: string
    reporterPhone?: string
    location?: string
    category: Report['reportType']
    priority: Report['priority']
    description: string
    status: Report['status'] | 'open'
    createdAt: string
    response?: string
    idPicture?: string
  }

  const handleSearch = async (identifiersToSearch?: string[]): Promise<void> => {
    const ids = identifiersToSearch || [searchEmail].filter(Boolean)
    if (ids.length === 0) {
      return
    }

    try {
      // Create a map to store unique results by ID
      const uniqueRequests = new Map<string, ServiceRequest>()
      const uniqueReports = new Map<string, Report>()
      const uniqueBlotters = new Map<string, Blotter>()

      await Promise.all(ids.map(async (identifier) => {
        try {
          const [reqRes] = await Promise.all([
            fetch(`/api/service-request?email=${encodeURIComponent(identifier)}`)
          ])
          const reqJson = await reqRes.json()
          
          // 1. Fetch from API
          if (reqRes.ok && reqJson.success) {
            const items = reqJson.serviceRequests || reqJson.requests || []
            await Promise.all((items as ApiServiceRequest[]).map(async (r) => {
              let replies = getRepliesForReference(r._id)
              try {
                const replyRes = await fetch(`/api/replies?referenceId=${r._id}`)
                const replyJson = await replyRes.json()
                if (replyJson.success && replyJson.replies) {
                  replies = replyJson.replies
                }
              } catch {}

              const commonData = {
                id: r._id,
                fullName: r.residentName,
                email: r.residentEmail,
                phone: r.residentPhone,
                address: r.residentAddress || (r as any).location || '',
                documentType: r.documentType || r.type || '',
                purpose: r.purpose || (r as any).description || '',
                additionalInfo: r.additionalInfo || '',
                status: r.status,
                submittedAt: r.createdAt,
                adminNotes: r.adminNotes || '',
                replies
              }

              // If it's a report (type is not 'document')
              if (r.type !== 'document' && r.type !== undefined) {
                uniqueReports.set(r._id, {
                  ...commonData,
                  location: (r as any).location || r.residentAddress || '',
                  reportType: r.type,
                  priority: (r as any).priority || 'medium',
                  description: r.purpose || (r as any).description || ''
                })
              } else {
                uniqueRequests.set(r._id, commonData)
              }
            }))
          }

          // 2. ALWAYS also check local storage for this identifier to merge
          const locals = await Promise.all(getUserServiceRequests(identifier).map(async (r) => {
            let replies = getRepliesForReference(r.referenceId)
            try {
              const replyRes = await fetch(`/api/replies?referenceId=${r.referenceId}`)
              const replyJson = await replyRes.json()
              if (replyJson.success && replyJson.replies) {
                replies = replyJson.replies
              }
            } catch {}

            return {
              id: r.referenceId,
              fullName: r.fullName,
              email: r.email,
              phone: r.phone,
              address: r.address || '',
              documentType: r.documentType,
              purpose: r.purpose,
              additionalInfo: r.additionalInfo || '',
              status: r.status,
              submittedAt: r.submittedAt,
              replies
            }
          }))
          locals.forEach(r => {
            // Only add if not already in the map from API
            if (!uniqueRequests.has(r.id)) {
              uniqueRequests.set(r.id, r)
            }
          })

          // Merge local reports
          const localReps = await Promise.all(getUserReports(identifier).map(async (r) => {
            let replies = getRepliesForReference(r.id)
            try {
              const replyRes = await fetch(`/api/replies?referenceId=${r.id}`)
              const replyJson = await replyRes.json()
              if (replyJson.success && replyJson.replies) {
                replies = replyJson.replies
              }
            } catch {}

            return {
              id: r.id,
              fullName: r.fullName,
              email: r.email,
              phone: r.phone || '',
              location: r.location || '',
              reportType: r.reportType,
              priority: r.priority,
              description: r.description,
              status: r.status,
              submittedAt: r.submittedAt,
              replies
            }
          }))
          localReps.forEach(r => {
            if (!uniqueReports.has(r.id)) {
              uniqueReports.set(r.id, r)
            }
          })
          
          const localsBlotter = getUserBlotters(identifier).map((b) => ({
            id: b.referenceId,
            entryNo: b.entryNo,
            complainantName: b.complainantName,
            complainantContact: b.complainantContact,
            placeOfIncident: b.placeOfIncident,
            incidentType: b.incidentType,
            dateReported: b.dateReported,
            timeReported: b.timeReported,
            respondentName: b.respondentName,
            status: b.status,
            submittedAt: b.submittedAt,
            replies: getRepliesForReference(b.referenceId)
          }))
          localsBlotter.forEach(b => uniqueBlotters.set(b.id, b))
        } catch (err) {
          console.error(`Search failed for ${identifier}:`, err)
        }
      }))

      setServiceRequests(Array.from(uniqueRequests.values()))
      setReports(Array.from(uniqueReports.values()))
      setBlotters(Array.from(uniqueBlotters.values()))
      setFeedbacks([])
    } catch (err) {
      console.error('Unified search failed:', err)
    }

    setHasSearched(true)
  }

  // Auto-search if residentUser is provided
  React.useEffect(() => {
    if (residentUser) {
      const identifiers = [
        residentUser.email,
        residentUser.phone,
        residentUser.fullName,
        residentUser.id
      ].filter(Boolean) as string[]

      if (identifiers.length > 0) {
        setSearchEmail(identifiers[0])
        handleSearch(identifiers)
        
        // Refresh every 30 seconds for new replies
        const interval = setInterval(() => handleSearch(identifiers), 30000)
        return () => clearInterval(interval)
      }
    }
  }, [residentUser])

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'settled': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      )}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Search className="h-6 w-6" />
            Track My Submissions
          </CardTitle>
          <CardDescription className="text-indigo-100">
            View all your service requests, reports, and feedback submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {!residentUser && (
              <div className="space-y-2">
                <Label htmlFor="searchEmail">Enter Your Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="searchEmail"
                    type="email"
                    placeholder="your.email@example.com"
                    value={searchEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchEmail(e.target.value)}
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        handleSearch()
                      }
                    }}
                  />
                  <Button onClick={() => handleSearch()} className="bg-indigo-600 hover:bg-indigo-700">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            )}

            {hasSearched && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-800">
                  <strong>{residentUser ? 'Showing Requests for:' : 'Search Results for:'}</strong> {searchEmail}
                </p>
                <p className="text-sm text-indigo-600 mt-1">
                  Found {serviceRequests.length} service requests, {blotters.length} blotters, {reports.length} reports, 
                  and {feedbacks.length} feedback submissions
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Requests */}
      {hasSearched && serviceRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Document Service Requests ({serviceRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceRequests.map((request: ServiceRequest) => (
                <Card key={request.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.documentType}</CardTitle>
                        <p className="text-sm text-gray-600">Reference: {request.id}</p>
                      </div>
                      <Badge variant="secondary" className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="grid md:grid-cols-2 gap-2">
                        <p><strong>Name:</strong> {request.fullName}</p>
                        <p><strong>Phone:</strong> {request.phone}</p>
                      </div>
                      <p><strong>Purpose:</strong> {request.purpose}</p>
                      {request.additionalInfo && (
                        <p><strong>Additional Info:</strong> {request.additionalInfo}</p>
                      )}
                      {request.adminNotes && (
                        <p className="text-green-700"><strong>Admin Reply:</strong> {request.adminNotes}</p>
                      )}
                      {request.replies && request.replies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="font-semibold text-gray-900 mb-2">Conversation History</p>
                          <div className="space-y-3">
                            {request.replies.map((reply) => (
                              <div key={reply.id} className="bg-gray-50 p-3 rounded-md text-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-indigo-700">{reply.officialName} <span className="text-xs font-normal text-gray-500">({reply.officialRole})</span></span>
                                  <span className="text-xs text-gray-500">{new Date(reply.sentAt).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(request.submittedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blotters */}
      {hasSearched && blotters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-700" />
              Barangay Blotter Reports ({blotters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {blotters.map((blotter: Blotter) => (
                <Card key={blotter.id} className="border-l-4 border-l-red-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Incident: {blotter.incidentType}</CardTitle>
                        <p className="text-sm text-gray-600">Entry No: {blotter.entryNo}</p>
                        <p className="text-xs text-gray-400">Reference: {blotter.id}</p>
                      </div>
                      <Badge variant="secondary" className={getStatusColor(blotter.status)}>
                        {blotter.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="grid md:grid-cols-2 gap-2">
                        <p><strong>Complainant:</strong> {blotter.complainantName}</p>
                        <p><strong>Respondent:</strong> {blotter.respondentName || 'N/A'}</p>
                      </div>
                      <p><strong>Place:</strong> {blotter.placeOfIncident}</p>
                      <p><strong>Date/Time of Incident:</strong> {blotter.dateReported} at {blotter.timeReported}</p>
                      
                      {blotter.replies && blotter.replies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="font-semibold text-gray-900 mb-2">Mediation/Official Notes</p>
                          <div className="space-y-3">
                            {blotter.replies.map((reply) => (
                              <div key={reply.id} className="bg-gray-50 p-3 rounded-md text-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-red-700">{reply.officialName} <span className="text-xs font-normal text-gray-500">({reply.officialRole})</span></span>
                                  <span className="text-xs text-gray-500">{new Date(reply.sentAt).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Submitted on {formatDate(blotter.submittedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports */}
      {hasSearched && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Issue Reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.map((report: Report) => (
                <Card key={report.id} className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{report.reportType}</CardTitle>
                        <p className="text-sm text-gray-600">Reference: {report.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={report.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                          {report.priority}
                        </Badge>
                        <Badge variant="secondary" className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="grid md:grid-cols-2 gap-2">
                        <p><strong>Reporter:</strong> {report.fullName}</p>
                        <p><strong>Location:</strong> {report.location}</p>
                      </div>
                      <p><strong>Description:</strong> {report.description}</p>
                      {report.response && (
                        <p className="text-green-700"><strong>Admin Reply:</strong> {report.response}</p>
                      )}
                      {report.replies && report.replies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="font-semibold text-gray-900 mb-2">Conversation History</p>
                          <div className="space-y-3">
                            {report.replies.map((reply) => (
                              <div key={reply.id} className="bg-gray-50 p-3 rounded-md text-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-medium text-indigo-700">{reply.officialName} <span className="text-xs font-normal text-gray-500">({reply.officialRole})</span></span>
                                  <span className="text-xs text-gray-500">{new Date(reply.sentAt).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(report.submittedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {hasSearched && feedbacks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Feedback Submissions ({feedbacks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbacks.map((feedback: Feedback) => (
                <Card key={feedback.id} className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg capitalize">{feedback.category.replace('-', ' ')}</CardTitle>
                        <p className="text-sm text-gray-600">Reference: {feedback.id}</p>
                      </div>
                      <div className="text-yellow-500 font-bold">
                        ⭐ {feedback.rating}/5
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {feedback.name}</p>
                      <p><strong>Message:</strong> {feedback.message}</p>
                      <Separator className="my-2" />
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(feedback.submittedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {hasSearched && serviceRequests.length === 0 && reports.length === 0 && feedbacks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Submissions Found</h3>
            <p className="text-gray-600">
              No service requests, reports, or feedback found for <strong>{searchEmail}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please check your email address or submit a new request
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
