export interface Complaint {
  id: string;
  residentName: string;
  email: string;
  phone: string;
  complaintType: 'noise' | 'garbage' | 'infrastructure' | 'security' | 'others';
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  submittedAt: string;
}

export interface DocumentRequest {
  id: string;
  residentName: string;
  email: string;
  phone: string;
  documentType: 'barangay_clearance' | 'certificate_of_residency' | 'certificate_of_indigency' | 'business_permit' | 'others';
  purpose: string;
  status: 'pending' | 'processing' | 'ready_for_pickup' | 'completed';
  submittedAt: string;
}

export interface ServiceRequest {
  referenceId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  documentType: string;
  purpose: string;
  additionalInfo?: string;
  status: 'pending' | 'processing' | 'ready_for_pickup' | 'completed' | 'rejected' | 'ready' | 'in-progress' | 'resolved';
  submittedAt: string;
  idPicture?: string; // Base64 or URL
  location?: string;
  reportType?: 'emergency' | 'landslide' | 'flooding' | 'road-issue' | 'other';
  priority?: 'low' | 'medium' | 'high';
}

export interface Report extends ServiceRequest {}

export interface Blotter {
  referenceId: string;
  entryNo: string;
  dateReported: string;
  timeReported: string;
  placeOfIncident: string;
  incidentType: string;
  complainantName: string;
  complainantAddress: string;
  complainantAge: string;
  complainantSex: string;
  complainantContact: string;
  respondentName: string;
  respondentAddress: string;
  respondentAge: string;
  respondentSex: string;
  respondentRelationship: string;
  status: 'pending' | 'in-progress' | 'scheduled' | 'settled' | 'dismissed';
  submittedAt: string;
  idPicture?: string; // Base64 or URL
}

export interface Reply {
  id: string;
  referenceId: string;
  type: 'service-request' | 'report' | 'document-request' | 'complaint';
  officialName: string;
  officialRole: string;
  message: string;
  sentAt: string;
  recipientEmail: string;
  recipientPhone: string;
  emailSent: boolean;
  smsSent: boolean;
  attachments?: Array<{ name: string; size: number; type: string; dataUrl: string }>;
}

export type SubmissionType = 'complaint' | 'document';
