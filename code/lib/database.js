/**
 * MongoDB Database Operations Brain 🧠
 * Centralized database operations for all collections
 * All MongoDB CRUD operations are managed here
 */

import dbConnect, { setMongoUri } from './mongodb';
import Resident from '@/models/Resident';
import Official from '@/models/Official';
import Announcement from '@/models/Announcement';
import DocumentRequest from '@/models/DocumentRequest';
import ServiceRequest from '@/models/ServiceRequest';
import Report from '@/models/Report';
import Reply from '@/models/Reply';
import bcrypt from 'bcryptjs';

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Create a new user (registration)
 */
export async function createUser(userData) {
  await dbConnect();
  
  const { username, password, email, phone, fullName, address } = userData;
  
  // Check if user already exists
  const conditions = [{ username }];
  if (email) {
    conditions.push({ email });
  }
  const existingUser = await Resident.findOne({ $or: conditions });
  if (existingUser) {
    throw new Error('Username or email already exists');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const userDataToCreate = {
    username,
    password: hashedPassword,
    phone,
    fullName,
    address,
    isAdmin: false,
  };

  if (email) {
    userDataToCreate.email = email;
  }

  const user = await Resident.create(userDataToCreate);
  
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
  };
}

/**
 * Find user by username for login
 */
export async function findUserByUsername(username) {
  await dbConnect();
  return await Resident.findOne({ username });
}

/**
 * Verify user password
 */
export async function verifyUserPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  await dbConnect();
  return await Resident.findById(userId);
}

// ============================================
// OFFICIAL OPERATIONS
// ============================================

/**
 * Create a new official account
 */
export async function createOfficial(officialData) {
  await dbConnect();
  const { username, password, email, fullName, role } = officialData;

  const conditions = [{ username }];
  if (email) {
    conditions.push({ email });
  }
  const existing = await Official.findOne({ $or: conditions });
  if (existing) {
    throw new Error('Username or email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const official = await Official.create({
    username,
    password: hashedPassword,
    email: email || undefined, // Handle empty string by setting to undefined
    fullName,
    role,
  });

  return {
    _id: official._id,
    id: official._id.toString(),
    username: official.username,
    email: official.email,
    fullName: official.fullName,
    role: official.role,
  };
}

/**
 * Find official by username
 */
export async function findOfficialByUsername(username) {
  await dbConnect();
  return await Official.findOne({ username });
}

// ============================================
// ANNOUNCEMENT OPERATIONS
// ============================================

/**
 * Create a new announcement
 */
export async function createAnnouncement(announcementData) {
  await dbConnect();
  
  const { adminId, category, priority, title, content, eventDate } = announcementData;
  
  const announcement = await Announcement.create({
    adminId,
    category,
    priority,
    title,
    content,
    eventDate: eventDate ? new Date(eventDate) : undefined,
  });
  
  return {
    id: announcement._id.toString(),
    category: announcement.category,
    priority: announcement.priority,
    title: announcement.title,
    content: announcement.content,
    eventDate: announcement.eventDate,
    postedAt: announcement.createdAt,
  };
}

/**
 * Get all announcements
 */
export async function getAllAnnouncements() {
  await dbConnect();
  
  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .populate('adminId', 'fullName');
  
  return announcements.map((ann) => ({
    id: ann._id.toString(),
    adminId: ann.adminId.toString(),
    category: ann.category,
    priority: ann.priority,
    title: ann.title,
    content: ann.content,
    eventDate: ann.eventDate,
    postedAt: ann.createdAt,
    updatedAt: ann.updatedAt,
  }));
}

/**
 * Delete an announcement by ID
 */
export async function deleteAnnouncement(announcementId) {
  await dbConnect();
  
  const announcement = await Announcement.findByIdAndDelete(announcementId);
  
  if (!announcement) {
    throw new Error('Announcement not found');
  }
  
  return { message: 'Announcement deleted successfully' };
}

// ============================================
// DOCUMENT REQUEST OPERATIONS
// ============================================

/**
 * Create a new document request
 */
export async function createDocumentRequest(requestData) {
  await dbConnect();
  
  const {
    residentName,
    residentEmail,
    residentPhone,
    residentAddress,
    documentType,
    purpose
  } = requestData;
  
  // Validate document type
  const validTypes = [
    'barangay_clearance',
    'certificate_of_residency',
    'certificate_of_indigency',
    'business_permit',
    'others'
  ];
  
  if (!validTypes.includes(documentType)) {
    throw new Error('Invalid document type');
  }
  
  const documentRequest = await DocumentRequest.create({
    residentName,
    residentEmail: residentEmail.toLowerCase(),
    residentPhone,
    residentAddress,
    documentType,
    purpose,
    status: 'pending',
  });
  
  return documentRequest;
}

/**
 * Get document requests with optional filters
 */
export async function getDocumentRequests(filters = {}) {
  await dbConnect();
  
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.email) query.residentEmail = filters.email.toLowerCase();
  if (filters.documentType) query.documentType = filters.documentType;
  
  return await DocumentRequest.find(query).sort({ createdAt: -1 });
}

/**
 * Update a document request
 */
export async function updateDocumentRequest(requestId, updateData) {
  await dbConnect();
  
  const updates = {};
  
  if (updateData.status) {
    // Validate status
    const validStatuses = ['pending', 'processing', 'ready', 'released', 'rejected'];
    if (!validStatuses.includes(updateData.status)) {
      throw new Error('Invalid status');
    }
    updates.status = updateData.status;
    
    // Automatically set claimedAt when status is 'released'
    if (updateData.status === 'released' && !updateData.claimedAt) {
      updates.claimedAt = new Date();
    }
  }
  
  if (updateData.adminNotes !== undefined) updates.adminNotes = updateData.adminNotes;
  if (updateData.attachmentUrl !== undefined) updates.attachmentUrl = updateData.attachmentUrl;
  if (updateData.claimedAt) updates.claimedAt = new Date(updateData.claimedAt);
  
  const updatedRequest = await DocumentRequest.findByIdAndUpdate(
    requestId,
    updates,
    { new: true, runValidators: true }
  );
  
  if (!updatedRequest) {
    throw new Error('Document request not found');
  }
  
  return updatedRequest;
}

/**
 * Delete a document request
 */
export async function deleteDocumentRequest(requestId) {
  await dbConnect();
  
  const deletedRequest = await DocumentRequest.findByIdAndDelete(requestId);
  
  if (!deletedRequest) {
    throw new Error('Document request not found');
  }
  
  return { message: 'Document request deleted successfully' };
}

// ============================================
// SERVICE REQUEST OPERATIONS
// ============================================

/**
 * Create a new service request
 */
export async function createServiceRequest(requestData) {
  await dbConnect();
  
  const {
    type,
    description,
    residentName,
    residentEmail,
    residentPhone,
    residentAddress,
    documentType,
    purpose,
    complaintType,
    additionalInfo,
    idPicture
  } = requestData;
  
  const serviceRequest = await ServiceRequest.create({
    type,
    description,
    residentName,
    residentEmail: residentEmail?.toLowerCase(),
    residentPhone,
    residentAddress,
    documentType,
    purpose,
    complaintType,
    additionalInfo,
    idPicture,
    status: 'pending',
  });
  
  return serviceRequest;
}

/**
 * Get service requests with optional filters
 */
export async function getServiceRequests(filters = {}) {
  await dbConnect();
  
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  
  if (filters.email) {
    const identifier = filters.email.toLowerCase();
    const phoneDigits = identifier.replace(/\D/g, '');
    
    const orConditions = [
      { residentEmail: identifier },
      { residentPhone: identifier },
      { residentName: { $regex: identifier, $options: 'i' } }
    ];

    // If it looks like a MongoDB ID
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      orConditions.push({ _id: identifier });
    }

    // Improved phone matching: handle 09, +639, 639 prefixes
    if (phoneDigits.length >= 7) {
      // Extract the last 10 digits (common for PH mobile numbers without the leading 0 or prefix)
      const last10 = phoneDigits.slice(-10);
      
      orConditions.push(
        { residentPhone: { $regex: phoneDigits, $options: 'i' } },
        { residentPhone: { $regex: last10, $options: 'i' } }
      );
      
      // If the identifier was +63999..., phoneDigits is 63999... 
      // If stored number is 0999..., we should also check for that
      if (phoneDigits.startsWith('63') && phoneDigits.length >= 12) {
        const leadingZeroVersion = '0' + phoneDigits.slice(2);
        orConditions.push({ residentPhone: leadingZeroVersion });
      } else if (phoneDigits.startsWith('0') && phoneDigits.length === 11) {
        const plus63Version = '+63' + phoneDigits.slice(1);
        const nonPlus63Version = '63' + phoneDigits.slice(1);
        orConditions.push({ residentPhone: plus63Version }, { residentPhone: nonPlus63Version });
      }
    }

    query.$or = orConditions;
  }
  
  return await ServiceRequest.find(query).sort({ createdAt: -1 });
}

/**
 * Update a service request
 */
export async function updateServiceRequest(requestId, updateData) {
  await dbConnect();
  
  const updates = {};
  if (updateData.status) updates.status = updateData.status;
  if (updateData.adminNotes) updates.adminNotes = updateData.adminNotes;
  
  const updatedRequest = await ServiceRequest.findByIdAndUpdate(
    requestId,
    updates,
    { new: true }
  );
  
  if (!updatedRequest) {
    throw new Error('Service request not found');
  }
  
  return updatedRequest;
}

/**
 * Delete a service request
 */
export async function deleteServiceRequest(requestId) {
  await dbConnect();
  
  const deletedRequest = await ServiceRequest.findByIdAndDelete(requestId);
  
  if (!deletedRequest) {
    throw new Error('Service request not found');
  }
  
  return { message: 'Service request deleted successfully' };
}

// ============================================
// REPORT OPERATIONS
// ============================================

/**
 * Create a new report
 */
export async function createReport(reportData) {
  await dbConnect();
  
  const {
    title,
    category,
    description,
    location,
    reporterName,
    reporterEmail,
    reporterPhone,
    priority,
    idPicture
  } = reportData;
  
  const report = await Report.create({
    title,
    category,
    description,
    location,
    reporterName,
    reporterEmail: reporterEmail?.toLowerCase(),
    reporterPhone,
    priority: priority || 'medium',
    idPicture,
    status: 'open',
  });
  
  return report;
}

/**
 * Get reports with optional filters
 */
export async function getReports(filters = {}) {
  await dbConnect();
  
  const query = {};
  if (filters.status) query.status = filters.status;
  
  if (filters.email) {
    const identifier = filters.email.toLowerCase();
    const phoneDigits = identifier.replace(/\D/g, '');
    
    const orConditions = [
      { reporterEmail: identifier },
      { reporterPhone: identifier },
      { reporterName: { $regex: identifier, $options: 'i' } }
    ];

    // If it looks like a MongoDB ID
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      orConditions.push({ _id: identifier });
    }

    // Improved phone matching: handle 09, +639, 639 prefixes
    if (phoneDigits.length >= 7) {
      // Extract the last 10 digits
      const last10 = phoneDigits.slice(-10);
      
      orConditions.push(
        { reporterPhone: { $regex: phoneDigits, $options: 'i' } },
        { reporterPhone: { $regex: last10, $options: 'i' } }
      );
      
      if (phoneDigits.startsWith('63') && phoneDigits.length >= 12) {
        const leadingZeroVersion = '0' + phoneDigits.slice(2);
        orConditions.push({ reporterPhone: leadingZeroVersion });
      } else if (phoneDigits.startsWith('0') && phoneDigits.length === 11) {
        const plus63Version = '+63' + phoneDigits.slice(1);
        const nonPlus63Version = '63' + phoneDigits.slice(1);
        orConditions.push({ reporterPhone: plus63Version }, { reporterPhone: nonPlus63Version });
      }
    }

    query.$or = orConditions;
  }
  
  return await Report.find(query).sort({ createdAt: -1 });
}

/**
 * Update a report
 */
export async function updateReport(reportId, updateData) {
  await dbConnect();
  
  const updates = {};
  if (updateData.status) updates.status = updateData.status;
  if (updateData.response) updates.response = updateData.response;
  
  const updatedReport = await Report.findByIdAndUpdate(
    reportId,
    updates,
    { new: true }
  );
  
  if (!updatedReport) {
    throw new Error('Report not found');
  }
  
  return updatedReport;
}

/**
 * Delete a report
 */
export async function deleteReport(reportId) {
  await dbConnect();
  
  const deletedReport = await Report.findByIdAndDelete(reportId);
  
  if (!deletedReport) {
    throw new Error('Report not found');
  }
  
  return { message: 'Report deleted successfully' };
}

// ============================================
// REPLY OPERATIONS
// ============================================

/**
 * Create a new reply for a request or report
 */
export async function createReply(replyData) {
  await dbConnect();
  
  const {
    referenceId,
    type,
    officialName,
    officialRole,
    message,
    recipientEmail,
    recipientPhone,
    recipientName,
    attachments
  } = replyData;
  
  const reply = await Reply.create({
    referenceId,
    type,
    officialName,
    officialRole,
    message,
    recipientEmail,
    recipientPhone,
    recipientName,
    attachments
  });
  
  return reply;
}

/**
 * Get all replies for a specific reference ID
 */
export async function getRepliesByReferenceId(referenceId) {
  await dbConnect();
  return await Reply.find({ referenceId }).sort({ createdAt: 1 });
}


// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get statistics for admin dashboard
 */
export async function getDashboardStats() {
  await dbConnect();
  
  const [
    totalUsers,
    totalAnnouncements,
    pendingDocuments,
    pendingServices,
    openReports
  ] = await Promise.all([
    User.countDocuments(),
    Announcement.countDocuments(),
    DocumentRequest.countDocuments({ status: 'pending' }),
    ServiceRequest.countDocuments({ status: 'pending' }),
    Report.countDocuments({ status: 'open' })
  ]);
  
  return {
    totalUsers,
    totalAnnouncements,
    pendingDocuments,
    pendingServices,
    openReports,
    totalPending: pendingDocuments + pendingServices + openReports
  };
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth() {
  try {
    await dbConnect();
    return { status: 'healthy', message: 'Database connection successful' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}
export function configureDatabase(uri) {
  setMongoUri(uri);
}
