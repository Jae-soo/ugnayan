'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserPlus, Loader2, X, Database, Smartphone } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { saveOfficialUser, getLocalOfficials } from '@/lib/storage'

interface OfficialRegistrationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  asPage?: boolean
}

export default function OfficialRegistration({ open, onOpenChange, onSuccess, asPage = false }: OfficialRegistrationProps): React.JSX.Element {
  const [loading, setLoading] = useState(false)
  const [storageChoice, setStorageChoice] = useState<'cloud' | 'local'>('cloud')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    role: ''
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

    if (!formData.username || !formData.fullName || !formData.role) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    // Manual Local Choice
    if (storageChoice === 'local') {
      const localOfficials = getLocalOfficials()
      if (localOfficials.find(o => o.username === formData.username)) {
        toast.error('Official username already exists on this device.')
        setLoading(false)
        return
      }

      const newLocalOfficial = {
        id: `local-off-${Date.now()}`,
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        isLocalOnly: true
      }
      saveOfficialUser(newLocalOfficial)
      toast.success('Official account created locally on this device.')
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
          action: 'register_official',
          username: formData.username,
          password: formData.password,
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Successful MongoDB registration, sync to local
        saveOfficialUser(data.user)
        toast.success(data.message || 'Official registered successfully!')
        setLoading(false)
        onSuccess()
        onOpenChange(false)
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          fullName: '',
          role: ''
        })
        return
      }

      // If database error, provide a more helpful message
      if (res.status === 500 && data.message?.includes('Database connection error')) {
        // Try local fallback
        const localOfficials = getLocalOfficials()
        const exists = localOfficials.find(o => o.username === formData.username)
        if (exists) {
          toast.error('Official username already exists locally. Please choose another or try logging in.')
          setLoading(false)
          return
        }

        const newLocalOfficial = {
          id: `local-off-${Date.now()}`,
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          isLocalOnly: true
        }
        saveOfficialUser(newLocalOfficial)
        toast.success('Database offline: Official account created locally on this device.')
        setLoading(false)
        onSuccess()
        onOpenChange(false)
        return
      }

      const errorMsg = data.message || 'Registration failed';
      toast.error(errorMsg)
      setLoading(false)
    } catch (error) {
      // Offline fallback
      const localOfficials = getLocalOfficials()
      const exists = localOfficials.find(o => o.username === formData.username)
      
      if (exists) {
        toast.error('Official username already exists locally.')
        setLoading(false)
      } else {
        const newLocalOfficial = {
          id: `local-off-${Date.now()}`,
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          isLocalOnly: true
        }
        saveOfficialUser(newLocalOfficial)
        toast.success('Offline Mode: Official account created locally on this device.')
        setLoading(false)
        onSuccess()
        onOpenChange(false)
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          fullName: '',
          role: ''
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
            <RadioGroupItem value="cloud" id="cloud-off" className="text-blue-600" />
            <Label htmlFor="cloud-off" className="flex items-center gap-2 cursor-pointer">
              <Database className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Cloud (Recommended)</p>
                <p className="text-[10px] text-gray-500">Access from any device</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="local" id="local-off" className="text-green-600" />
            <Label htmlFor="local-off" className="flex items-center gap-2 cursor-pointer">
              <Smartphone className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Local Device Only</p>
                <p className="text-[10px] text-gray-500">Stay on this device only</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          placeholder="Enter full name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Barangay Captain">Barangay Captain</SelectItem>
            <SelectItem value="Barangay Secretary">Barangay Secretary</SelectItem>
            <SelectItem value="Kagawad">Kagawad</SelectItem>
            <SelectItem value="Sangguniang Kabataan">Sangguniang Kabataan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <Input
          id="username"
          placeholder="Choose a username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
            placeholder="Min. 8 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            disabled={loading}
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Official Account
          </>
        )}
      </Button>
    </form>
  )

  if (asPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-green-50 px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6 relative">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Official Registration</h1>
            <p className="text-sm text-gray-600">Create a new official account</p>
          </div>
          {form}
          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Button variant="link" className="p-0 text-green-600 font-semibold" onClick={onSuccess}>
              Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="h-5 w-5 text-green-600" />
            Official Registration
          </DialogTitle>
          <DialogDescription>
            Create a new official account
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}
