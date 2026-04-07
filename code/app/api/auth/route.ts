import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByUsername, verifyUserPassword, createOfficial, findOfficialByUsername } from '@/lib/database'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const action = (body.action || '').toLowerCase()

  if (action === 'register') {
    const { username, password, email, phone, fullName, address } = body
    if (!username || !password || !phone || !fullName || !address) {
      return NextResponse.json({ success: false, message: 'Please fill in all required fields' }, { status: 400 })
    }
    try {
      const user = await createUser({ username, password, email, phone, fullName, address })
      return NextResponse.json({ success: true, message: 'User registered successfully', user })
    } catch (error) {
      console.error('User Registration Error:', error); // Added logging
      const message = error instanceof Error ? error.message : 'Registration failed'
      const status = message === 'Username or email already exists' ? 409 : 500
      return NextResponse.json({ success: false, message }, { status })
    }
  }

  if (action === 'register_official') {
    const { username, password, email, fullName, role } = body
    if (!username || !password || !fullName || !role) {
      return NextResponse.json({ success: false, message: 'Please fill in all required fields' }, { status: 400 })
    }
    try {
      const official = await createOfficial({ username, password, email, fullName, role })
      return NextResponse.json({ success: true, message: 'Official registered successfully', user: official })
    } catch (error) {
      console.error('Official Registration Error:', error); // Added logging
      const message = error instanceof Error ? error.message : 'Registration failed'
      const status = message === 'Username or email already exists' ? 409 : 500
      return NextResponse.json({ success: false, message }, { status })
    }
  }

  if (action === 'login') {
    const { username, password } = body
    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 })
    }
    try {
      const user = await findUserByUsername(username)
      if (!user) return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
      const ok = await verifyUserPassword(password, user.password)
      if (!ok) return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
      return NextResponse.json({ success: true, message: 'Login successful', user: { id: user._id.toString(), username: user.username, email: user.email, phone: user.phone, fullName: user.fullName, address: user.address, isAdmin: user.isAdmin } })
    } catch (error) {
      console.error('Login Error:', error)
      return NextResponse.json({ success: false, message: 'Database connection error. Please try again.' }, { status: 500 })
    }
  }

  if (action === 'login_official') {
    const { username, password } = body
    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password are required' }, { status: 400 })
    }
    try {
      const official = await findOfficialByUsername(username)
      if (!official) return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
      const ok = await verifyUserPassword(password, official.password)
      if (!ok) return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
      return NextResponse.json({ success: true, message: 'Login successful', user: { id: official._id.toString(), username: official.username, email: official.email, fullName: official.fullName, role: official.role } })
    } catch (error) {
      console.error('Official Login Error:', error)
      return NextResponse.json({ success: false, message: 'Database connection error. Please try again.' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
}
