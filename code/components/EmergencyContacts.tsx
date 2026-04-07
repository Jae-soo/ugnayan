'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, AlertCircle, Hospital, Shield, Flame, Droplet, Users, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface EmergencyContact {
  name: string
  number: string
  description: string
  icon: React.JSX.Element
  color: string
  available: string
}

export default function EmergencyContacts({ onBack }: { onBack?: () => void }): React.JSX.Element {
  const emergencyContacts: EmergencyContact[] = [
    {
      name: 'National Emergency Hotline',
      number: '911',
      description: 'For life-threatening emergencies, fires, and immediate police assistance',
      icon: <AlertCircle className="h-6 w-6" />,
      color: 'red',
      available: '24/7'
    },
    {
      name: 'Barangay Irisan Office',
      number: '(074) 123-4567',
      description: 'Purok 18, Barangay Irisan, Baguio City',
      icon: <Users className="h-6 w-6" />,
      color: 'green',
      available: '8AM-5PM Mon-Fri'
    },
    {
      name: 'Barangay Emergency Response',
      number: '(074) 123-4567',
      description: 'Barangay Irisan emergency response team',
      icon: <Phone className="h-6 w-6" />,
      color: 'green',
      available: '24/7'
    },
    {
      name: 'Barangay Captain',
      number: '(074) 123-4568',
      description: 'Direct line to Barangay Captain for urgent community matters',
      icon: <Users className="h-6 w-6" />,
      color: 'blue',
      available: 'Office Hours'
    },
    {
      name: 'Baguio General Hospital',
      number: '(074) 442-4216',
      description: 'Medical emergencies and ambulance services',
      icon: <Hospital className="h-6 w-6" />,
      color: 'blue',
      available: '24/7'
    },
    {
      name: 'PNP Baguio City',
      number: '(074) 442-4433',
      description: 'Police assistance, crime reporting, and security concerns',
      icon: <Shield className="h-6 w-6" />,
      color: 'blue',
      available: '24/7'
    },
    {
      name: 'Bureau of Fire Protection',
      number: '(074) 442-6019',
      description: 'Fire emergencies and fire safety assistance',
      icon: <Flame className="h-6 w-6" />,
      color: 'orange',
      available: '24/7'
    },
    {
      name: 'Barangay Health Center',
      number: '(074) 123-4570',
      description: 'Non-emergency medical consultation and health services',
      icon: <Hospital className="h-6 w-6" />,
      color: 'green',
      available: '8AM-5PM Mon-Fri'
    },
    {
      name: 'PAGASA Weather Bureau',
      number: '(074) 442-3276',
      description: 'Weather updates, typhoon warnings, and disaster alerts',
      icon: <Droplet className="h-6 w-6" />,
      color: 'blue',
      available: '24/7'
    }
  ]

  const handleCall = (number: string): void => {
    window.open(`tel:${number}`)
  }

  const getColorClass = (color: string): string => {
    switch (color) {
      case 'red': return 'bg-red-100 text-red-800 border-red-500'
      case 'green': return 'bg-green-100 text-green-800 border-green-500'
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-500'
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-500'
      default: return 'bg-gray-100 text-gray-800 border-gray-500'
    }
  }

  const getButtonClass = (color: string): string => {
    switch (color) {
      case 'red': return 'bg-red-600 hover:bg-red-700'
      case 'green': return 'bg-green-600 hover:bg-green-700'
      case 'blue': return 'bg-blue-600 hover:bg-blue-700'
      case 'orange': return 'bg-orange-600 hover:bg-orange-700'
      default: return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      )}
      <Card className="shadow-lg border-l-4 border-l-red-500">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Phone className="h-6 w-6" />
            Emergency Contacts & Hotlines
          </CardTitle>
          <CardDescription className="text-red-100">
            Quick access to emergency services and important contact numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 text-lg mb-1">
                  🚨 In case of life-threatening emergency:
                </h3>
                <p className="text-red-800 mb-2">Call <strong>911</strong> immediately for:</p>
                <ul className="list-disc list-inside text-red-800 space-y-1 text-sm">
                  <li>Medical emergencies (heart attack, stroke, severe injury)</li>
                  <li>Fire or explosion</li>
                  <li>Crime in progress or immediate danger</li>
                  <li>Major accidents</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact: EmergencyContact, index: number) => (
              <Card
                key={index}
                className={`border-l-4 ${getColorClass(contact.color)} hover:shadow-lg transition-all`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {contact.icon}
                      <CardTitle className="text-lg">{contact.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {contact.available}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{contact.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{contact.number}</span>
                    <Button
                      size="sm"
                      className={getButtonClass(contact.color)}
                      onClick={() => handleCall(contact.number)}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Emergency Preparedness Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-blue-900">🌊 Flood Safety:</h4>
              <ul className="space-y-1 text-gray-700 list-disc list-inside">
                <li>Move to higher ground immediately</li>
                <li>Never walk or drive through floodwater</li>
                <li>Keep emergency supplies ready</li>
                <li>Monitor weather updates regularly</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-orange-900">⛰️ Landslide Safety:</h4>
              <ul className="space-y-1 text-gray-700 list-disc list-inside">
                <li>Evacuate if you hear unusual sounds</li>
                <li>Move away from the slide path</li>
                <li>Alert neighbors and barangay officials</li>
                <li>Do not return until declared safe</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-red-900">🔥 Fire Safety:</h4>
              <ul className="space-y-1 text-gray-700 list-disc list-inside">
                <li>Keep fire extinguisher accessible</li>
                <li>Have an evacuation plan</li>
                <li>Never use water on electrical fires</li>
                <li>Check smoke detectors regularly</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-green-900">🏥 Medical Emergency:</h4>
              <ul className="space-y-1 text-gray-700 list-disc list-inside">
                <li>Stay calm and assess the situation</li>
                <li>Call emergency services immediately</li>
                <li>Provide clear location information</li>
                <li>Do not move severely injured persons</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
