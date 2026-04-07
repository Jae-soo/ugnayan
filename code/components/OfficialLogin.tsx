'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Eye, EyeOff, X } from 'lucide-react'
import { toast } from 'sonner'
import { saveOfficialUser, getLocalOfficials } from '@/lib/storage'
import OfficialRegistration from './OfficialRegistration'

interface OfficialLoginProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoginSuccess: (official: { username: string; role: string; name: string }) => void
  asPage?: boolean
}

export default function OfficialLogin({ open, onOpenChange, onLoginSuccess, asPage = false }: OfficialLoginProps): React.JSX.Element {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [showRegister, setShowRegister] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 1. ALWAYS Check Local Storage FIRST
    const localOfficials = getLocalOfficials()
    const localOfficial = localOfficials.find(o => o.username === username)
    
    if (localOfficial) {
      saveOfficialUser(localOfficial)
      toast.success(`Welcome back (Local Access), ${localOfficial.fullName}!`)
      onLoginSuccess({
        username: localOfficial.username,
        role: localOfficial.role,
        name: localOfficial.fullName
      })
      onOpenChange(false)
      setUsername('')
      setPassword('')
      setLoading(false)
      
      // BACKGROUND SYNC: Try to connect to cloud in background to sync data, but don't block user
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login_official', username, password })
      }).then(res => res.json()).then(data => {
        if (data.success) saveOfficialUser(data.user);
      }).catch(() => {/* Ignore background sync errors */});
      
      return
    }

    // 2. Only if NOT found locally, try Cloud
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'login_official',
          username,
          password
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Successful MongoDB login, sync to local
        saveOfficialUser(data.user)
        toast.success(`Welcome back, ${data.user.fullName}!`)
        onLoginSuccess({
          username: data.user.username,
          role: data.user.role,
          name: data.user.fullName
        })
        onOpenChange(false)
        setUsername('')
        setPassword('')
        return
      }

      setError(data.message || 'Invalid username or password')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (showRegister) {
    return (
      <OfficialRegistration
        open={true}
        onOpenChange={() => setShowRegister(false)}
        onSuccess={() => setShowRegister(false)}
        asPage={asPage}
      />
    )
  }

  const form = (
    <div className="w-full">
      <form onSubmit={handleLogin} className="space-y-4 mt-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Button
            type="button"
            variant="link"
            className="p-0 text-green-600 font-semibold"
            onClick={() => setShowRegister(true)}
          >
            Register here
          </Button>
        </div>
      </form>
    </div>
  )

  if (asPage) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Official Portal</h1>
            <p className="text-sm text-gray-600">Secure access for barangay officials</p>
          </div>
          
          {form}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md relative">
        <button
          type="button"
          aria-label="Close"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        <DialogHeader>
          <div className="mx-auto bg-green-100 p-3 rounded-full mb-4">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">Official Login</DialogTitle>
          <DialogDescription className="text-center">
            Enter your credentials to access the dashboard
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}
