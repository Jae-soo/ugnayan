import { NextRequest, NextResponse } from 'next/server'
import {
  createServiceRequest,
  getServiceRequests,
  updateServiceRequest,
  deleteServiceRequest
} from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const email = searchParams.get('email')
    const userId = searchParams.get('userId')
    const filters: Record<string, string> = {}
    if (status) filters.status = status
    if (type) filters.type = type
    // Support both ?email= and ?userId= as resident identifier
    if (email) {
      filters.email = email
    } else if (userId) {
      filters.email = userId
    }
    const requests = await getServiceRequests(filters)
    // Include success flag and maintain backward-compatible keys
    return NextResponse.json({ success: true, serviceRequests: requests, requests }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch service requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, description, residentName, residentEmail, residentPhone, residentAddress, documentType, purpose, complaintType, additionalInfo, idPicture } = body
    if (!type || !description || !residentName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const serviceRequest = await createServiceRequest({ type, description, residentName, residentEmail, residentPhone, residentAddress, documentType, purpose, complaintType, additionalInfo, idPicture })
    return NextResponse.json({ message: 'Service request created successfully', request: serviceRequest }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create service request' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, adminNotes } = body
    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }
    const updatedRequest = await updateServiceRequest(id, { status, adminNotes })
    return NextResponse.json({ message: 'Service request updated successfully', request: updatedRequest }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update service request'
    const status = message === 'Service request not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }
    await deleteServiceRequest(id)
    return NextResponse.json({ message: 'Service request deleted successfully' }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete service request'
    const status = message === 'Service request not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
