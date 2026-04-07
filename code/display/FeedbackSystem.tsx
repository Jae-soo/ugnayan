'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { MessageSquare, Star, ThumbsUp, Send } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { safeSetItem } from '@/lib/storage'

interface Feedback {
  id: string
  name: string
  email: string
  category: string
  rating: number
  message: string
  submittedAt: string
}

export default function FeedbackSystem(): React.JSX.Element {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    rating: 0,
    message: ''
  })

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    // Load existing feedback from localStorage
    const storedFeedback = localStorage.getItem('feedback')
    if (storedFeedback) {
      setFeedbackList(JSON.parse(storedFeedback) as Feedback[])
    }
  }, [])

  const handleInputChange = (field: string, value: string | number): void => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate form
    if (!formData.name || !formData.email || !formData.category || !formData.rating || !formData.message) {
      toast.error('Please fill in all fields and provide a rating')
      setIsSubmitting(false)
      return
    }

    // Create feedback object
    const newFeedback: Feedback = {
      id: `FB-${Date.now().toString().slice(-8)}`,
      ...formData,
      submittedAt: new Date().toISOString()
    }

    // Save to localStorage
    const updatedFeedback = [...feedbackList, newFeedback]
    safeSetItem('feedback', JSON.stringify(updatedFeedback))
    setFeedbackList(updatedFeedback)

    toast.success('Thank you for your feedback!', {
      description: 'Your input helps us improve our services.'
    })

    // Reset form
    setFormData({
      name: '',
      email: '',
      category: '',
      rating: 0,
      message: ''
    })
    setIsSubmitting(false)
  }

  const renderStarRating = (currentRating: number): React.JSX.Element => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star: number) => (
          <button
            key={star}
            type="button"
            onClick={() => handleInputChange('rating', star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= currentRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const calculateAverageRating = (): number => {
    if (feedbackList.length === 0) return 0
    const sum = feedbackList.reduce((acc: number, fb: Feedback) => acc + fb.rating, 0)
    return sum / feedbackList.length
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="space-y-6">
      {/* Feedback Form */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6" />
            Community Feedback & Reviews
          </CardTitle>
          <CardDescription className="text-pink-100">
            Help us improve our services by sharing your experience and suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feedbackName">Your Name *</Label>
                <Input
                  id="feedbackName"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedbackEmail">Email Address *</Label>
                <Input
                  id="feedbackEmail"
                  type="email"
                  placeholder="juan@example.com"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedbackCategory">Feedback Category *</Label>
              <Select value={formData.category} onValueChange={(value: string) => handleInputChange('category', value)}>
                <SelectTrigger id="feedbackCategory">
                  <SelectValue placeholder="What is your feedback about?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service-quality">Service Quality</SelectItem>
                  <SelectItem value="staff-behavior">Staff Behavior</SelectItem>
                  <SelectItem value="response-time">Response Time</SelectItem>
                  <SelectItem value="website-usability">Website Usability</SelectItem>
                  <SelectItem value="facility">Barangay Facilities</SelectItem>
                  <SelectItem value="suggestion">Suggestion for Improvement</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="compliment">Compliment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rate Your Experience *</Label>
              <div className="flex items-center gap-4">
                {renderStarRating(formData.rating)}
                {formData.rating > 0 && (
                  <span className="text-sm font-medium text-gray-600">
                    {formData.rating} out of 5 stars
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedbackMessage">Your Message *</Label>
              <Textarea
                id="feedbackMessage"
                placeholder="Please share your thoughts, experiences, or suggestions..."
                value={formData.message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('message', e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800">
                <strong>💡 Your feedback matters!</strong> All submissions are reviewed by the barangay team. 
                We use your input to improve our services and address community concerns.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
              disabled={isSubmitting}
            >
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">
              {calculateAverageRating().toFixed(1)}
            </p>
            <p className="text-sm text-gray-600">out of 5 stars</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{feedbackList.length}</p>
            <p className="text-sm text-gray-600">submissions received</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              Positive Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {feedbackList.filter((fb: Feedback) => fb.rating >= 4).length}
            </p>
            <p className="text-sm text-gray-600">4-5 star ratings</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      {feedbackList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Community Feedback</CardTitle>
            <CardDescription>See what other residents are saying</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbackList.slice(-5).reverse().map((feedback: Feedback) => (
                <div key={feedback.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{feedback.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{feedback.category.replace('-', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_: undefined, i: number) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < feedback.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{feedback.message}</p>
                  <Separator className="my-2" />
                  <p className="text-xs text-gray-500">{formatDate(feedback.submittedAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
