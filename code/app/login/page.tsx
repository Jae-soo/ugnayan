'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserLogin from '@/components/UserLogin'
import OfficialLogin from '@/components/OfficialLogin'
import { Button } from '@/components/ui/button'
import { Shield, Users, ArrowLeft } from 'lucide-react'

export default function LoginPage(): React.JSX.Element {
  const router = useRouter()
  const [role, setRole] = useState<'resident' | 'official' | null>(null)

  const handleResidentLoginSuccess = (): void => {
    router.push('/')
  }

  const handleOfficialLoginSuccess = (official: { username: string; role: string; name: string }): void => {
    router.push('/')
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-green-50 px-4 relative">
        <Button 
          variant="ghost" 
          className="absolute top-8 left-8 text-gray-600 hover:bg-white/20"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Ugnayan</h1>
            <p className="text-sm text-gray-600">
              Please select how you want to access the portal
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('resident')}
              className="border rounded-lg p-4 text-left hover:shadow-md transition-shadow flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">I am a Resident</p>
                  <p className="text-xs text-gray-600">
                    Login to request services, file reports, and track requests
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('official')}
              className="border rounded-lg p-4 text-left hover:shadow-md transition-shadow flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">I am an Official</p>
                  <p className="text-xs text-gray-600">
                    Login to access the administrative dashboard
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (role === 'resident') {
    return (
      <UserLogin
        open={true}
        onOpenChange={(open) => {
          if (!open) setRole(null)
        }}
        onLoginSuccess={handleResidentLoginSuccess}
        onRegisterClick={() => router.push('/register')}
        asPage
      />
    )
  }

  return (
    <OfficialLogin
      open={true}
      onOpenChange={(open) => {
        if (!open) setRole(null)
      }}
      onLoginSuccess={handleOfficialLoginSuccess}
      asPage
    />
  )
}
