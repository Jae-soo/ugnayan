import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ServiceRequest from '@/models/ServiceRequest';
import Report from '@/models/Report';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // 1. Service Request Stats
    const totalRequests = await ServiceRequest.countDocuments();
    const pendingRequests = await ServiceRequest.countDocuments({ status: 'pending' });
    const completedRequests = await ServiceRequest.countDocuments({ status: 'completed' });
    
    const requestsByStatus = await ServiceRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const requestsByType = await ServiceRequest.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // For document types specifically
    const documentRequestsByType = await ServiceRequest.aggregate([
        { $match: { type: 'document' } },
        { $group: { _id: '$documentType', count: { $sum: 1 } } }
    ]);

    // 2. Incident Report Stats
    const totalReports = await Report.countDocuments();
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    
    const reportsByStatus = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const reportsByCategory = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const reportsByLocation = await Report.aggregate([
      { $match: { location: { $exists: true, $ne: "" } } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 3. User Stats
    const totalResidents = await User.countDocuments({ isAdmin: false });

    return NextResponse.json({
      success: true,
      data: {
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          completed: completedRequests,
          byStatus: requestsByStatus.map(item => ({ name: item._id, value: item.count })),
          byType: requestsByType.map(item => ({ name: item._id, value: item.count })),
          byDocumentType: documentRequestsByType.map(item => ({ name: item._id || 'Unspecified', value: item.count }))
        },
        reports: {
          total: totalReports,
          resolved: resolvedReports,
          byStatus: reportsByStatus.map(item => ({ name: item._id, value: item.count })),
          byCategory: reportsByCategory.map(item => ({ name: item._id, value: item.count })),
          byLocation: reportsByLocation.map(item => ({ name: item._id, value: item.count }))
        },
        users: {
          totalResidents
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
