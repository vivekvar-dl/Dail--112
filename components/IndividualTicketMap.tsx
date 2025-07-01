'use client'

import { useEffect, useState } from 'react'
import GoogleMap from './GoogleMap'

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

interface IndividualTicketMapProps {
  ticket: Ticket
  height?: string
  showDetails?: boolean
}

export default function IndividualTicketMap({ ticket, height = '400px', showDetails = true }: IndividualTicketMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('IndividualTicketMap props:', {
      ticketId: ticket.id,
      hasValidCoordinates: ticket.latitude && ticket.longitude && ticket.latitude !== 0 && ticket.longitude !== 0,
      latitude: ticket.latitude,
      longitude: ticket.longitude,
      address: ticket.verified_address || ticket.address_text,
      isClient
    })
  }, [ticket, isClient])

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Check if ticket has valid coordinates
  const hasValidCoordinates = ticket.latitude && ticket.longitude && 
    ticket.latitude !== 0 && ticket.longitude !== 0

  if (!isClient) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (!hasValidCoordinates) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="text-gray-500 mb-2">📍</div>
          <p className="text-gray-600">No location data available</p>
          <p className="text-sm text-gray-500 mt-1">{ticket.address_text || 'Address not specified'}</p>
        </div>
      </div>
    )
  }

  const mapCenter = { lat: ticket.latitude, lng: ticket.longitude }
  
  const mapLocation = {
    lat: ticket.latitude,
    lng: ticket.longitude,
    title: `${ticket.crime_type} - ${ticket.caller_name}`,
    address: ticket.verified_address || ticket.address_text,
    description: showDetails ? `
      <div class="p-3 min-w-80">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-900">${ticket.crime_type}</span>
          <span class="text-xs text-gray-500">${formatDate(ticket.created_at)}</span>
        </div>
        <div class="space-y-2 text-sm">
          <div><strong>Caller:</strong> ${ticket.caller_name}</div>
          <div><strong>Phone:</strong> ${ticket.caller_phone}</div>
          <div><strong>Subtype:</strong> ${ticket.crime_subtype}</div>
          <div><strong>Status:</strong> <span class="capitalize">${ticket.review_status}</span></div>
          <div><strong>Address:</strong> ${ticket.verified_address || ticket.address_text}</div>
          ${ticket.description ? `<div><strong>Description:</strong> ${ticket.description}</div>` : ''}
          <div class="text-xs text-gray-500 mt-2">
            📍 ${ticket.latitude.toFixed(6)}, ${ticket.longitude.toFixed(6)}
          </div>
        </div>
      </div>
    ` : undefined
  }

  return (
    <div className="space-y-4">
      {/* Map Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Incident Location</h3>
            <p className="text-sm text-gray-600">
              {ticket.verified_address || ticket.address_text}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: getCrimeTypeColor(ticket.crime_type) }}
            ></div>
            <span className="text-sm font-medium text-gray-700">{ticket.crime_type}</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <GoogleMap
          center={mapCenter}
          zoom={15}
          locations={[mapLocation]}
          height={height}
        />
      </div>

      {/* Location Details */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3">Location Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Coordinates:</span>
              <p className="text-gray-600 font-mono">
                {ticket.latitude.toFixed(6)}, {ticket.longitude.toFixed(6)}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Address:</span>
              <p className="text-gray-600">{ticket.verified_address || ticket.address_text}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Reported:</span>
              <p className="text-gray-600">{formatDate(ticket.created_at)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <p className="text-gray-600 capitalize">{ticket.review_status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 