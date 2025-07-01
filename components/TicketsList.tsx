'use client'

import { useState, useEffect } from 'react'
import { CRIME_TYPES } from '@/lib/supabase'
import TicketsMap from './TicketsMap'

interface Ticket {
  id: string
  caller_name: string
  caller_phone: string
  caller_gender?: string
  call_date: string
  call_time: string
  crime_type: string
  crime_subtype: string
  description: string
  address_text: string
  verified_address: string
  latitude: number
  longitude: number
  evidence_type: string
  review_status: string
  audio_file_url?: string
  transcript?: string
  raw_transcripts?: { [language: string]: string }
  created_at: string
  severity: number
}

export default function TicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    crime_type: '',
    review_status: ''
  })
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.crime_type) params.append('crime_type', filters.crime_type)
      if (filters.review_status) params.append('review_status', filters.review_status)

      const response = await fetch(`/api/tickets?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setTickets(data.tickets || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching tickets:', err)
      setError('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [filters])

  const getStatusBadge = (status: string) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Reviewed': 'bg-blue-100 text-blue-800',
      'Resolved': 'bg-green-100 text-green-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const getCrimeTypeBadge = (type: string) => {
    const styles = {
      'Theft': 'bg-red-100 text-red-800',
      'Assault': 'bg-orange-100 text-orange-800',
      'Land Dispute': 'bg-purple-100 text-purple-800',
      'Traffic Violation': 'bg-blue-100 text-blue-800',
      'Public Disturbance': 'bg-indigo-100 text-indigo-800',
      'Emergency': 'bg-red-100 text-red-800'
    }
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading tickets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">{error}</div>
        <button
          onClick={() => fetchTickets()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crime Type
            </label>
            <select
              value={filters.crime_type}
              onChange={(e) => setFilters(prev => ({ ...prev, crime_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {Object.keys(CRIME_TYPES).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Status
            </label>
            <select
              value={filters.review_status}
              onChange={(e) => setFilters(prev => ({ ...prev, review_status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="flex items-end space-x-3">
            <button
              onClick={() => setFilters({ crime_type: '', review_status: '' })}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                📋 List View
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 text-sm font-medium ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                🗺️ Map View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <TicketsMap 
          tickets={tickets}
          selectedTicket={selectedTicket}
          onTicketSelect={setSelectedTicket}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tickets found matching your criteria.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCrimeTypeBadge(ticket.crime_type)}`}>
                          {ticket.crime_type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ticket.review_status)}`}>
                          {ticket.review_status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {ticket.crime_subtype} - {ticket.caller_name}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📞 {ticket.caller_phone}</span>
                        <span>📍 {ticket.address_text}</span>
                        <span>🕒 {ticket.call_date} {ticket.call_time}</span>
                      </div>
                      
                      {/* Specific Location Details - Critical for Emergency Response */}
                      {ticket.address_text && ticket.address_text !== 'Location not specified' && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-600 text-lg">📍</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-blue-900 mb-1">
                                Specific Location from Audio:
                              </div>
                              <div className="text-sm text-blue-800 font-semibold">
                                {ticket.address_text}
                              </div>
                              {ticket.verified_address && ticket.verified_address !== ticket.address_text && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Geocoded: {ticket.verified_address}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Severity Rating */}
                      <div className="mt-3 flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-600">Severity:</span>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            ticket.severity >= 8 ? 'bg-red-100 text-red-700 border border-red-300' :
                            ticket.severity >= 6 ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                            ticket.severity >= 4 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                            'bg-green-100 text-green-700 border border-green-300'
                          }`}>
                            {ticket.severity}/10
                          </span>
                          <span className="text-xs text-gray-500">
                            {ticket.severity >= 8 ? 'Critical' :
                             ticket.severity >= 6 ? 'High' :
                             ticket.severity >= 4 ? 'Medium' : 'Low'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Transcript Summary */}
                      {ticket.raw_transcripts && Object.keys(ticket.raw_transcripts).length > 0 && (
                        <div className="mt-3 flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-600">Transcripts:</span>
                          {Object.entries(ticket.raw_transcripts).map(([lang, text]) => (
                            <span
                              key={lang}
                              className={`px-2 py-1 text-xs rounded-full ${
                                text
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {lang === 'en-IN' ? 'EN' : lang === 'te-IN' ? 'TE' : lang === 'hi-IN' ? 'HI' : lang}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedTicket(
                        expandedTicket === ticket.id ? null : ticket.id
                      )}
                      className="ml-4 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {expandedTicket === ticket.id ? 'Collapse' : 'Details'}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {expandedTicket === ticket.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Caller Information</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Name:</span> {ticket.caller_name}</div>
                            <div><span className="font-medium">Phone:</span> {ticket.caller_phone}</div>
                            {ticket.caller_gender && (
                              <div><span className="font-medium">Gender:</span> {ticket.caller_gender}</div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Location Details</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Specific Location (Audio):</span> {ticket.address_text}</div>
                            <div><span className="font-medium">Geocoded Address:</span> {ticket.verified_address}</div>
                            <div><span className="font-medium">Coordinates:</span> {ticket.latitude}, {ticket.longitude}</div>
                          </div>
                        </div>
                      </div>
                      
                      {ticket.transcript && (
                        <div className="mt-6">
                          <h4 className="font-medium text-gray-900 mb-3">Call Transcript</h4>
                          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                            {ticket.transcript}
                          </div>
                        </div>
                      )}

                      {/* Multilingual Transcripts */}
                      {ticket.raw_transcripts && Object.keys(ticket.raw_transcripts).length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium text-gray-900 mb-3">Audio Transcripts</h4>
                          <div className="space-y-3">
                            {Object.entries(ticket.raw_transcripts).map(([lang, text]) => (
                              <div key={lang} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700 capitalize">
                                    {lang === 'en-IN' ? 'English' : lang === 'te-IN' ? 'Telugu' : lang === 'hi-IN' ? 'Hindi' : lang}
                                  </span>
                                  {text ? (
                                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Available</span>
                                  ) : (
                                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Not available</span>
                                  )}
                                </div>
                                {text ? (
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {text}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 italic">Transcript not available in this language</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
} 