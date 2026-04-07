import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ success: false, message: 'Username is required' }, { status: 400 });
    }

    const notifications = await Notification.find({ recipientId: username }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { recipientId, type, title, message, relatedId, link } = body;

    if (!recipientId || !type || !title || !message) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const notification = await Notification.create({
      recipientId,
      type,
      title,
      message,
      relatedId,
      link,
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, read, markAll, username } = body;

    if (markAll && username) {
       await Notification.updateMany({ recipientId: username }, { read: true });
       return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'Notification ID is required' }, { status: 400 });
    }

    const notification = await Notification.findByIdAndUpdate(id, { read }, { new: true });
    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const id = searchParams.get('id');

    if (id) {
        await Notification.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Notification deleted' });
    }

    if (username) {
      await Notification.deleteMany({ recipientId: username });
      return NextResponse.json({ success: true, message: 'All notifications cleared' });
    }

    return NextResponse.json({ success: false, message: 'Username or ID is required' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
