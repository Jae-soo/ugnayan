'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserPlus, Loader2, X, Database, Smartphone } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { saveResidentUser, getLocalUsers } from '@/lib/storage'

interface UserRegistrationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  asPage?: boolean
}

export default function UserRegistration({ open, onOpenChange, onSuccess, asPage = false }: UserRegistrationProps): React.JSX.Element {
  const [loading, setLoading] = useState(false)
  const [storageChoice, setStorageChoice] = useState<'cloud' | 'local'>('cloud')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    fullName: '',
    address: ''
  })

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    if (!formData.username || !formData.phone || !formData.fullName || !formData.address) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    // Manual Local Choice
    if (storageChoice === 'local') {
      const localUsers = getLocalUsers()
      if (localUsers.find(u => u.username === formData.username)) {
        toast.error('Username already exists on this device.')
        setLoading(false)
        return
      }

      const newLocalUser = {
        id: `local-${Date.now()}`,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        fullName: formData.fullName,
        address: formData.address,
        isAdmin: false,
        isLocalOnly: true
      }
      saveResidentUser(newLocalUser)
      toast.success('Account created locally on this device.')
      setLoading(false)
      onSuccess()
      onOpenChange(false)
      return
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'register',
          username: formData.username,
          password: formData.password,
          email: formData.email,
          phone: formData.phone,
          fullName: formData.fullName,
          address: formData.address
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Successful MongoDB registration, sync to local
        saveResidentUser(data.user)
        toast.success(data.message || 'Registration successful! You can now use the services.')
        setLoading(false)
        onSuccess()
        onOpenChange(false)
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          phone: '',
          fullName: '',
          address: ''
        })
        return
      }

      // If database error, provide a more helpful message
      if (res.status === 500 && data.message?.includes('Database connection error')) {
        // Offer local registration as fallback
        const localUsers = getLocalUsers()
        const exists = localUsers.find(u => u.username === formData.username)
        if (exists) {
          toast.error('Username already exists locally. Please choose another or try logging in.')
          setLoading(false)
          return
        }

        const newLocalUser = {
          id: `local-${Date.now()}`,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          fullName: formData.fullName,
          address: formData.address,
          isAdmin: false,
          isLocalOnly: true // Mark as local account
        }
        saveResidentUser(newLocalUser)
        toast.success('Database offline: Account created locally on this device.')
        setLoading(false)
        onSuccess()
        onOpenChange(false)
        return
      }

      toast.error(data.message || 'Registration failed')
      setLoading(false)
    } catch (error) {
      // Network error or fetch failed, try local fallback
      const localUsers = getLocalUsers()
      const exists = localUsers.find(u => u.username === formData.username)
      
      if (exists) {
        toast.error('Username already exists locally. Please choose another or try logging in.')
        setLoading(false)
      } else {
        const newLocalUser = {
          id: `local-${Date.now()}`,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          fullName: formData.fullName,
          address: formData.address,
          isAdmin: false,
          isLocalOnly: true
        }
        saveResidentUser(newLocalUser)
        toast.success('Offline Mode: Account created locally on this device.')
        setLoading(false)
        onSuccess()
        onOpenChange(false)
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          phone: '',
          fullName: '',
          address: ''
        })
      }
    }
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Storage Choice Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <Label className="text-sm font-semibold text-gray-700 mb-3 block">Account Storage Option</Label>
        <RadioGroup 
          defaultValue="cloud" 
          value={storageChoice} 
          onValueChange={(v) => setStorageChoice(v as 'cloud' | 'local')}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cloud" id="cloud" className="text-blue-600" />
            <Label htmlFor="cloud" className="flex items-center gap-2 cursor-pointer">
              <Database className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Cloud (Recommended)</p>
                <p className="text-[10px] text-gray-500">Access from any device</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="local" id="local" className="text-green-600" />
            <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer">
              <Smartphone className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Local Device Only</p>
                <p className="text-[10px] text-gray-500">Stay on this device only</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Choose a username"
            required
            disabled={loading}
          />
          <p className="text-xs text-gray-500">3-32 characters, letters, numbers, ._-</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Juan Dela Cruz"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your.email@example.com"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+63 912 345 6789"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Complete Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Purok, Street, Barangay Irisan, Baguio City"
          required
          disabled={loading}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Min. 8 characters"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Re-enter password"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Account
            </>
          )}
        </Button>
      </div>
    </form>
  )

  if (asPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-green-50 px-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8 max-h-[90vh] overflow-y-auto relative">
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
            <UserPlus className="h-5 w-5 text-green-600" />
            Create Your Account
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Register to access Ugnayan services and manage your requests
          </p>
          {form}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserPlus className="h-6 w-6 text-green-600" />
            Create Your Account
          </DialogTitle>
          <DialogDescription>
            Register to access Ugnayan services and manage your requests
          </DialogDescription>
        </DialogHeader>

        {form}
      </DialogContent>
    </Dialog>
  )
}
