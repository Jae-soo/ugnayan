'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Search, X, Loader2, MapPin, Navigation, ArrowLeft, RotateCcw, ShieldCheck, Store } from 'lucide-react'
import { renderToString } from 'react-dom/server'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { safeSetItem } from '@/lib/storage'

// Fix for default marker icons in React-Leaflet
type LeafletIconPrototype = {
  _getIconUrl?: () => string
}

delete (L.Icon.Default.prototype as LeafletIconPrototype)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Location {
  id: number
  name: string
  lat: number
  lng: number
  type: 'transportation' | 'streetlight' | 'hazard' | 'business' | 'tourist' | 'evacuation' | 'church' | 'school' | 'office' | 'gas_station' | 'barangay_hall'
  description: string
  address: string
  status?: string
}

const getMarkerIcon = (type: string, name?: string): L.Icon | L.DivIcon => {
  if (type === 'barangay_hall') {
    return L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [45, 75], // Even larger for maximum emphasis
      iconAnchor: [22, 75],
      popupAnchor: [1, -34],
      shadowSize: [55, 55],
      className: 'barangay-hall-marker' // Custom class for potential CSS styling
    })
  }

  if (type === 'business') {
    const html = renderToString(
      <div className="business-marker-container">
        <div className="business-marker-icon">
          <Store size={18} />
        </div>
        <div className="business-marker-label">{name}</div>
      </div>
    )
    return L.divIcon({
      html: html,
      className: 'custom-business-icon', 
      iconSize: [30, 30], // Match the blue circle size
      iconAnchor: [15, 15] // Center the icon
    })
  }

  const iconColors: { [key: string]: string } = {
    transportation: 'blue',
    streetlight: 'yellow',
    hazard: 'red',
    tourist: 'orange',
    evacuation: 'violet',
    church: 'gold',
    school: 'black',
    office: 'red',
    gas_station: 'blue',
  }

  const color = iconColors[type] || 'gray'
  
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

const initialLocations: Location[] = [
  {
    id: 1,
    name: 'Irisan Barangay Hall',
    lat: 16.4170,
    lng: 120.5650,
    type: 'barangay_hall',
    description: 'Main administrative office for Barangay Irisan.',
    address: 'Naguilian Road, Irisan, Baguio City',
    status: 'Open'
  },
  {
    id: 13,
    name: 'Tamayo Lucaden Optical Clinic',
    lat: 16.4210,
    lng: 120.5590,
    type: 'business',
    description: 'Optical services and supplies.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 16,
    name: '7-Eleven Irisan',
    lat: 16.4230,
    lng: 120.5570,
    type: 'business',
    description: '24/7 convenience store.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 100,
    name: 'Jaechi Sari-Sari Store',
    lat: 16.4195,
    lng: 120.5565,
    type: 'business',
    description: 'Local sari-sari store serving residents.',
    address: 'Upper Irisan, Baguio City'
  },
  {
    id: 101,
    name: 'Irisan Rice Dealer',
    lat: 16.4215,
    lng: 120.5585,
    type: 'business',
    description: 'Provider of rice supplies.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 102,
    name: 'Irisan Bakery',
    lat: 16.4205,
    lng: 120.5575,
    type: 'business',
    description: 'Freshly baked local breads.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 2,
    name: 'Irisan National High School',
    lat: 16.4290,
    lng: 120.5470,
    type: 'school',
    description: 'Public secondary school serving Irisan residents.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 3,
    name: 'Baguio City National Science High School',
    lat: 16.4250,
    lng: 120.5500,
    type: 'school',
    description: 'Science-focused public high school.',
    address: 'PSHS Road, Irisan, Baguio City'
  },
  {
    id: 4,
    name: 'Philippine Science High School - CAR',
    lat: 16.4240,
    lng: 120.5520,
    type: 'school',
    description: 'Premier science high school in the Cordillera region.',
    address: 'Irisan, Baguio City'
  },
  {
    id: 5,
    name: 'Irisan Elementary School',
    lat: 16.4200,
    lng: 120.5580,
    type: 'school',
    description: 'Primary public education facility.',
    address: 'San Crispin, Irisan, Baguio City'
  },
  {
    id: 6,
    name: 'Elpidio R. Quirino Elementary School',
    lat: 16.4270,
    lng: 120.5450,
    type: 'school',
    description: 'Public elementary school.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 7,
    name: 'Iglesia Ni Cristo Lokal ng Irisan',
    lat: 16.4180,
    lng: 120.5550,
    type: 'church',
    description: 'Religious worship center.',
    address: 'Tengdow Road, Irisan, Baguio City'
  },
  {
    id: 8,
    name: 'St. Joseph Parish - Irisan',
    lat: 16.4220,
    lng: 120.5600,
    type: 'church',
    description: 'Catholic parish church.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 9,
    name: 'Kingdom Hall of Jehovah’s Witnesses',
    lat: 16.4300,
    lng: 120.5450,
    type: 'church',
    description: 'Religious worship center.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 10,
    name: 'Petron Irisan',
    lat: 16.4250,
    lng: 120.5550,
    type: 'gas_station',
    description: 'Fuel and automotive services.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 11,
    name: 'Shell Irisan',
    lat: 16.4260,
    lng: 120.5530,
    type: 'gas_station',
    description: 'Fuel and convenience store.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 12,
    name: 'Phoenix Irisan',
    lat: 16.4280,
    lng: 120.5500,
    type: 'gas_station',
    description: 'Fuel services.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 14,
    name: 'Irisan Police Station (PCP 9)',
    lat: 16.4310,
    lng: 120.5480,
    type: 'office',
    description: 'Local police precinct.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 15,
    name: 'Irisan Health Center',
    lat: 16.4180,
    lng: 120.5630,
    type: 'office',
    description: 'Barangay health clinic.',
    address: 'Naguilian Road, Irisan, Baguio City'
  },
  {
    id: 17,
    name: 'Dragon Treasure Castle',
    lat: 16.4120,
    lng: 120.5580,
    type: 'tourist',
    description: 'Medieval-inspired castle with panoramic views.',
    address: 'Jade Street, Irisville Subdivision, Upper Irisan, Baguio City'
  }
]

export default function CommunityMap({ onBack }: { onBack?: () => void }): React.JSX.Element {
  const [addMode, setAddMode] = useState(false)
  const [mapType, setMapType] = useState<'classic' | 'satellite'>('satellite')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newMarkerInfo, setNewMarkerInfo] = useState({ lat: 0, lng: 0, name: '', description: '', address: '', type: 'business' as Location['type'] })
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<{lat: number, lng: number, name: string} | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  // Controller to programmatically move the map
  const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap()
    useEffect(() => {
      if (center) {
        map.flyTo(center, zoom, { duration: 1.5 })
      }
    }, [center, zoom, map])
    return null
  }

  // Handle external search via Nominatim API (OpenStreetMap)
  const searchExternalPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      // Append "Irisan, Baguio City" to limit results to the area
      const fullQuery = `${query}, Irisan, Baguio City`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=5&addressdetails=1`
      )
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce search for suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchExternalPlaces(searchQuery)
      } else {
        setSuggestions([])
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, searchExternalPlaces])

  const handleSelectSuggestion = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    const name = suggestion.display_name.split(',')[0]
    
    setSelectedResult({ lat, lng, name })
    setSearchQuery(name)
    setSuggestions([])
  }

  // Load locations from localStorage on mount
  useEffect(() => {
    const savedLocations = localStorage.getItem('community_map_locations')
    if (savedLocations) {
      try {
        setLocations(JSON.parse(savedLocations))
      } catch (error) {
        console.error('Failed to parse saved locations:', error)
      }
    }
  }, [])

  // Save locations to localStorage whenever they change
  useEffect(() => {
    if (locations.length > 0 || localStorage.getItem('community_map_locations')) {
      safeSetItem('community_map_locations', JSON.stringify(locations))
    }
  }, [locations])

  const [filter, setFilter] = useState<string | null>(null)
  const isOfficial = typeof window !== 'undefined' && !!localStorage.getItem('official')

  const filteredLocations = locations.filter(loc => {
    const matchesFilter = filter ? loc.type === filter : true;
    const matchesSearch = searchQuery 
      ? loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesFilter && matchesSearch;
  });

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        if (addMode) {
          setNewMarkerInfo({ ...newMarkerInfo, lat: e.latlng.lat, lng: e.latlng.lng })
          setShowAddDialog(true)
          setAddMode(false) // Exit add mode after click
        }
      },
    })
    return null
  }

  const handleSaveLocation = () => {
    const newLocation: Location = {
      id: Date.now(), // Use unique timestamp instead of index
      lat: newMarkerInfo.lat,
      lng: newMarkerInfo.lng,
      name: newMarkerInfo.name,
      description: newMarkerInfo.description,
      address: newMarkerInfo.address,
      type: newMarkerInfo.type,
    }
    setLocations([...locations, newLocation])
    setShowAddDialog(false)
  }

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  const getDirections = async (lat: number, lng: number) => {
    if (!userLocation) {
      toast.error('Unable to get your current location for navigation.')
      return
    }

    setIsNavigating(true)
    try {
      // Use OSRM (Open Source Routing Machine) API for in-app routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${lng},${lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()

      if (data.code === 'Ok' && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])
        setRouteCoordinates(coordinates as [number, number][])
        
        // Fit map to show the entire route
        if (mapRef.current) {
          const bounds = L.latLngBounds(coordinates as [number, number][])
          mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
        
        toast.success('Showing directions within the app.')
      } else {
        throw new Error('No route found')
      }
    } catch (error) {
      console.error('Routing failed:', error)
      toast.error('Failed to get directions within the app. Falling back to Google Maps.')
      
      // Fallback to Google Maps if internal routing fails
      const origin = `${userLocation[0]},${userLocation[1]}`
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&origin=${origin}`
      window.open(url, '_blank')
    } finally {
      setIsNavigating(false)
    }
  }

  const clearRoute = () => {
    setRouteCoordinates(null)
    if (mapRef.current) {
      mapRef.current.setView(center, 15)
    }
  }

  const handleDeleteLocation = (id: number) => {
    setLocations(locations.filter((location) => location.id !== id))
  }

  // Center of Barangay Irisan, Baguio City
  const center: [number, number] = [16.417, 120.565]
  
  // Approximate bounds for Barangay Irisan
  const maxBounds: L.LatLngBoundsExpression = [
    [16.400, 120.540], // South-West
    [16.435, 120.590]  // North-East
  ]

  // Define mask polygon (World - Irisan) to hide surrounding areas
  const outerBounds = [
    [90, -180],
    [90, 180],
    [-90, 180],
    [-90, -180],
  ] as [number, number][]

  const innerBounds = [
    [16.435, 120.540], // Top-Left
    [16.435, 120.590], // Top-Right
    [16.400, 120.590], // Bottom-Right
    [16.400, 120.540], // Bottom-Left
  ] as [number, number][]

  // Leaflet treats the first array as the outer shape and subsequent arrays as holes
  const maskPositions = [outerBounds, innerBounds]
  const maskOptions = { color: 'transparent', fillColor: '#333', fillOpacity: 0.7 }

  const [isMounted, setIsMounted] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    setIsMounted(true)
    return () => {
      setIsMounted(false)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      )}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-green-700">📍 Community Map</h2>
            <p className="text-gray-600">
              An interactive map of Barangay Irisan. Click the button to add a new location.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search places..." 
                className="pl-9 pr-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedResult(null)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
              
              {/* Search Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-b-md shadow-lg z-[2000] mt-1 overflow-hidden">
                  {suggestions.map((s, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                      onClick={() => handleSelectSuggestion(s)}
                    >
                      <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{s.display_name.split(',')[0]}</p>
                        <p className="text-[10px] text-gray-500 truncate">{s.display_name.split(',').slice(1).join(',')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {routeCoordinates && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearRoute}
                className="text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                Clear Route
              </Button>
            )}
            <div className="flex gap-2">
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <Button 
                  variant={mapType === 'classic' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setMapType('classic')}
                  className="text-xs h-8"
                >
                  Classic
                </Button>
                <Button 
                  variant={mapType === 'satellite' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setMapType('satellite')}
                  className="text-xs h-8"
                >
                  Satellite
                </Button>
              </div>
              <Button onClick={() => setAddMode(true)} disabled={addMode || !isOfficial}>
                {addMode ? 'Click on the map to add a location' : 'Add New Location'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Map */}
        <div className={`h-[600px] rounded-lg overflow-hidden border-2 border-green-200 mb-6 ${addMode ? 'cursor-crosshair' : ''}`}>
          {isMounted && (
            <MapContainer
              key="community-map"
              center={center}
              zoom={15}
              minZoom={14}
              maxBounds={maxBounds}
              maxBoundsViscosity={1.0}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              {selectedResult && (
                <MapController 
                  center={[selectedResult.lat, selectedResult.lng]} 
                  zoom={18} 
                />
              )}
              <TileLayer
                url={mapType === 'satellite' ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"}
                attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              />
              <MapEvents />
              <Polygon positions={maskPositions} pathOptions={maskOptions} />

              {/* In-App Route Polyline */}
              {routeCoordinates && (
                <Polyline 
                  positions={routeCoordinates} 
                  pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.8, lineJoin: 'round' }} 
                />
              )}
              
              {/* Selected Search Result Marker (Google Maps Style) */}
              {selectedResult && (
                <Marker 
                  position={[selectedResult.lat, selectedResult.lng]}
                  icon={L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                  })}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold">{selectedResult.name}</h3>
                      <p className="text-xs text-gray-500">Search Result</p>
                      <Button 
                        onClick={() => {
                          setNewMarkerInfo({
                            ...newMarkerInfo,
                            lat: selectedResult.lat,
                            lng: selectedResult.lng,
                            name: selectedResult.name,
                            type: 'business'
                          })
                          setShowAddDialog(true)
                        }}
                        size="sm" 
                        className="mt-2 w-full"
                      >
                        Add to Community Map
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* User's Current Location Marker */}
              {userLocation && (
                <Marker 
                  position={userLocation}
                  icon={L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                  })}
                >
                  <Popup>Your Current Location</Popup>
                </Marker>
              )}

              {filteredLocations.map((location) => (
                <Marker
                  key={location.id}
                  position={[location.lat, location.lng]}
                  icon={getMarkerIcon(location.type, location.name)}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-sm">{location.name}</h3>
                      <p className="text-xs text-gray-600">{location.description}</p>
                      <p className="text-xs text-gray-600">{location.address}</p>
                      {location.status && (
                        <p className="text-xs font-semibold mt-1 text-green-600">
                          Status: {location.status}
                        </p>
                      )}
                      <div className="flex flex-col gap-2 mt-3">
                        <Button 
                          onClick={() => getDirections(location.lat, location.lng)} 
                          size="sm" 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Navigation className="h-3 w-3 mr-2" />
                          Get Directions
                        </Button>
                        {isOfficial && (
                          <Button 
                            onClick={() => handleDeleteLocation(location.id)} 
                            size="sm" 
                            variant="destructive" 
                            className="w-full"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-700">Map Legend:</h3>
            {filter && (
              <Button onClick={() => setFilter(null)} size="sm" variant="outline">Clear Filter</Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
            <div 
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border-2 transition-all ${
                filter === 'barangay_hall' 
                  ? 'bg-green-600 border-green-700 text-white shadow-md scale-105' 
                  : 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
              }`} 
              onClick={() => setFilter('barangay_hall')}
            >
              <ShieldCheck className={`h-5 w-5 ${filter === 'barangay_hall' ? 'text-white' : 'text-green-600'}`} />
              <span className="font-bold whitespace-nowrap">Barangay Hall</span>
            </div>
            <div className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${filter === 'office' ? 'bg-red-100' : ''}`} onClick={() => setFilter('office')}>
              <div className="w-4 h-4 bg-red-600 rounded-full"></div>
              <span>Other Offices</span>
            </div>
            <div className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${filter === 'transportation' ? 'bg-blue-100' : ''}`} onClick={() => setFilter('transportation')}>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Transportation</span>
            </div>
            <div className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${filter === 'streetlight' ? 'bg-yellow-100' : ''}`} onClick={() => setFilter('streetlight')}>
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Streetlights</span>
            </div>
            <div className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${filter === 'hazard' ? 'bg-red-100' : ''}`} onClick={() => setFilter('hazard')}>
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Hazard Zones</span>
            </div>
            <div 
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border-2 transition-all ${
                filter === 'business' 
                  ? 'bg-blue-600 border-blue-700 text-white shadow-md scale-105' 
                  : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
              }`} 
              onClick={() => setFilter('business')}
            >
              <Store className={`h-5 w-5 ${filter === 'business' ? 'text-white' : 'text-blue-600'}`} />
              <span className="font-bold whitespace-nowrap">Businesses</span>
            </div>
            <div className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${filter === 'tourist' ? 'bg-orange-100' : ''}`} onClick={() => setFilter('tourist')}>
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span>Tourist Spots</span>
            </div>
            <div className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${filter === 'evacuation' ? 'bg-purple-100' : ''}`} onClick={() => setFilter('evacuation')}>
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <span>Evacuation Centers</span>
            </div>
            <div className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${filter === 'church' ? 'bg-yellow-100' : ''}`} onClick={() => setFilter('church')}>
              <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
              <span>Churches</span>
            </div>
            <div className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${filter === 'school' ? 'bg-gray-200' : ''}`} onClick={() => setFilter('school')}>
              <div className="w-4 h-4 bg-black rounded-full"></div>
              <span>Schools</span>
            </div>
            <div className={`flex items-center gap-2 cursor-pointer p-1 rounded-md ${filter === 'gas_station' ? 'bg-blue-100' : ''}`} onClick={() => setFilter('gas_station')}>
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span>Gas Stations</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a New Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newMarkerInfo.name} onChange={(e) => setNewMarkerInfo({ ...newMarkerInfo, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input id="description" value={newMarkerInfo.description} onChange={(e) => setNewMarkerInfo({ ...newMarkerInfo, description: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input id="address" value={newMarkerInfo.address} onChange={(e) => setNewMarkerInfo({ ...newMarkerInfo, address: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <Select value={newMarkerInfo.type} onValueChange={(value) => setNewMarkerInfo({ ...newMarkerInfo, type: value as Location['type'] })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent className="z-[12000]">
                  <SelectItem value="office">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <span>Barangay Office</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="transportation">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Transportation</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="streetlight">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Streetlight</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hazard">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Hazard Zone</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="business">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Business</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="tourist">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>Tourist Spot</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="evacuation">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Evacuation Center</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="church">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span>Church</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="school">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-black rounded-full"></div>
                      <span>School</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gas_station">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span>Gas Station</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveLocation}>Save Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Barangay Hall List */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-600">
          <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
            🏢 Barangay Hall
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'barangay_hall').map((location) => (
              <li key={location.id} className="border-l-4 border-green-600 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600 italic">{location.address}</p>
                {location.status && (
                  <p className="text-xs font-semibold mt-1 text-green-600">
                    Status: {location.status}
                  </p>
                )}
                <Button 
                  onClick={() => getDirections(location.lat, location.lng)} 
                  size="sm" 
                  className="mt-2 w-full bg-green-600 hover:bg-green-700 h-8 text-xs"
                >
                  <Navigation className="h-3 w-3 mr-2" />
                  Navigate Here
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Other Offices List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
            🏛️ Other Offices
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'office').map((location) => (
              <li key={location.id} className="border-l-4 border-red-700 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600 italic">{location.address}</p>
                {location.status && (
                  <p className="text-xs font-semibold mt-1 text-green-600">
                    Status: {location.status}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Business Establishments List */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
          <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
            🏪 Local Businesses
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'business').map((location) => (
              <li key={location.id} className="border-l-4 border-blue-600 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600 italic">{location.address}</p>
                <Button 
                  onClick={() => getDirections(location.lat, location.lng)} 
                  size="sm" 
                  className="mt-2 w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                >
                  <Navigation className="h-3 w-3 mr-2" />
                  Navigate Here
                </Button>
              </li>
            ))}
          </ul>
        </div>

        {/* Transportation List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
            🚌 Transportation Hubs
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'transportation').map((location) => (
              <li key={location.id} className="border-l-4 border-blue-500 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600">{location.address}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Streetlights List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-yellow-600 mb-4 flex items-center gap-2">
            💡 Streetlight Locations
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'streetlight').map((location) => (
              <li key={location.id} className="border-l-4 border-yellow-500 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600">{location.address}</p>
                <p className={`text-xs font-semibold mt-1 ${location.status === 'Functional' ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {location.status}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Hazard Zones List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
            ⚠️ Hazard Zones
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'hazard').map((location) => (
              <li key={location.id} className="border-l-4 border-red-500 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600">{location.address}</p>
                <p className="text-xs font-semibold text-red-600 mt-1">
                  Risk Level: {location.status}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Businesses List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
            🏪 Local Businesses
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'business').map((location) => (
              <li key={location.id} className="border-l-4 border-green-500 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600">{location.address}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Tourist Spots List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
            📸 Tourist Spots
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'tourist').map((location) => (
              <li key={location.id} className="border-l-4 border-orange-500 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600">{location.address}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Evacuation Centers List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-purple-600 mb-4 flex items-center gap-2">
            🏥 Evacuation Centers
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'evacuation').map((location) => (
              <li key={location.id} className="border-l-4 border-purple-500 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600">{location.address}</p>
                <p className="text-xs font-semibold text-green-600 mt-1">
                  Status: {location.status}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Churches List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
            ⛪ Churches
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'church').map((location) => (
              <li key={location.id} className="border-l-4 border-yellow-600 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600">{location.address}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Schools List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
            🏫 Schools
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'school').map((location) => (
              <li key={location.id} className="border-l-4 border-black pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600">{location.address}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Gas Stations List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
            ⛽ Gas Stations
          </h3>
          <ul className="space-y-3">
            {filteredLocations.filter(loc => loc.type === 'gas_station').map((location) => (
              <li key={location.id} className="border-l-4 border-blue-600 pl-3 py-2">
                <h4 className="font-semibold text-gray-800">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.description}</p>
                <p className="text-sm text-gray-600">{location.address}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

