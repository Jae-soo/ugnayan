import { NextResponse } from 'next/server'
import { checkDatabaseHealth, configureDatabase } from '@/lib/database'

export async function GET() {
  const status = await checkDatabaseHealth()
  const http = status.status === 'healthy' ? 200 : 500
  return NextResponse.json(status, { status: http })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const uri = body?.uri
    if (!uri || typeof uri !== 'string') {
      return NextResponse.json({ status: 'unhealthy', message: 'Missing uri' }, { status: 400 })
    }
    configureDatabase(uri)
    const status = await checkDatabaseHealth()
    const http = status.status === 'healthy' ? 200 : 500
    return NextResponse.json(status, { status: http })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to configure database'
    return NextResponse.json({ status: 'unhealthy', message }, { status: 500 })
  }
}
