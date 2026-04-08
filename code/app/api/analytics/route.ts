import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ServiceRequest from '@/models/ServiceRequest';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // 1. Service Request Stats
    const totalRequests = await ServiceRequest.countDocuments({ type: 'document' });
    const pendingRequests = await ServiceRequest.countDocuments({ type: 'document', status: 'pending' });
    const completedRequests = await ServiceRequest.countDocuments({ type: 'document', status: 'completed' });
    
    const requestsByStatus = await ServiceRequest.aggregate([
      { $match: { type: 'document' } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const documentRequestsByType = await ServiceRequest.aggregate([
        { $match: { type: 'document' } },
        { $group: { _id: '$documentType', count: { $sum: 1 } } }
    ]);

    // 2. Incident Report Stats
    const totalReports = await ServiceRequest.countDocuments({ type: { $ne: 'document' } });
    const resolvedReports = await ServiceRequest.countDocuments({ type: { $ne: 'document' }, status: 'resolved' });
    
    const reportsByStatus = await ServiceRequest.aggregate([
      { $match: { type: { $ne: 'document' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const reportsByCategory = await ServiceRequest.aggregate([
      { $match: { type: { $ne: 'document' } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const reportsByLocation = await ServiceRequest.aggregate([
      { $match: { type: { $ne: 'document' }, location: { $exists: true, $ne: "" } } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 3. Trend Data (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trendData = await ServiceRequest.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: { $cond: { if: { $eq: ['$type', 'document'] }, then: 'request', else: 'report' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // 4. User Stats
    const totalResidents = await User.countDocuments({ isAdmin: false });

    return NextResponse.json({
      success: true,
      data: {
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          completed: completedRequests,
          byStatus: requestsByStatus.map(item => ({ name: item._id, value: item.count })),
          byType: [{ name: 'document', value: totalRequests }],
          byDocumentType: documentRequestsByType.map(item => ({ name: item._id || 'Unspecified', value: item.count }))
        },
        reports: {
          total: totalReports,
          resolved: resolvedReports,
          byStatus: reportsByStatus.map(item => ({ name: item._id, value: item.count })),
          byCategory: reportsByCategory.map(item => ({ name: item._id, value: item.count })),
          byLocation: reportsByLocation.map(item => ({ name: item._id, value: item.count }))
        },
        trends: trendData.map(item => ({
          year: item._id.year,
          month: item._id.month,
          type: item._id.type,
          count: item.count
        })),
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
