import { NextRequest, NextResponse } from 'next/server';
import { createReply, getRepliesByReferenceId } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referenceId = searchParams.get('referenceId');

    if (!referenceId) {
      return NextResponse.json({ success: false, message: 'Reference ID is required' }, { status: 400 });
    }

    const replies = await getRepliesByReferenceId(referenceId);
    return NextResponse.json({ success: true, replies });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceId, type, officialName, officialRole, message, recipientEmail, recipientPhone, recipientName, attachments } = body;

    if (!referenceId || !type || !officialName || !officialRole || !message) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const reply = await createReply({
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

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
