'use client'

import dynamic from 'next/dynamic'

// Dynamically import CommunityMap to avoid SSR issues with Leaflet
const CommunityMap = dynamic(() => import('./CommunityMap'), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-green-700 mb-4">📍 Community Map</h2>
        <p className="text-gray-600 mb-4">
          Explore transportation hubs, hazard zones, and local businesses in Barangay Irisan.
        </p>
        <div className="h-[600px] rounded-lg overflow-hidden border-2 border-green-200 mb-6 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      </div>
    </div>
  ),
})

export default function CommunityMapWrapper({ onBack }: { onBack?: () => void }): React.JSX.Element {
  return <CommunityMap onBack={onBack} />
}
