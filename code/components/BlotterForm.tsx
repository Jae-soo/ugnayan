'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { saveBlotter } from '@/lib/storage'
import type { Blotter } from '@/lib/types'
import { ShieldAlert, Send, User, MapPin, Calendar, Clock, Info, Upload, X, Image as ImageIcon, ArrowLeft } from 'lucide-react'

export default function BlotterForm({ onBack, residentUser }: { onBack?: () => void; residentUser?: any }): React.JSX.Element {
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    dateReported: new Date().toISOString().split('T')[0],
    timeReported: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    placeOfIncident: '',
    incidentType: '',
    incidentTypeOther: '',
    
    complainantName: residentUser?.fullName || '',
    complainantAddress: residentUser?.address || '',
    complainantAge: '',
    complainantSex: 'male',
    complainantContact: residentUser?.phone || '',
    
    respondentName: '',
    respondentAddress: '',
    respondentAge: '',
    respondentSex: 'male',
    respondentRelationship: '',
    idPicture: ''
  })

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setIdPreview(base64String)
        handleInputChange('idPicture', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (field: string, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!formData.complainantName || !formData.placeOfIncident || !formData.incidentType || !formData.complainantContact) {
      toast.error('Please fill in all required fields')
      setIsSubmitting(false)
      return
    }

    if (!formData.idPicture) {
      toast.error('Valid ID picture is required to prevent troll reports')
      setIsSubmitting(false)
      return
    }

    try {
      const referenceId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}`
      
      const entryNo = `BL-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`

      const blotterRecord: Blotter = {
        referenceId,
        entryNo,
        dateReported: formData.dateReported,
        timeReported: formData.timeReported,
        placeOfIncident: formData.placeOfIncident,
        incidentType: formData.incidentType === 'other' ? formData.incidentTypeOther : formData.incidentType,
        complainantName: formData.complainantName,
        complainantAddress: formData.complainantAddress,
        complainantAge: formData.complainantAge,
        complainantSex: formData.complainantSex,
        complainantContact: formData.complainantContact,
        respondentName: formData.respondentName,
        respondentAddress: formData.respondentAddress,
        respondentAge: formData.respondentAge,
        respondentSex: formData.respondentSex,
        respondentRelationship: formData.respondentRelationship,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        idPicture: formData.idPicture
      }

      saveBlotter(blotterRecord)
      try { window.dispatchEvent(new Event('barangay_blotters_updated')) } catch {}

      toast.success('Report submitted!', {
        description: `Reference ID: ${referenceId}. An official will verify your ID and contact you.`,
        duration: 8000
      })

      // Reset form
      setFormData({
        dateReported: new Date().toISOString().split('T')[0],
        timeReported: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        placeOfIncident: '',
        incidentType: '',
        incidentTypeOther: '',
        complainantName: residentUser?.fullName || '',
        complainantAddress: residentUser?.address || '',
        complainantAge: '',
        complainantSex: 'male',
        complainantContact: residentUser?.phone || '',
        respondentName: '',
        respondentAddress: '',
        respondentAge: '',
        respondentSex: 'male',
        respondentRelationship: '',
        idPicture: ''
      })
      setIdPreview(null)
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-red-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      )}
      <Card className="shadow-lg max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-red-700 to-red-800 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-2xl uppercase tracking-wider">Official Report Form</CardTitle>
            <CardDescription className="text-red-100 font-medium">
              Official Incident Reporting - Barangay Irisan, Baguio City
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8 px-6 md:px-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Section 1: Report Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b-2 border-red-100 pb-2">
              <Info className="h-5 w-5 text-red-700" />
              <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">Report Information</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateReported" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Date Reported *
                </Label>
                <Input
                  id="dateReported"
                  type="date"
                  value={formData.dateReported}
                  onChange={(e) => handleInputChange('dateReported', e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="border-gray-300 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeReported" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Time Reported *
                </Label>
                <Input
                  id="timeReported"
                  type="time"
                  value={formData.timeReported}
                  onChange={(e) => handleInputChange('timeReported', e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="border-gray-300 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeOfIncident" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Place of Incident *
              </Label>
              <Input
                id="placeOfIncident"
                placeholder="Specific location in Barangay Irisan"
                value={formData.placeOfIncident}
                onChange={(e) => handleInputChange('placeOfIncident', e.target.value)}
                disabled={isSubmitting}
                required
                className="border-gray-300 focus:ring-red-500"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-semibold text-gray-700">Type of Incident *</Label>
              <RadioGroup 
                value={formData.incidentType} 
                onValueChange={(val) => handleInputChange('incidentType', val)}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="complaint" id="type-complaint" />
                  <Label htmlFor="type-complaint" className="cursor-pointer">Complaint</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disturbance" id="type-disturbance" />
                  <Label htmlFor="type-disturbance" className="cursor-pointer">Disturbance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="accident" id="type-accident" />
                  <Label htmlFor="type-accident" className="cursor-pointer">Accident</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crime" id="type-crime" />
                  <Label htmlFor="type-crime" className="cursor-pointer">Crime</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="type-other" />
                  <Label htmlFor="type-other" className="cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
              
              {formData.incidentType === 'other' && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                  <Input
                    placeholder="Please specify incident type"
                    value={formData.incidentTypeOther}
                    onChange={(e) => handleInputChange('incidentTypeOther', e.target.value)}
                    disabled={isSubmitting}
                    className="border-red-200 focus:ring-red-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Complainant / Reporting Party */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-2 border-b-2 border-red-100 pb-2">
              <User className="h-5 w-5 text-red-700" />
              <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">Complainant / Reporting Party</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="complainantName">Full Name *</Label>
                <Input
                  id="complainantName"
                  placeholder="Last Name, First Name, Middle Initial"
                  value={formData.complainantName}
                  onChange={(e) => handleInputChange('complainantName', e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="border-gray-300 focus:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complainantAge">Age</Label>
                <Input
                  id="complainantAge"
                  type="number"
                  placeholder="Years"
                  value={formData.complainantAge}
                  onChange={(e) => handleInputChange('complainantAge', e.target.value)}
                  disabled={isSubmitting}
                  className="border-gray-300 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="complainantAddress">Address</Label>
                <Input
                  id="complainantAddress"
                  placeholder="Purok and Street"
                  value={formData.complainantAddress}
                  onChange={(e) => handleInputChange('complainantAddress', e.target.value)}
                  disabled={isSubmitting}
                  className="border-gray-300 focus:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complainantContact">Contact No. *</Label>
                <Input
                  id="complainantContact"
                  placeholder="Mobile or Landline"
                  value={formData.complainantContact}
                  onChange={(e) => handleInputChange('complainantContact', e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="border-gray-300 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-semibold text-gray-700">Sex</Label>
              <RadioGroup 
                value={formData.complainantSex} 
                onValueChange={(val) => handleInputChange('complainantSex', val)}
                className="flex gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="comp-male" />
                  <Label htmlFor="comp-male" className="cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="comp-female" />
                  <Label htmlFor="comp-female" className="cursor-pointer">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="comp-other" />
                  <Label htmlFor="comp-other" className="cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Section 3: Respondent / Person Complained Of */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-2 border-b-2 border-red-100 pb-2">
              <User className="h-5 w-5 text-red-700" />
              <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">Respondent / Person Complained Of</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="respondentName">Full Name</Label>
                <Input
                  id="respondentName"
                  placeholder="Last Name, First Name, Middle Initial"
                  value={formData.respondentName}
                  onChange={(e) => handleInputChange('respondentName', e.target.value)}
                  disabled={isSubmitting}
                  className="border-gray-300 focus:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respondentAge">Age</Label>
                <Input
                  id="respondentAge"
                  type="number"
                  placeholder="Years"
                  value={formData.respondentAge}
                  onChange={(e) => handleInputChange('respondentAge', e.target.value)}
                  disabled={isSubmitting}
                  className="border-gray-300 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="respondentAddress">Address</Label>
              <Input
                id="respondentAddress"
                placeholder="Purok and Street"
                value={formData.respondentAddress}
                onChange={(e) => handleInputChange('respondentAddress', e.target.value)}
                disabled={isSubmitting}
                className="border-gray-300 focus:ring-red-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="font-semibold text-gray-700">Sex</Label>
                <RadioGroup 
                  value={formData.respondentSex} 
                  onValueChange={(val) => handleInputChange('respondentSex', val)}
                  className="flex gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="resp-male" />
                    <Label htmlFor="resp-male" className="cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="resp-female" />
                    <Label htmlFor="resp-female" className="cursor-pointer">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="resp-other" />
                    <Label htmlFor="resp-other" className="cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
              <Label htmlFor="respondentRelationship">Relationship to Complainant</Label>
              <Input
                id="respondentRelationship"
                placeholder="e.g., Neighbor, Relative, etc."
                value={formData.respondentRelationship}
                onChange={(e) => handleInputChange('respondentRelationship', e.target.value)}
                disabled={isSubmitting}
                className="border-gray-300 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

          {/* ID Verification Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b-2 border-red-100 pb-2">
              <ImageIcon className="h-5 w-5 text-red-700" />
              <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">ID Verification *</h3>
            </div>
            
            <div className="bg-red-50/50 p-6 rounded-xl border-2 border-dashed border-red-200">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {idPreview ? (
                  <div className="relative w-full max-w-sm">
                    <img src={idPreview} alt="ID Preview" className="rounded-lg shadow-md border-2 border-white" />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm" 
                      className="absolute -top-2 -right-2 rounded-full h-8 w-8 p-0"
                      onClick={() => {
                        setIdPreview(null)
                        handleInputChange('idPicture', '')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-red-100 rounded-full">
                      <Upload className="h-10 w-10 text-red-700" />
                    </div>
                    <div>
                      <p className="text-red-900 font-bold">Upload a Valid ID</p>
                      <p className="text-sm text-red-700 font-medium">Required to prevent troll reports. PNG, JPG up to 5MB.</p>
                    </div>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="blotter-id-upload" 
                      onChange={handleFileChange}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-red-300 hover:bg-red-100 text-red-700"
                      onClick={() => document.getElementById('blotter-id-upload')?.click()}
                    >
                      Select Image
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Important Warning */}
          <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
            <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              IMPORTANT NOTICE:
            </h4>
            <ul className="text-sm text-red-800 space-y-2 font-medium">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
                Providing false information in an official report is subject to legal action under Article 183 of the Revised Penal Code (Perjury).
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
                This submission will be reviewed by the Barangay Officials and Lupong Tagapamayapa.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
                A schedule for mediation may be issued if both parties reside in the same barangay.
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold text-xl py-8 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
            disabled={isSubmitting}
          >
            <Send className="mr-3 h-6 w-6" />
            {isSubmitting ? 'PROCESSING SUBMISSION...' : 'SUBMIT OFFICIAL REPORT'}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  )
}
