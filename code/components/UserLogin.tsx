'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LogIn, Loader2, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { saveResidentUser, getLocalUsers } from '@/lib/storage'

interface UserLoginProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoginSuccess: () => void
  onRegisterClick: () => void
  asPage?: boolean
}

export default function UserLogin({ open, onOpenChange, onLoginSuccess, onRegisterClick, asPage = false }: UserLoginProps): React.JSX.Element {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!formData.username || !formData.password) {
      toast.error('Please enter username and password')
      return
    }

    setLoading(true)
    
    // 1. ALWAYS Check Local Storage FIRST
    const localUsers = getLocalUsers()
    const localUser = localUsers.find(u => u.username === formData.username)
    
    if (localUser) {
      saveResidentUser(localUser)
      toast.success(`Welcome back (Local Access), ${localUser.fullName}!`)
      setLoading(false)
      onLoginSuccess()
      onOpenChange(false)
      setFormData({ username: '', password: '' })

      // BACKGROUND SYNC: Try to connect to cloud in background to sync data, but don't block user
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username: formData.username, password: formData.password })
      }).then(res => res.json()).then(data => {
        if (data.success) saveResidentUser(data.user);
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
          action: 'login',
          username: formData.username,
          password: formData.password
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Successful MongoDB login, sync to local
        saveResidentUser(data.user)
        toast.success(data.message || 'Login successful!')
        setLoading(false)
        onLoginSuccess()
        onOpenChange(false)
        setFormData({ username: '', password: '' })
        return
      }

      toast.error(data.message || 'Invalid credentials')
    } catch (error) {
      toast.error('Login failed. Please check your connection.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="Enter your username"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
          required
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
              Don&apos;t have an account?
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onOpenChange(false)
            onRegisterClick()
          }}
          disabled={loading}
          className="w-full"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create New Account
        </Button>
      </div>
    </form>
  )

  if (asPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-green-50 px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 relative">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Ugnayan</h1>
            <p className="text-sm text-gray-500">Barangay Irisan Service Portal</p>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 flex items-center justify-center gap-2">
            <LogIn className="h-5 w-5 text-green-600" />
            Resident Login
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Sign in to your account to access barangay services
          </p>
          {form}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <LogIn className="h-6 w-6 text-green-600" />
            Resident Login
          </DialogTitle>
          <DialogDescription>
            Sign in to your Ugnayan account to access services
          </DialogDescription>
        </DialogHeader>

        {form}
      </DialogContent>
    </Dialog>
  )
}
