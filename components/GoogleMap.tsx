'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { GoogleMap as GoogleMapComponent, Marker, InfoWindow } from '@react-google-maps/api'

interface Location {
  lat: number
  lng: number
  address?: string
  title?: string
  description?: string
}

interface GoogleMapProps {
  center?: Location
  zoom?: number
  locations?: Location[]
  height?: string
  width?: string
  showHeatmap?: boolean
  onLocationClick?: (location: Location) => void
  className?: string
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  center = { lat: 15.9129, lng: 79.7400 }, // Default to Andhra Pradesh center
  zoom = 8,
  locations = [],
  height = '400px',
  width = '100%',
  showHeatmap = false,
  onLocationClick,
  className = ''
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isGoogleMapsAvailable, setIsGoogleMapsAvailable] = useState(false)

  const mapContainerStyle = useMemo(() => ({
    width,
    height
  }), [width, height])

  const onLoad = useCallback((map: google.maps.Map) => {
    console.log('Google Map loaded successfully')
    setMap(map)
    setIsLoaded(true)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleMarkerClick = useCallback((location: Location) => {
    setSelectedLocation(location)
    onLocationClick?.(location)
  }, [onLocationClick])

  const handleInfoWindowClose = useCallback(() => {
    setSelectedLocation(null)
  }, [])

  // Check if Google Maps is available
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google && window.google.maps) {
        setIsGoogleMapsAvailable(true)
        console.log('Google Maps is available')
      } else {
        console.log('Google Maps not available yet, retrying...')
        setTimeout(checkGoogleMaps, 100)
      }
    }
    
    checkGoogleMaps()
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('GoogleMap component props:', {
      center,
      zoom,
      locationsCount: locations.length,
      height,
      width,
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing',
      isGoogleMapsAvailable,
      isLoaded
    })
  }, [center, zoom, locations, height, width, isGoogleMapsAvailable, isLoaded])

  // Show error state if Google Maps failed to load
  if (loadError) {
    return (
      <div className={`google-map-container ${className}`} style={mapContainerStyle}>
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-red-500 mb-2">🗺️</div>
            <p className="text-gray-600">Map unavailable</p>
            <p className="text-sm text-gray-500 mt-1">Google Maps failed to load</p>
            <p className="text-xs text-gray-400 mt-1">Error: {loadError}</p>
          </div>
        </div>
      </div>
    )
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  
  if (!apiKey) {
    return (
      <div className={`google-map-container ${className}`} style={mapContainerStyle}>
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-red-500 mb-2">🔑</div>
            <p className="text-gray-600">Map unavailable</p>
            <p className="text-sm text-gray-500 mt-1">Google Maps API key is missing</p>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while Google Maps is loading
  if (!isGoogleMapsAvailable) {
    return (
      <div className={`google-map-container ${className}`} style={mapContainerStyle}>
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading Google Maps...</p>
            <p className="text-xs text-gray-500 mt-1">Please wait...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`google-map-container ${className}`}>
      <GoogleMapComponent
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
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
        {locations.map((location, index) => (
          <Marker
            key={index}
            position={location}
            onClick={() => handleMarkerClick(location)}
            title={location.title || location.address}
          />
        ))}

        {selectedLocation && (
          <InfoWindow
            position={selectedLocation}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm">{selectedLocation.title || 'Location'}</h3>
              {selectedLocation.address && (
                <p className="text-xs text-gray-600 mt-1">{selectedLocation.address}</p>
              )}
              {selectedLocation.description && (
                <div 
                  className="text-xs text-gray-500 mt-1"
                  dangerouslySetInnerHTML={{ __html: selectedLocation.description }}
                />
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMapComponent>
    </div>
  )
}

export default GoogleMap 