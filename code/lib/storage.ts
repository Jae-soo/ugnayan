import type { Complaint, DocumentRequest, LocalServiceRequest as ServiceRequest, Report, Blotter, Reply } from './types';

const COMPLAINTS_KEY = 'barangay_complaints';
const DOCUMENTS_KEY = 'barangay_documents';
const SERVICE_REQUESTS_KEY = 'barangay_service_requests';
const REPORTS_KEY = 'barangay_reports';
const BLOTTERS_KEY = 'barangay_blotters';
const REPLIES_KEY = 'barangay_replies';
const SYNC_MAP_KEY = 'barangay_sync_map';

/**
 * Removes older or completed entries to free up space.
 * Prioritizes stripping large base64 fields (images/attachments) from old records.
 */
const cleanUpOldData = (aggressive: boolean = false): void => {
  if (typeof window === 'undefined') return;

  const keysToClean = [
    REPLIES_KEY,
    SERVICE_REQUESTS_KEY,
    BLOTTERS_KEY,
    REPORTS_KEY,
    DOCUMENTS_KEY,
    COMPLAINTS_KEY
  ];

  for (const key of keysToClean) {
    const data = localStorage.getItem(key);
    if (!data) continue;

    try {
      let items = JSON.parse(data);
      if (!Array.isArray(items) || items.length === 0) continue;

      // Sort items: oldest first
      items.sort((a: any, b: any) => {
        const dateA = new Date(a.submittedAt || a.sentAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.submittedAt || b.sentAt || b.createdAt || 0).getTime();
        return dateA - dateB;
      });

      // 1. Strip large fields from the oldest half of records
      const stripCount = Math.floor(items.length / 2);
      for (let i = 0; i < stripCount; i++) {
        if (items[i].idPicture) {
          items[i].idPicture = "[Stripped to save space]";
        }
        if (items[i].attachments && Array.isArray(items[i].attachments)) {
          items[i].attachments = items[i].attachments.map((att: any) => ({
            ...att,
            dataUrl: "[Stripped to save space]"
          }));
        }
      }

      // 2. If aggressive, delete the oldest 30% entirely
      if (aggressive) {
        const removeCount = Math.max(1, Math.ceil(items.length * 0.3));
        items.splice(0, removeCount);
        console.warn(`Aggressively removed ${removeCount} items from ${key}`);
      } else {
        // Just remove oldest 10%
        const removeCount = Math.max(1, Math.ceil(items.length * 0.1));
        items.splice(0, removeCount);
      }
      
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error(`Error during cleanup of ${key}:`, e);
    }
  }
};

/**
 * Safely sets an item in localStorage, handling QuotaExceededError.
 * If the quota is exceeded, it attempts to clean up old/completed data.
 */
export const safeSetItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && (
      e.code === 22 || 
      e.code === 1014 || 
      e.name === 'QuotaExceededError' || 
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      console.warn('LocalStorage quota exceeded. Attempting cleanup...');
      // 1. First attempt: Standard cleanup
      cleanUpOldData(false);
      
      try {
        localStorage.setItem(key, value);
      } catch (retryError) {
        // 2. Second attempt: Aggressive cleanup
        console.warn('Standard cleanup insufficient. Attempting aggressive cleanup...');
        cleanUpOldData(true);
        
        try {
          localStorage.setItem(key, value);
        } catch (finalError) {
          console.error('LocalStorage quota still exceeded after aggressive cleanup.', finalError);
          // If it's a new item with a massive image, it might just be too big.
          // Try to strip the value itself if it has an image?
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
               // If it's the whole list, we can't do much but maybe strip the last added item's image
               const lastIdx = parsed.length - 1;
               if (parsed[lastIdx].idPicture) parsed[lastIdx].idPicture = "[Removed: Too large for local storage]";
               localStorage.setItem(key, JSON.stringify(parsed));
               console.warn('Saved item by stripping image from the current record.');
            }
          } catch {}
        }
      }
    } else {
      throw e;
    }
  }
};

export const getLocalUsers = (): any[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('barangay_users');
  return data ? JSON.parse(data) : [];
};

export const getLocalOfficials = (): any[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('barangay_officials');
  return data ? JSON.parse(data) : [];
};

export const saveResidentUser = (user: any): void => {
  if (typeof window === 'undefined') return;
  safeSetItem('resident_user', JSON.stringify(user));
  
  // Sync to local users list for offline/local lookup
  const users = getLocalUsers();
  const index = users.findIndex((u: any) => u.username === user.username);
  if (index === -1) {
    users.push(user);
  } else {
    users[index] = { ...users[index], ...user };
  }
  safeSetItem('barangay_users', JSON.stringify(users));
};

export const saveOfficialUser = (official: any): void => {
  if (typeof window === 'undefined') return;
  safeSetItem('official', JSON.stringify(official));
  
  // Sync to local officials list
  const officials = getLocalOfficials();
  const index = officials.findIndex((o: any) => o.username === official.username);
  if (index === -1) {
    officials.push(official);
  } else {
    officials[index] = { ...officials[index], ...official };
  }
  safeSetItem('barangay_officials', JSON.stringify(officials));
};

export const storage = {
  getComplaints: (): Complaint[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(COMPLAINTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveComplaint: (complaint: Complaint): void => {
    if (typeof window === 'undefined') return;
    const complaints = storage.getComplaints();
    complaints.push(complaint);
    safeSetItem(COMPLAINTS_KEY, JSON.stringify(complaints));
  },

  getDocumentRequests: (): DocumentRequest[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(DOCUMENTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveDocumentRequest: (request: DocumentRequest): void => {
    if (typeof window === 'undefined') return;
    const requests = storage.getDocumentRequests();
    requests.push(request);
    safeSetItem(DOCUMENTS_KEY, JSON.stringify(requests));
  },

  getUserSubmissions: (email: string): { complaints: Complaint[]; documents: DocumentRequest[] } => {
    const complaints = storage.getComplaints().filter((c: Complaint) => c.email === email);
    const documents = storage.getDocumentRequests().filter((d: DocumentRequest) => d.email === email);
    return { complaints, documents };
  },
};

// Service requests and reports
export const getServiceRequests = (): ServiceRequest[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SERVICE_REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveServiceRequest = (request: ServiceRequest): void => {
  if (typeof window === 'undefined') return;
  const requests = getServiceRequests();
  requests.push(request);
  safeSetItem(SERVICE_REQUESTS_KEY, JSON.stringify(requests));
};

export const updateServiceRequestStatus = (referenceId: string, status: string): void => {
  if (typeof window === 'undefined') return;
  const requests = getServiceRequests();
  const updated = requests.map((req) =>
    req.referenceId === referenceId ? { ...req, status } : req
  );
  safeSetItem(SERVICE_REQUESTS_KEY, JSON.stringify(updated));
};

export const getReports = (): Report[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(REPORTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveReport = (report: Report): void => {
  if (typeof window === 'undefined') return;
  const reports = getReports();
  reports.push(report);
  safeSetItem(REPORTS_KEY, JSON.stringify(reports));
};

export const getBlotters = (): Blotter[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BLOTTERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBlotter = (blotter: Blotter): void => {
  if (typeof window === 'undefined') return;
  const blotters = getBlotters();
  blotters.push(blotter);
  safeSetItem(BLOTTERS_KEY, JSON.stringify(blotters));
};

export const updateBlotterStatus = (referenceId: string, status: string): void => {
  if (typeof window === 'undefined') return;
  const blotters = getBlotters();
  const updated = blotters.map((b) =>
    b.referenceId === referenceId ? { ...b, status } : b
  );
  safeSetItem(BLOTTERS_KEY, JSON.stringify(updated));
};

export const updateReportStatus = (referenceId: string, status: string): void => {
  if (typeof window === 'undefined') return;
  const reports = getReports();
  const updated = reports.map((rep) =>
    rep.referenceId === referenceId ? { ...rep, status } : rep
  );
  safeSetItem(REPORTS_KEY, JSON.stringify(updated));
};

export const getSyncMap = (): Record<string, { type: 'service' | 'report'; serverId: string }> => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(SYNC_MAP_KEY);
  return data ? JSON.parse(data) : {};
};

export const setSyncMapEntry = (referenceId: string, type: 'service' | 'report', serverId: string): void => {
  if (typeof window === 'undefined') return;
  const map = getSyncMap();
  map[referenceId] = { type, serverId };
  safeSetItem(SYNC_MAP_KEY, JSON.stringify(map));
};

export const getSyncServerId = (referenceId: string): string | undefined => {
  const map = getSyncMap();
  return map[referenceId]?.serverId;
};

export const removeSyncMapEntry = (referenceId: string): void => {
  if (typeof window === 'undefined') return;
  const map = getSyncMap();
  delete map[referenceId];
  safeSetItem(SYNC_MAP_KEY, JSON.stringify(map));
};

export const getUserServiceRequests = (identifier: string): ServiceRequest[] => {
  return getServiceRequests().filter((r) => 
    r.email === identifier || 
    r.phone === identifier || 
    r.fullName === identifier ||
    (r.phone && r.phone.replace(/\D/g, '') === identifier.replace(/\D/g, ''))
  );
};

export const getUserReports = (identifier: string): Report[] => {
  return getReports().filter((r) => 
    r.email === identifier || 
    r.phone === identifier || 
    r.fullName === identifier ||
    (r.phone && r.phone.replace(/\D/g, '') === identifier.replace(/\D/g, ''))
  );
};

export const getUserBlotters = (identifier: string): Blotter[] => {
  return getBlotters().filter((b) => 
    b.complainantContact === identifier || 
    b.complainantName === identifier ||
    b.complainantName.includes(identifier) ||
    (b.complainantContact && b.complainantContact.replace(/\D/g, '') === identifier.replace(/\D/g, ''))
  );
};

export const updateDocumentRequestStatus = (id: string, status: string): void => {
  if (typeof window === 'undefined') return;
  const requests = storage.getDocumentRequests();
  const updated = requests.map((req) =>
    req.id === id ? { ...req, status } : req
  );
  safeSetItem(DOCUMENTS_KEY, JSON.stringify(updated));
};

export const updateComplaintStatus = (id: string, status: string): void => {
  if (typeof window === 'undefined') return;
  const complaints = storage.getComplaints();
  const updated = complaints.map((complaint) =>
    complaint.id === id ? { ...complaint, status } : complaint
  );
  safeSetItem(COMPLAINTS_KEY, JSON.stringify(updated));
};

// Replies system
export const getReplies = (): Reply[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(REPLIES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveReply = (reply: Reply): void => {
  if (typeof window === 'undefined') return;
  const replies = getReplies();
  replies.push(reply);
  safeSetItem(REPLIES_KEY, JSON.stringify(replies));
};

export const getRepliesForReference = (referenceId: string): Reply[] => {
  return getReplies().filter((r) => r.referenceId === referenceId);
};
