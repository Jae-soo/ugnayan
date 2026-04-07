import { NextRequest, NextResponse } from 'next/server'
import { createReport, getReports, updateReport, deleteReport } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const email = searchParams.get('email')
    const userId = searchParams.get('userId')
    const filters: Record<string, string> = {}
    if (status) filters.status = status
    // Support both ?email= and ?userId= as reporter identifier
    if (email) {
      filters.email = email
    } else if (userId) {
      filters.email = userId
    }
    const reports = await getReports(filters)
    // Include success flag and maintain backward-compatible keys
    return NextResponse.json({ success: true, reports }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, category, description, location, reporterName, reporterEmail, reporterPhone, priority, idPicture } = body
    if (!title || !category || !description || !reporterName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (reporterEmail) {
      const emailOk = /^[A-Za-z0-9._%+-]+@gmail\.com$/i.test(reporterEmail)
      if (!emailOk) {
        return NextResponse.json({ error: 'Email must be a valid Gmail address' }, { status: 400 })
      }
    }
    if (reporterPhone) {
      const digits = String(reporterPhone).replace(/\D/g, '')
      if (digits.length !== 11) {
        return NextResponse.json({ error: 'Phone number must be exactly 11 digits' }, { status: 400 })
      }
    }
    const report = await createReport({ title, category, description, location, reporterName, reporterEmail, reporterPhone, priority, idPicture })
    return NextResponse.json({ message: 'Report created successfully', report }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, response } = body
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }
    const updatedReport = await updateReport(id, { status, response })
    return NextResponse.json({ message: 'Report updated successfully', report: updatedReport }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update report'
    const status = message === 'Report not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }
    await deleteReport(id)
    return NextResponse.json({ message: 'Report deleted successfully' }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete report'
    const status = message === 'Report not found' ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
