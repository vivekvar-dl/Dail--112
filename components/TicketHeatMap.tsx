'use client'

import { useEffect, useState } from 'react'
import { GoogleMap as GoogleMapComponent, Marker, InfoWindow, Circle } from '@react-google-maps/api'

interface Ticket {
  id: string
  caller_name: string
  caller_phone: string
  crime_type: string
  crime_subtype: string
  description: string
  address_text: string
  verified_address: string
  latitude: number
  longitude: number
  review_status: string
  created_at: string
  transcript?: string
}

interface TicketHeatMapProps {
  tickets: Ticket[]
  selectedTicket?: string | null
  onTicketSelect?: (ticketId: string) => void
  height?: string
  showHeatmap?: boolean
}

export default function TicketHeatMap({ 
  tickets, 
  selectedTicket, 
  onTicketSelect, 
  height = '400px',
  showHeatmap = true 
}: TicketHeatMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Ticket | null>(null)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if Google Maps is available
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        setIsGoogleLoaded(true)
        console.log('Google Maps is available in TicketHeatMap')
      } else {
        console.log('Google Maps not available yet in TicketHeatMap, retrying...')
        setTimeout(checkGoogleMaps, 100)
      }
    }
    
    checkGoogleMaps()
  }, [])

  const getCrimeTypeColor = (crimeType: string) => {
    const colors = {
      'Theft': '#ef4444',
      'Assault': '#f97316', 
      'Land Dispute': '#8b5cf6',
      'Traffic Violation': '#3b82f6',
      'Public Disturbance': '#6366f1',
      'Emergency': '#dc2626'
    }
    return colors[crimeType as keyof typeof colors] || '#6b7280'
  }

  // Filter tickets with valid coordinates
  const validTickets = tickets.filter(ticket => 
    ticket.latitude && ticket.longitude && 
    ticket.latitude !== 0 && ticket.longitude !== 0
  )

  // Calculate map center (Andhra Pradesh region)
  const defaultCenter = { lat: 15.9129, lng: 79.7400 }
  const mapCenter = validTickets.length > 0 
    ? {
        lat: validTickets.reduce((sum, ticket) => sum + ticket.latitude, 0) / validTickets.length,
        lng: validTickets.reduce((sum, ticket) => sum + ticket.longitude, 0) / validTickets.length
      }
    : defaultCenter

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleMarkerClick = (ticket: Ticket) => {
    setSelectedLocation(ticket)
    if (onTicketSelect) {
      onTicketSelect(ticket.id)
    }
  }

  const handleInfoWindowClose = () => {
    setSelectedLocation(null)
  }

  if (!isClient || !isGoogleLoaded) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Map Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Crime Type Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries({
            'Theft': '#ef4444',
            'Assault': '#f97316',
            'Land Dispute': '#8b5cf6', 
            'Traffic Violation': '#3b82f6',
            'Public Disturbance': '#6366f1',
            'Emergency': '#dc2626'
          }).map(([type, color]) => (
            <div key={type} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-sm text-gray-700">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Emergency Incidents Map ({validTickets.length} locations)
          </h3>
          <p className="text-sm text-gray-600">
            Click on markers to view incident details
          </p>
        </div>
        
        <div style={{ height }}>
          <GoogleMapComponent
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={8}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            }}
          >
            {validTickets.map((ticket) => {
              const isSelected = selectedTicket === ticket.id
              
              return (
                <div key={ticket.id}>
                  <Marker
                    position={{ lat: ticket.latitude, lng: ticket.longitude }}
                    onClick={() => handleMarkerClick(ticket)}
                    title={`${ticket.crime_type} - ${ticket.caller_name}`}
                    options={{
                      icon: {
                        path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                        scale: isSelected ? 12 : 8,
                        fillColor: getCrimeTypeColor(ticket.crime_type),
                        fillOpacity: 0.8,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                      }
                    }}
                  />
                  
                  {isSelected && (
                    <Circle
                      center={{ lat: ticket.latitude, lng: ticket.longitude }}
                      radius={500} // 500 meter radius
                      options={{
                        fillColor: getCrimeTypeColor(ticket.crime_type),
                        fillOpacity: 0.1,
                        strokeColor: getCrimeTypeColor(ticket.crime_type),
                        strokeWeight: 2,
                        strokeOpacity: 0.8
                      }}
                    />
                  )}
                </div>
              )
            })}

            {selectedLocation && (
              <InfoWindow
                position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
                onCloseClick={handleInfoWindowClose}
              >
                <div className="p-3 min-w-80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900">{selectedLocation.crime_type}</span>
                    <span className="text-xs text-gray-500">{formatDate(selectedLocation.created_at)}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div><strong>Caller:</strong> {selectedLocation.caller_name}</div>
                    <div><strong>Phone:</strong> {selectedLocation.caller_phone}</div>
                    <div><strong>Subtype:</strong> {selectedLocation.crime_subtype}</div>
                    <div><strong>Status:</strong> <span className="capitalize">{selectedLocation.review_status}</span></div>
                    <div><strong>Address:</strong> {selectedLocation.verified_address || selectedLocation.address_text}</div>
                    {selectedLocation.description && (
                      <div><strong>Description:</strong> {selectedLocation.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMapComponent>
        </div>
      </div>

      {/* Map Statistics */}
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">Map Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Total Locations:</span>
            <p className="text-gray-600">{validTickets.length}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Crime Types:</span>
            <p className="text-gray-600">{new Set(validTickets.map(t => t.crime_type)).size}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Date Range:</span>
            <p className="text-gray-600">
              {validTickets.length > 0 ? 
                `${new Date(Math.min(...validTickets.map(t => new Date(t.created_at).getTime()))).toLocaleDateString()} - ${new Date(Math.max(...validTickets.map(t => new Date(t.created_at).getTime()))).toLocaleDateString()}` 
                : 'N/A'
              }
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Map Center:</span>
            <p className="text-gray-600 font-mono">
              {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 