'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { saveServiceRequest } from '@/lib/storage'
import type { ServiceRequest } from '@/lib/types'
import { FileText, Send, CheckCircle2, ShieldCheck, ChevronRight, ArrowLeft, Upload, Image as ImageIcon, X, MapPin, AlertTriangle, Mountain, CloudRain } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const SERVICE_TYPES = [
  // Document Types
  { id: 'barangay-clearance', name: 'Barangay Clearance', icon: <FileText className="h-10 w-10 text-blue-600" />, description: 'Required for job applications, ID applications, and other legal purposes.', category: 'document' },
  { id: 'certificate-of-residency', name: 'Certificate of Residency', icon: <MapPin className="h-10 w-10 text-green-600" />, description: 'Proof that you are a resident of Barangay Irisan.', category: 'document' },
  { id: 'certificate-of-indigency', name: 'Certificate of Indigency', icon: <ShieldCheck className="h-10 w-10 text-orange-600" />, description: 'For scholarship, medical assistance, or social service requirements.', category: 'document' },
  { id: 'business-permit', name: 'Business Permit', icon: <ImageIcon className="h-10 w-10 text-purple-600" />, description: 'Clearance to operate a business within the barangay.', category: 'document' },
  { id: 'certificate-of-good-moral', name: 'Certificate of Good Moral', icon: <CheckCircle2 className="h-10 w-10 text-indigo-600" />, description: 'Often required for school or employment.', category: 'document' },
  { id: 'barangay-id', name: 'Barangay ID', icon: <ImageIcon className="h-10 w-10 text-red-600" />, description: 'Official identification card issued by the barangay.', category: 'document' },
  { id: 'other-document', name: 'Other Document', icon: <FileText className="h-10 w-10 text-gray-600" />, description: 'Any other specialized barangay documents.', category: 'document' },
  
  // Report Types
  { id: 'emergency', name: 'Emergency', icon: <AlertTriangle className="h-10 w-10 text-red-600" />, description: 'Fire, Accident, or Medical emergencies.', category: 'report' },
  { id: 'landslide', name: 'Landslide / Erosion', icon: <Mountain className="h-10 w-10 text-orange-700" />, description: 'Report soil erosion or landslide hazards.', category: 'report' },
  { id: 'flooding', name: 'Flooding', icon: <CloudRain className="h-10 w-10 text-blue-400" />, description: 'Report drainage problems or flooding.', category: 'report' },
  { id: 'road-issue', name: 'Road Issue', icon: <MapPin className="h-10 w-10 text-gray-700" />, description: 'Potholes, broken roads, or infrastructure problems.', category: 'report' },
  { id: 'other-report', name: 'Other Issue', icon: <AlertTriangle className="h-10 w-10 text-yellow-600" />, description: 'General community concerns or hazards.', category: 'report' },
]

export default function ServiceRequestForm({ onBack, residentUser, initialCategory = 'document' }: { onBack?: () => void; residentUser?: any; initialCategory?: 'document' | 'report' }): React.JSX.Element {
  const [step, setStep] = useState<'selection' | 'form'>('selection')
  const [showTerms, setShowTerms] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [currentCategory, setCurrentCategory] = useState<'document' | 'report'>(initialCategory)
  
  const [formData, setFormData] = useState({
    fullName: residentUser?.fullName || '',
    phone: residentUser?.phone || '',
    address: residentUser?.address || '',
    documentType: '',
    purpose: '',
    additionalInfo: '',
    idPicture: '',
    location: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  // Update form if residentUser changes (e.g. logs in while on page)
  React.useEffect(() => {
    if (residentUser) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || residentUser.fullName || '',
        phone: prev.phone || residentUser.phone || '',
        address: prev.address || residentUser.address || ''
      }))
    }
  }, [residentUser])

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleDocSelect = (docId: string) => {
    setSelectedDoc(docId)
    const category = SERVICE_TYPES.find(s => s.id === docId)?.category || 'document'
    setCurrentCategory(category as any)
    setShowTerms(true)
  }

  const handleAcceptTerms = () => {
    if (selectedDoc) {
      handleInputChange('documentType', selectedDoc)
      setShowTerms(false)
      setStep('form')
    }
  }

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

    if (!formData.fullName || !formData.phone || (!formData.address && currentCategory === 'document') || (!formData.location && currentCategory === 'report') || !formData.documentType || !formData.purpose) {
      toast.error('Please fill in all required fields')
      setIsSubmitting(false)
      return
    }

    if (!formData.idPicture) {
      toast.error('Valid ID picture is required to prevent troll requests')
      setIsSubmitting(false)
      return
    }

    const digits = formData.phone.replace(/\D/g, '')
    if (digits.length !== 11) {
      toast.error('Phone number must be exactly 11 digits')
      setIsSubmitting(false)
      return
    }

    try {
      const referenceId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}`
      const localReq: ServiceRequest = {
        referenceId,
        fullName: formData.fullName,
        email: residentUser?.email || '', 
        phone: formData.phone,
        address: formData.address || formData.location || '',
        documentType: formData.documentType,
        purpose: formData.purpose,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        additionalInfo: formData.additionalInfo || undefined,
        idPicture: formData.idPicture,
        location: formData.location,
        priority: currentCategory === 'report' ? formData.priority : undefined,
        reportType: currentCategory === 'report' ? formData.documentType as any : undefined
      }
      saveServiceRequest(localReq)
      try { window.dispatchEvent(new Event('barangay_service_requests_updated')) } catch {}

      let apiReferenceId: string | undefined
      try {
        const response = await fetch('/api/service-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: currentCategory === 'document' ? 'document' : formData.documentType,
            description: formData.purpose,
            residentName: formData.fullName,
            residentEmail: residentUser?.email || '', 
            residentPhone: formData.phone,
            residentAddress: formData.address,
            documentType: formData.documentType,
            purpose: formData.purpose,
            additionalInfo: formData.additionalInfo,
            idPicture: formData.idPicture,
            location: formData.location,
            priority: formData.priority
          }),
        })
        if (response.ok) {
          const data = await response.json()
          apiReferenceId = data.request?._id as string | undefined
        }
      } catch (err) {
        console.error('API submission failed:', err)
      }

      toast.success('Service request submitted!', {
        description: apiReferenceId 
          ? `Reference ID: ${apiReferenceId}. Our officials will verify your ID and process your request.`
          : `Reference ID: ${referenceId}. Saved locally. Officials will review your request.`,
        duration: 8000
      })

      // Reset form and go back to selection
      setFormData({
        fullName: '',
        phone: '',
        address: '',
        documentType: '',
        purpose: '',
        additionalInfo: '',
        idPicture: '',
        location: '',
        priority: 'medium'
      })
      setIdPreview(null)
      setStep('selection')
      setSelectedDoc(null)
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'selection') {
    return (
      <div className="space-y-6">
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        )}
        <Card className="shadow-lg border-blue-100 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-8">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
              {currentCategory === 'document' ? <FileText className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
              {currentCategory === 'document' ? 'Document Selection' : 'Issue Selection'}
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg mt-2">
              {currentCategory === 'document' 
                ? 'Select the document you wish to request from Barangay Irisan' 
                : 'Select the type of issue you want to report'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICE_TYPES.filter(s => s.category === currentCategory).map((doc) => (
                <Card 
                  key={doc.id} 
                  className={`cursor-pointer hover:shadow-xl transition-all hover:scale-[1.03] border-2 group relative overflow-hidden ${currentCategory === 'document' ? 'hover:border-blue-400' : 'hover:border-orange-400'}`}
                  onClick={() => handleDocSelect(doc.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="mb-3 group-hover:scale-110 transition-transform">
                      {doc.icon}
                    </div>
                    <CardTitle className={`text-xl transition-colors ${currentCategory === 'document' ? 'group-hover:text-blue-600' : 'group-hover:text-orange-600'}`}>{doc.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                    <div className={`mt-4 flex items-center font-semibold text-sm ${currentCategory === 'document' ? 'text-blue-600' : 'text-orange-600'}`}>
                      {currentCategory === 'document' ? 'Request Now' : 'Report Now'} <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showTerms} onOpenChange={setShowTerms}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl text-blue-700">
                <ShieldCheck className="h-6 w-6" />
                Terms and Conditions
              </DialogTitle>
              <DialogDescription className="text-lg">
                Please review and accept before proceeding with your request.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-4 bg-gray-50 rounded-lg space-y-4 text-sm text-gray-700">
              <p className="font-bold text-gray-900">1. Data Privacy Act Compliance</p>
              <p>I hereby authorize Barangay Irisan to collect and process my personal data for the purpose of my document request in accordance with the Data Privacy Act of 2012.</p>
              
              <p className="font-bold text-gray-900">2. Accuracy of Information</p>
              <p>I certify that all information provided in this request is true, accurate, and complete. Any false information may lead to the rejection of my request or legal consequences.</p>
              
              <p className="font-bold text-gray-900">3. Residency Requirement</p>
              <p>I understand that most document requests are only available to bona fide residents of Barangay Irisan, Baguio City.</p>
              
              <p className="font-bold text-gray-900">4. Processing & Fees</p>
              <p>I acknowledge that processing may take 1-3 business days and that certain documents may require payment of corresponding fees at the Barangay Hall.</p>
              
              <p className="font-bold text-gray-900">5. Claiming Policy</p>
              <p>I agree to present a valid government-issued ID upon claiming the document. Documents not claimed within 30 days will be disposed of.</p>
            </div>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setShowTerms(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAcceptTerms}>
                I Accept & Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <Card className="shadow-lg max-w-3xl mx-auto">
      <CardHeader className={`bg-gradient-to-r ${currentCategory === 'document' ? 'from-blue-600 to-blue-700' : 'from-orange-600 to-red-600'} text-white flex flex-row items-center justify-between`}>
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            {currentCategory === 'document' ? <FileText className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            {currentCategory === 'document' ? 'Document Request Form' : 'Issue Report Form'}
          </CardTitle>
          <CardDescription className={currentCategory === 'document' ? 'text-blue-100' : 'text-orange-100'}>
            Currently {currentCategory === 'document' ? 'requesting' : 'reporting'}: <span className="font-bold text-white underline">{SERVICE_TYPES.find(d => d.id === formData.documentType)?.name}</span>
          </CardDescription>
        </div>
        <Button 
          variant="ghost" 
          className="text-white hover:bg-white/20" 
          onClick={() => setStep('selection')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Change
        </Button>
      </CardHeader>
      <CardContent className="pt-8 px-6 md:px-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <CheckCircle2 className={`h-5 w-5 ${currentCategory === 'document' ? 'text-blue-600' : 'text-orange-600'}`} />
              <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Last Name, First Name, Middle Initial"
                  value={formData.fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('fullName', e.target.value)}
                  disabled={isSubmitting}
                  required
                  className={`border-gray-300 ${currentCategory === 'document' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'} h-11`}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="09XX-XXX-XXXX"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                    disabled={isSubmitting}
                    required
                    className={`border-gray-300 ${currentCategory === 'document' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'} h-11`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700 font-medium">
                    {currentCategory === 'document' ? 'Address in Barangay Irisan *' : 'Your Address (Optional)'}
                  </Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Purok / Street / House No."
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('address', e.target.value)}
                    disabled={isSubmitting}
                    required={currentCategory === 'document'}
                    className={`border-gray-300 ${currentCategory === 'document' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'} h-11`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              {currentCategory === 'document' ? <FileText className="h-5 w-5 text-blue-600" /> : <AlertTriangle className="h-5 w-5 text-orange-600" />}
              <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">
                {currentCategory === 'document' ? 'Request Details' : 'Issue Details'}
              </h3>
            </div>

            {currentCategory === 'report' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-700 font-medium">Location of Issue *</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Specific location or landmark"
                    value={formData.location}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('location', e.target.value)}
                    disabled={isSubmitting}
                    required
                    className="border-gray-300 focus:ring-orange-500 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-gray-700 font-medium">Priority Level *</Label>
                  <Select value={formData.priority} onValueChange={(v) => handleInputChange('priority', v)}>
                    <SelectTrigger className="h-11 border-gray-300 focus:ring-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Minor concern</SelectItem>
                      <SelectItem value="medium">Medium - Needs attention</SelectItem>
                      <SelectItem value="high">High - Urgent / Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="purpose" className="text-gray-700 font-medium">
                {currentCategory === 'document' ? 'Purpose of Request *' : 'Description of Issue *'}
              </Label>
              <Input
                id="purpose"
                type="text"
                placeholder={currentCategory === 'document' ? 'e.g., Job Application, Scholarship' : 'Short summary of the issue'}
                value={formData.purpose}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('purpose', e.target.value)}
                disabled={isSubmitting}
                required
                className={`border-gray-300 ${currentCategory === 'document' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'} h-11`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-gray-700 font-medium">
                {currentCategory === 'document' ? 'Additional Information (Optional)' : 'Detailed Context / Information'}
              </Label>
              <Textarea
                id="additionalInfo"
                placeholder={currentCategory === 'document' ? 'Any special requests...' : 'Provide more details about what is happening...'}
                value={formData.additionalInfo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('additionalInfo', e.target.value)}
                disabled={isSubmitting}
                rows={4}
                className={`border-gray-300 ${currentCategory === 'document' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`}
              />
            </div>
          </div>

          {/* ID Verification Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-2">
              <ImageIcon className={`h-5 w-5 ${currentCategory === 'document' ? 'text-blue-600' : 'text-orange-600'}`} />
              <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">ID Verification *</h3>
            </div>
            
            <div className={`bg-${currentCategory === 'document' ? 'blue' : 'orange'}-50/50 p-6 rounded-xl border-2 border-dashed border-${currentCategory === 'document' ? 'blue' : 'orange'}-200`}>
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
                    <div className={`p-4 bg-${currentCategory === 'document' ? 'blue' : 'orange'}-100 rounded-full`}>
                      <Upload className={`h-10 w-10 ${currentCategory === 'document' ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <p className={`text-${currentCategory === 'document' ? 'blue' : 'orange'}-900 font-bold`}>Upload a Valid ID</p>
                      <p className={`text-sm text-${currentCategory === 'document' ? 'blue' : 'orange'}-700`}>Required to prevent troll requests. PNG, JPG up to 5MB.</p>
                    </div>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      id="id-upload" 
                      onChange={handleFileChange}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      className={`border-${currentCategory === 'document' ? 'blue' : 'orange'}-300 hover:bg-${currentCategory === 'document' ? 'blue' : 'orange'}-100`}
                      onClick={() => document.getElementById('id-upload')?.click()}
                    >
                      Select Image
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Important Warning */}
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
            <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Confirmation:
            </h4>
            <p className="text-sm text-amber-800 font-medium">
              By clicking submit, you confirm that all information provided is accurate and that you are a resident of Barangay Irisan.
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className={`w-full ${currentCategory === 'document' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'} text-white font-bold text-xl py-8 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]`}
            disabled={isSubmitting}
          >
            <Send className="mr-3 h-6 w-6" />
            {isSubmitting ? 'SUBMITTING...' : currentCategory === 'document' ? 'SUBMIT DOCUMENT REQUEST' : 'SUBMIT ISSUE REPORT'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
