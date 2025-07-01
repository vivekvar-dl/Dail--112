'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { GoogleMap as GoogleMapComponent, HeatmapLayer } from '@react-google-maps/api'

interface Ticket {
  id: string
  crime_type: string
  crime_subtype: string
  severity: number
  latitude: number
  longitude: number
  incident_date: string
  incident_time: string
  verified_address: string
  description: string
}

interface GradientHeatMapProps {
  tickets: Ticket[]
  timeFilter: 'all' | 'today' | 'week' | 'month'
  crimeTypeFilter: string
  circular?: boolean
}

export default function GradientHeatMap({ tickets, timeFilter, crimeTypeFilter, circular = false }: GradientHeatMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if Google Maps is available
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        setIsGoogleLoaded(true)
        console.log('Google Maps is available in GradientHeatMap')
      } else {
        console.log('Google Maps not available yet in GradientHeatMap, retrying...')
        setTimeout(checkGoogleMaps, 100)
      }
    }
    
    checkGoogleMaps()
  }, [])

  // Memoize filtered tickets to prevent infinite re-renders
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Crime type filter
      if (crimeTypeFilter && ticket.crime_type !== crimeTypeFilter) {
        return false
      }

      // Time filter
      if (timeFilter !== 'all') {
        const ticketDate = new Date(ticket.incident_date)
        const now = new Date()
        
        switch (timeFilter) {
          case 'today':
            return ticketDate.toDateString() === now.toDateString()
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return ticketDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            return ticketDate >= monthAgo
          default:
            return true
        }
      }

      return true
    })
  }, [tickets, timeFilter, crimeTypeFilter])

  // Convert tickets to heatmap data
  useEffect(() => {
    if (!isGoogleLoaded || typeof window === 'undefined' || !window.google) {
      return
    }

    try {
      console.log('GradientHeatMap: Processing tickets for heatmap:', filteredTickets.length)
      
      // Debug: Log all ticket coordinates
      filteredTickets.forEach((ticket, index) => {
        console.log(`Ticket ${index + 1}:`, {
          id: ticket.id,
          crime_type: ticket.crime_type,
          latitude: ticket.latitude,
          longitude: ticket.longitude,
          address: ticket.verified_address
        })
      })
      
      // Filter out invalid coordinates more strictly
      const validTickets = filteredTickets.filter(ticket => {
        const isValid = ticket.latitude && 
                       ticket.longitude && 
                       ticket.latitude !== 0 && 
                       ticket.longitude !== 0 &&
                       !isNaN(ticket.latitude) && 
                       !isNaN(ticket.longitude) &&
                       ticket.latitude >= -90 && 
                       ticket.latitude <= 90 &&
                       ticket.longitude >= -180 && 
                       ticket.longitude <= 180
        
        if (!isValid) {
          console.warn('Invalid coordinates for ticket:', ticket.id, {
            latitude: ticket.latitude,
            longitude: ticket.longitude,
            address: ticket.verified_address
          })
        }
        
        return isValid
      })
      
      console.log('GradientHeatMap: Valid tickets for heatmap:', validTickets.length)
      
      if (validTickets.length === 0) {
        console.warn('GradientHeatMap: No valid coordinates found for heatmap')
        setHeatmapData([])
        return
      }
      
      const data = validTickets.map(ticket => new window.google.maps.LatLng(ticket.latitude, ticket.longitude))
      
      console.log('GradientHeatMap: Created heatmap data points:', data.length)
      console.log('GradientHeatMap: Sample coordinates:', data.slice(0, 3).map(point => ({
        lat: point.lat(),
        lng: point.lng()
      })))
      
      setHeatmapData(data)
    } catch (error) {
      console.error('Error creating heatmap data:', error)
      // Fallback to simple lat/lng objects
      const validTickets = filteredTickets.filter(ticket => {
        return ticket.latitude && 
               ticket.longitude && 
               ticket.latitude !== 0 && 
               ticket.longitude !== 0 &&
               !isNaN(ticket.latitude) && 
               !isNaN(ticket.longitude) &&
               ticket.latitude >= -90 && 
               ticket.latitude <= 90 &&
               ticket.longitude >= -180 && 
               ticket.longitude <= 180
      })
      
      const data = validTickets.map(ticket => ({ lat: ticket.latitude, lng: ticket.longitude }))
      
      setHeatmapData(data)
    }
  }, [filteredTickets, isGoogleLoaded])

  // Memoize map center calculation
  const mapCenter = useMemo(() => {
    // Default center for Andhra Pradesh
    const defaultCenter = { lat: 15.9129, lng: 79.7400 } // Center of Andhra Pradesh
    
    // Filter for valid coordinates
    const validTickets = filteredTickets.filter(ticket => {
      return ticket.latitude && 
             ticket.longitude && 
             ticket.latitude !== 0 && 
             ticket.longitude !== 0 &&
             !isNaN(ticket.latitude) && 
             !isNaN(ticket.longitude) &&
             ticket.latitude >= -90 && 
             ticket.latitude <= 90 &&
             ticket.longitude >= -180 && 
             ticket.longitude <= 180
    })
    
    if (validTickets.length === 0) {
      console.log('GradientHeatMap: No valid tickets, using default center:', defaultCenter)
      return defaultCenter
    }
    
    const center = {
      lat: validTickets.reduce((sum, ticket) => sum + ticket.latitude, 0) / validTickets.length,
      lng: validTickets.reduce((sum, ticket) => sum + ticket.longitude, 0) / validTickets.length
    }
    
    console.log('GradientHeatMap: Calculated center:', center, 'from', validTickets.length, 'valid tickets')
    return center
  }, [filteredTickets])

  if (!isClient || !isGoogleLoaded) {
    return (
      <div className={`${circular ? 'h-full w-full' : 'h-96'} bg-gray-100 ${circular ? 'rounded-full' : 'rounded-lg'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading heat map...</p>
        </div>
      </div>
    )
  }

  // Check if we have valid coordinates for heatmap
  const validTickets = filteredTickets.filter(ticket => {
    return ticket.latitude && 
           ticket.longitude && 
           ticket.latitude !== 0 && 
           ticket.longitude !== 0 &&
           !isNaN(ticket.latitude) && 
           !isNaN(ticket.longitude) &&
           ticket.latitude >= -90 && 
           ticket.latitude <= 90 &&
           ticket.longitude >= -180 && 
           ticket.longitude <= 180
  })

  if (validTickets.length === 0) {
    return (
      <div className={`${circular ? 'h-full w-full' : 'h-96'} bg-gray-100 ${circular ? 'rounded-full' : 'rounded-lg'} flex items-center justify-center`}>
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-600 font-medium">No incident locations available</p>
          <p className="text-gray-500 text-sm mt-1">Upload audio files to see crime heat map</p>
        </div>
      </div>
    )
  }

  // If circular mode, return only the map
  if (circular) {
    return (
      <div className="h-full w-full">
        <GoogleMapComponent
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={heatmapData.length > 0 ? 8 : 7}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            gestureHandling: 'cooperative',
            minZoom: 6,
            maxZoom: 15,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          }}
        >
          {heatmapData.length > 0 && (
            <HeatmapLayer
              data={heatmapData}
              options={{
                radius: 30,
                opacity: 0.9,
                maxIntensity: 10,
                gradient: [
                  'rgba(0, 255, 255, 0)',
                  'rgba(0, 255, 255, 1)',
                  'rgba(0, 191, 255, 1)',
                  'rgba(0, 127, 255, 1)',
                  'rgba(0, 63, 255, 1)',
                  'rgba(0, 0, 255, 1)',
                  'rgba(0, 0, 223, 1)',
                  'rgba(0, 0, 191, 1)',
                  'rgba(0, 0, 159, 1)',
                  'rgba(0, 0, 127, 1)',
                  'rgba(63, 0, 91, 1)',
                  'rgba(127, 0, 63, 1)',
                  'rgba(191, 0, 31, 1)',
                  'rgba(255, 0, 0, 1)'
                ]
              }}
            />
          )}
        </GoogleMapComponent>
      </div>
    )
  }

  // Original full layout for non-circular mode
  return (
    <div className="space-y-4">
      {/* Heat Map Stats */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h4 className="text-lg font-medium text-gray-900 mb-3">🔥 Crime Heat Map Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-red-50 p-3 rounded">
            <div className="text-2xl font-bold text-red-600">{filteredTickets.length}</div>
            <div className="text-red-800">Total Incidents</div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-2xl font-bold text-orange-600">
              {new Set(filteredTickets.map(t => t.crime_type)).size}
            </div>
            <div className="text-orange-800">Crime Types</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-2xl font-bold text-yellow-600">
              {timeFilter === 'all' ? 'All Time' : timeFilter === 'today' ? 'Today' : 
               timeFilter === 'week' ? '7 Days' : '30 Days'}
            </div>
            <div className="text-yellow-800">Time Period</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {new Set(filteredTickets.map(t => 
                `${Math.floor(t.latitude * 100) / 100},${Math.floor(t.longitude * 100) / 100}`
              )).size}
            </div>
            <div className="text-blue-800">Unique Areas</div>
          </div>
        </div>
      </div>

      {/* Heat Map Legend */}
      <div className="bg-white rounded-lg p-4 shadow">
        <h5 className="font-medium text-gray-900 mb-3">Heat Intensity Legend</h5>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">Low</span>
          <div 
            className="h-4 flex-1 rounded"
            style={{
              background: 'linear-gradient(to right, #000066, #000099, #0000CC, #0066FF, #0099FF, #00CCFF, #00FFCC, #00FF99, #66FF00, #FFFF00, #FF0000)'
            }}
          ></div>
          <span className="text-sm text-gray-600">High</span>
        </div>
        <p className="text-xs text-gray-500">
          Colors represent crime density - Blue (low) to Red (high concentration)
        </p>
      </div>

      {/* Heat Map */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="h-96">
          <GoogleMapComponent
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={heatmapData.length > 0 ? 8 : 7}
            options={{
              zoomControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              gestureHandling: 'cooperative',
              minZoom: 6,
              maxZoom: 15,
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ]
            }}
          >
            {heatmapData.length > 0 && (
              <HeatmapLayer
                data={heatmapData}
                options={{
                  radius: 30,
                  opacity: 0.9,
                  maxIntensity: 10,
                  gradient: [
                    'rgba(0, 255, 255, 0)',
                    'rgba(0, 255, 255, 1)',
                    'rgba(0, 191, 255, 1)',
                    'rgba(0, 127, 255, 1)',
                    'rgba(0, 63, 255, 1)',
                    'rgba(0, 0, 255, 1)',
                    'rgba(0, 0, 223, 1)',
                    'rgba(0, 0, 191, 1)',
                    'rgba(0, 0, 159, 1)',
                    'rgba(0, 0, 127, 1)',
                    'rgba(63, 0, 91, 1)',
                    'rgba(127, 0, 63, 1)',
                    'rgba(191, 0, 31, 1)',
                    'rgba(255, 0, 0, 1)'
                  ]
                }}
              />
            )}
          </GoogleMapComponent>
        </div>
      </div>

      {/* Crime Type Breakdown */}
      {filteredTickets.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow">
          <h5 className="font-medium text-gray-900 mb-3">Crime Type Distribution</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(
              filteredTickets.reduce((acc, ticket) => {
                acc[ticket.crime_type] = (acc[ticket.crime_type] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            )
            .sort(([,a], [,b]) => b - a)
            .map(([type, count]) => (
              <div key={type} className="bg-gray-50 p-3 rounded">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 