// TEMPORARY MOCK BINDINGS FOR SPACETIMEDB
// These are placeholder types to allow the code to compile
// Real bindings will be generated when you publish the SpacetimeDB module
// See SPACETIMEDB_SETUP.md for instructions

// Minimal Identity interface to avoid external dependency during build
export interface Identity { toHexString(): string }

// Mock types - will be replaced by generated bindings
export class DbConnection {
  db: any
  reducers: any
  
  static builder() {
    return {
      withUri: (uri: string) => ({
        withModuleName: (name: string) => ({
          withToken: (token: string) => ({
            onConnect: (callback: Function) => ({
              onDisconnect: (callback: Function) => ({
                build: () => {
                  console.warn('MOCK SPACETIMEDB: Real bindings not generated yet. See SPACETIMEDB_SETUP.md')
                }
              })
            })
          })
        })
      })
    }
  }
  
  subscriptionBuilder() {
    return {
      onApplied: (callback: Function) => ({
        onError: (callback: Function) => ({
          subscribe: (queries: string[]) => {
            console.warn('MOCK: Subscription not active')
          }
        })
      })
    }
  }
}

export type EventContext = any

export interface UserProfile {
  identity: Identity
  username: string
  email: string
  phone: string
  fullName: string
  address: string
  isAdmin: boolean
  createdAt: bigint
}

export interface ServiceRequest {
  requestId: bigint
  userIdentity: Identity
  documentType: DocumentType
  status: ServiceRequestStatus
  fullName: string
  email: string
  phone: string
  address: string
  purpose: string
  submittedAt: bigint
}

export interface Report {
  reportId: bigint
  userIdentity: Identity
  reportType: ReportType
  priority: Priority
  status: ReportStatus
  fullName: string
  email: string
  phone: string
  location: string
  description: string
  submittedAt: bigint
}

export interface Announcement {
  announcementId: bigint
  adminIdentity: Identity
  category: AnnouncementCategory
  priority: Priority
  title: string
  content: string
  postedAt: bigint
}

export interface AuthEvent {
  authId: bigint
  identity: Identity
  username: string
  success: boolean
  message: string
  timestamp: bigint
}

export enum DocumentType {
  Clearance = 0,
  Certificate = 1,
  Permit = 2,
  Id = 3,
  Others = 4
}

export enum ServiceRequestStatus {
  Pending = 0,
  InProgress = 1,
  Ready = 2,
  Completed = 3,
  Rejected = 4
}

export enum ReportType {
  Emergency = 0,
  Landslide = 1,
  Flooding = 2,
  RoadIssue = 3,
  Other = 4
}

export enum ReportStatus {
  Pending = 0,
  InProgress = 1,
  Resolved = 2,
  Rejected = 3
}

export enum AnnouncementCategory {
  General = 0,
  Event = 1,
  Alert = 2,
  Emergency = 3
}

export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2
}
