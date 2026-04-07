'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Users, ArrowRight } from 'lucide-react'

interface WelcomePageProps {
  onResidentContinue: () => void
}

export default function WelcomePage({ onResidentContinue }: WelcomePageProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <Shield className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-3">Ugnayan</h1>
          <p className="text-xl text-gray-600">Barangay Irisan Service Portal</p>
          <p className="text-gray-500 mt-2">Baguio City, Benguet</p>
        </div>

        {/* Welcome Message */}
        <Card className="mb-6 border-2 border-green-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome to Our Community Portal</CardTitle>
            <CardDescription className="text-center text-base">
              Your digital gateway to barangay services, announcements, and community assistance
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Options */}
        <div className="grid md:grid-cols-1 gap-6">
          {/* Resident Access */}
          <Card className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 border-blue-200 bg-white">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Users className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">I’m a Resident</CardTitle>
              <CardDescription className="text-base">
                Login to access barangay services and track your requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Request documents and certificates online</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>File official reports and community complaints</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Stay updated with real-time announcements</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Access your personal dashboard and history</span>
                </li>
              </ul>
              <Button 
                onClick={onResidentContinue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
              >
                Go to Login
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-xs text-center text-gray-500 pt-2">
                Secure access • Official Barangay Irisan Portal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <Card className="bg-white/50 backdrop-blur border-gray-200">
            <CardContent className="py-4">
              <p className="text-sm text-gray-600">
                <strong>Office Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Contact:</strong> (074) 123-4567 • irisan.baguio@gmail.com
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
