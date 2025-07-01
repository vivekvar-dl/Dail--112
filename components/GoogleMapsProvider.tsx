'use client'

import { ReactNode, useState, useEffect } from 'react'
import { LoadScript } from '@react-google-maps/api'

interface GoogleMapsProviderProps {
  children: ReactNode
}

// Global state to track if Google Maps script is loaded
let isGoogleMapsScriptLoaded = false
let scriptLoadPromise: Promise<void> | null = null

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (isGoogleMapsScriptLoaded) {
    return Promise.resolve()
  }
  
  if (scriptLoadPromise) {
    return scriptLoadPromise
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      isGoogleMapsScriptLoaded = true
      resolve()
    }
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'))
    }
    
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  
  useEffect(() => {
    const loadScript = async () => {
      try {
        setIsLoading(true)
        await loadGoogleMapsScript(apiKey)
        setIsLoaded(true)
        console.log('Google Maps script loaded successfully')
      } catch (error) {
        console.error('Failed to load Google Maps script:', error)
        setError('Failed to load Google Maps')
      } finally {
        setIsLoading(false)
      }
    }

    if (apiKey) {
      loadScript()
    } else {
      setIsLoading(false)
    }
  }, [apiKey])
  
  if (!apiKey) {
    return <>{children}</>
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Failed to load Google Maps: {error}</p>
        {children}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-blue-800">Loading Google Maps...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 