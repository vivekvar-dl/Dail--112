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

interface TicketsMapProps {
  tickets: Ticket[]
  selectedTicket?: string | null
  onTicketSelect?: (ticketId: string) => void
}

export default function TicketsMap({ tickets, selectedTicket, onTicketSelect }: TicketsMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
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
  const defaultCenter = { lat: 15.9129, lng: 79.7400 } // Andhra Pradesh center
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

  // Convert tickets to map locations
  const mapLocations = validTickets.map(ticket => ({
    lat: ticket.latitude,
    lng: ticket.longitude,
    title: `${ticket.crime_type} - ${ticket.caller_name}`,
    address: ticket.verified_address || ticket.address_text,
    description: `
      <div class="p-2 min-w-64">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-900">${ticket.crime_type}</span>
          <span class="text-xs text-gray-500">${formatDate(ticket.created_at)}</span>
        </div>
        <div class="space-y-1 text-xs">
          <p><strong>Caller:</strong> ${ticket.caller_name}</p>
          <p><strong>Phone:</strong> ${ticket.caller_phone}</p>
          <p><strong>Subtype:</strong> ${ticket.crime_subtype}</p>
          <p><strong>Status:</strong> <span class="capitalize">${ticket.review_status}</span></p>
          <p><strong>Address:</strong> ${ticket.verified_address || ticket.address_text}</p>
          ${ticket.description ? `<p><strong>Description:</strong> ${ticket.description}</p>` : ''}
        </div>
      </div>
    `
  }))

  const handleLocationClick = (location: any) => {
    // Find the ticket that matches this location
    const ticket = validTickets.find(t => 
      t.latitude === location.lat && t.longitude === location.lng
    )
    if (ticket && onTicketSelect) {
      onTicketSelect(ticket.id)
    }
  }

  if (!isClient) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
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
        
        <div className="h-96">
          <GoogleMap
            center={mapCenter}
            zoom={8}
            locations={mapLocations}
            height="100%"
            onLocationClick={handleLocationClick}
          />
        </div>
      </div>
    </div>
  )
} 