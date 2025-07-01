'use client'

import React, { useState, useEffect } from 'react'
import { CRIME_TYPES } from '@/lib/supabase'
import GradientHeatMap from './GradientHeatMap'
import BulkExport from './BulkExport'
import IndividualTicketMap from './IndividualTicketMap'
import { GoogleMap as GoogleMapComponent, MarkerF, useJsApiLoader } from '@react-google-maps/api'

interface Ticket {
  id: string
  caller_name: string
  caller_phone: string
  caller_gender?: string
  incident_date: string
  incident_time: string
  crime_type: string
  crime_subtype: string
  severity: number
  description: string
  address_text: string
  verified_address: string
  latitude: number
  longitude: number
  evidence_type: string
  review_status: string
  audio_file_url?: string
  transcript?: string
  raw_transcripts?: { [language: string]: string; }
  created_at: string
  emergency_recommendations?: string[]
}

export default function TicketsWithMap() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    crime_type: '',
    review_status: ''
  })
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set())
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [heatMapFilters, setHeatMapFilters] = useState({
    timeFilter: 'all' as 'all' | 'today' | 'week' | 'month',
    crimeTypeFilter: ''
  })
  const [transcriptTab, setTranscriptTab] = useState<'en-IN' | 'te-IN' | 'hi-IN'>('en-IN');

  // Google Maps API loader for modal map
  const { isLoaded: isMapLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    fetchTickets()
  }, [filters])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.crime_type) params.append('crime_type', filters.crime_type)
      if (filters.review_status) params.append('review_status', filters.review_status)
      params.append('limit', '100')

      const response = await fetch(`/api/tickets?${params}`)
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets)
      } else {
        setError(data.error || 'Failed to fetch tickets')
      }
    } catch (err) {
      setError('Failed to fetch tickets')
      console.error('Error fetching tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Reviewed': 'bg-blue-100 text-blue-800 border-blue-300',
      'Resolved': 'bg-green-100 text-green-800 border-green-300'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getCrimeTypeBadge = (type: string) => {
    const colors = {
      'Theft': 'bg-red-100 text-red-800 border-red-300',
      'Assault': 'bg-orange-100 text-orange-800 border-orange-300',
      'Land Dispute': 'bg-purple-100 text-purple-800 border-purple-300',
      'Traffic Violation': 'bg-blue-100 text-blue-800 border-blue-300',
      'Public Disturbance': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'Emergency': 'bg-red-100 text-red-800 border-red-300'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getSeverityBadge = (severity: number) => {
    if (severity >= 8) return 'bg-red-100 text-red-800 border-red-300'
    if (severity >= 6) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (severity >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'Critical'
    if (severity >= 6) return 'High'
    if (severity >= 4) return 'Medium'
    return 'Low'
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

  const toggleTicketExpansion = (ticketId: string) => {
    const newExpanded = new Set(expandedTickets)
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId)
    } else {
      newExpanded.add(ticketId)
    }
    setExpandedTickets(newExpanded)
  }

  const renderTicketDetails = (ticket: Ticket) => {
    if (!expandedTickets.has(ticket.id)) {
      return null;
    }

    return (
      <tr key={`${ticket.id}-details`}>
        <td colSpan={8}>
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Incident Details - Ticket #{ticket.id.substring(0, 8)}
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Call Summary */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-semibold text-gray-700 flex items-center mb-3">
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Call Summary (English)
                  </h5>
                  <p className="text-sm text-gray-700 italic bg-gray-50 p-3 rounded border">"{ticket.description}"</p>
                </div>

                {/* Additional Info */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-semibold text-gray-700 mb-3">Additional Information</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Severity:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border ${getSeverityBadge(ticket.severity)}`}>
                        {getSeverityLabel(ticket.severity)} ({ticket.severity}/10)
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Evidence Type:</span>
                      <span className="ml-2 text-gray-700">{ticket.evidence_type}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Incident Date:</span>
                      <span className="ml-2 text-gray-700">{ticket.incident_date}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Incident Time:</span>
                      <span className="ml-2 text-gray-700">{ticket.incident_time}</span>
                    </div>
                  </div>
                </div>

                {/* Audio Player */}
                {ticket.audio_file_url && ticket.audio_file_url.startsWith('http') && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="font-semibold text-gray-700 flex items-center mb-3">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0v-1a3 3 0 00-6 0v1z" />
                      </svg>
                      Original Call Recording
                    </h5>
                    <audio controls className="w-full" src={ticket.audio_file_url}>
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Transcripts */}
                {ticket.raw_transcripts && Object.keys(ticket.raw_transcripts).length > 0 ? (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Full Transcripts
                    </h5>
                    <div className="space-y-2">
                      {Object.entries(ticket.raw_transcripts).map(([lang, text]) => (
                        <details key={lang} className="bg-gray-50 rounded border">
                          <summary className="font-medium text-sm text-blue-700 cursor-pointer hover:underline p-3 border-b border-gray-200">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                              Transcript ({lang.charAt(0).toUpperCase() + lang.slice(1)})
                            </span>
                          </summary>
                          <div className="p-3 text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white border-t border-gray-200">
                            {text}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ) : ticket.transcript ? (
                  // Fallback for old consolidated transcript
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h5 className="font-semibold text-gray-700 mb-3">Consolidated Transcript</h5>
                    <div className="p-3 bg-gray-50 border rounded-md text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {ticket.transcript}
                    </div>
                  </div>
                ) : null}

                {/* Location Map */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Incident Location
                  </h5>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Address:</strong> {ticket.verified_address}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <strong>Coordinates:</strong> {ticket.latitude.toFixed(6)}, {ticket.longitude.toFixed(6)}
                  </div>
                  <div className="h-48 bg-gray-100 rounded border">
                    <IndividualTicketMap ticket={ticket} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  const handleExport = async (format: 'json' | 'excel') => {
    try {
      const response = await fetch('/api/tickets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, filters })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tickets-export.${format === 'json' ? 'json' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    if (filters.crime_type && ticket.crime_type !== filters.crime_type) return false
    if (filters.review_status && ticket.review_status !== filters.review_status) return false
    return true
  })

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900">Loading Emergency Tickets...</div>
          <div className="text-sm text-gray-600">Please wait while we fetch the latest incident data</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Error Loading Tickets</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <button 
                onClick={fetchTickets}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-6 flex-shrink-0 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Emergency Incidents Management</h1>
              <p className="text-blue-100">Andhra Pradesh Police - 112 Call Processing Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <div className="text-sm font-medium">Active Tickets</div>
              <div className="text-2xl font-bold">{filteredTickets.filter(t => t.review_status !== 'Resolved').length}</div>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <div className="text-sm font-medium">Total Processed</div>
              <div className="text-2xl font-bold">{filteredTickets.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Crime Type</label>
            <select
              value={filters.crime_type}
              onChange={(e) => setFilters(prev => ({ ...prev, crime_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              {Object.keys(CRIME_TYPES).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Review Status</label>
            <select
              value={filters.review_status}
              onChange={(e) => setFilters(prev => ({ ...prev, review_status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ crime_type: '', review_status: '' })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Clear Filters
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchTickets}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
          <div className="flex items-end">
            <BulkExport />
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0 md:gap-6 p-0 md:p-6 overflow-hidden">
        {/* Emergency Tickets as Card Grid */}
        <div className="lg:col-span-3 bg-white rounded-none md:rounded-l-lg shadow-lg flex flex-col overflow-hidden border-r border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Emergency Tickets ({filteredTickets.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getCrimeTypeBadge(ticket.crime_type)}`}>{ticket.crime_type}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getSeverityBadge(ticket.severity)}`}>{getSeverityLabel(ticket.severity)}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusBadge(ticket.review_status)}`}>{ticket.review_status}</span>
                  </div>
                  
                  {/* Prominent Severity Rating */}
                  <div className="mb-3 flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-gray-700">Severity Rating:</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm font-bold rounded-full border-2 ${
                          ticket.severity >= 8 ? 'bg-red-100 text-red-800 border-red-400' :
                          ticket.severity >= 6 ? 'bg-orange-100 text-orange-800 border-orange-400' :
                          ticket.severity >= 4 ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
                          'bg-green-100 text-green-800 border-green-400'
                        }`}>
                          {ticket.severity}/10
                        </span>
                        <span className={`text-sm font-medium ${
                          ticket.severity >= 8 ? 'text-red-700' :
                          ticket.severity >= 6 ? 'text-orange-700' :
                          ticket.severity >= 4 ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          {getSeverityLabel(ticket.severity)}
                        </span>
                      </div>
                    </div>
                    {/* Severity Icon */}
                    <div className={`p-2 rounded-full ${
                      ticket.severity >= 8 ? 'bg-red-100' :
                      ticket.severity >= 6 ? 'bg-orange-100' :
                      ticket.severity >= 4 ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <svg className={`w-4 h-4 ${
                        ticket.severity >= 8 ? 'text-red-600' :
                        ticket.severity >= 6 ? 'text-orange-600' :
                        ticket.severity >= 4 ? 'text-yellow-600' : 'text-green-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="text-gray-900 font-medium text-base mb-1 truncate" title={ticket.description}>{ticket.description.length > 90 ? ticket.description.slice(0, 90) + '…' : ticket.description}</div>
                  <div className="flex flex-col gap-1 text-xs text-gray-600">
                    <div><span className="font-semibold text-gray-700">Caller:</span> {ticket.caller_name}</div>
                    <div><span className="font-semibold text-gray-700">Location:</span> {ticket.address_text}</div>
                    <div><span className="font-semibold text-gray-700">Date:</span> {formatDate(ticket.created_at)}</div>
                  </div>
                  {/* Audio Transcript summary for each language */}
                  {ticket.raw_transcripts && (
                    <div className="mt-2">
                      <div className="font-semibold text-gray-700 mb-1">Audio Transcripts:</div>
                      <div className="flex flex-col gap-1">
                        {['en-IN', 'te-IN', 'hi-IN'].map(lang => (
                          <div key={lang}>
                            <span className="font-semibold text-blue-700 mr-2">{lang === 'en-IN' ? 'English' : lang === 'te-IN' ? 'Telugu' : 'Hindi'}:</span>
                            <span className="text-gray-800">
                              {ticket.raw_transcripts && ticket.raw_transcripts[lang]
                                ? ticket.raw_transcripts[lang].split('\n')[0].slice(0, 60) + (ticket.raw_transcripts[lang].length > 60 ? '…' : '')
                                : 'Not available'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Emergency Services */}
                  {ticket.emergency_recommendations && ticket.emergency_recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-gray-700 mb-1">🚨 Required Services:</div>
                      <div className="flex flex-wrap gap-1">
                        {ticket.emergency_recommendations.map((service, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedTicket(ticket); setTranscriptTab('en-IN'); }}
                      className="px-4 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Large Circular Heat Map Card */}
        <aside className="lg:col-span-1 max-w-2xl w-full bg-transparent flex flex-col items-center justify-start py-8 px-2">
          <div className="w-full flex flex-col items-center">
            <div className="w-full bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-2xl border border-blue-100 p-6 flex flex-col items-center">
              <h3 className="text-xl font-bold text-blue-900 mb-4 tracking-wide flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 012-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                Crime Heat Map
              </h3>
              <div className="w-[30rem] h-[30rem] rounded-full overflow-hidden border-4 border-blue-200 shadow-xl flex items-center justify-center mb-6 bg-white">
                <GradientHeatMap 
                  tickets={filteredTickets} 
                  timeFilter={heatMapFilters.timeFilter}
                  crimeTypeFilter={heatMapFilters.crimeTypeFilter}
                  circular={true}
                />
              </div>
              {/* Stats below the map */}
              <div className="w-full flex flex-col items-center">
                <div className="flex flex-row justify-center gap-8 mb-2">
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-extrabold text-blue-700">{filteredTickets.length}</div>
                    <div className="text-base font-medium text-blue-900">Total Incidents</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-4xl font-extrabold text-orange-600">{new Set(filteredTickets.map(t => t.crime_type)).size}</div>
                    <div className="text-base font-medium text-orange-800">Crime Types</div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
                    Heat intensity: <span className="text-blue-600">Blue (Low)</span> → <span className="text-red-600">Red (High)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Ticket Modal Popup */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 relative animate-fade-in flex flex-col md:flex-row gap-8 pointer-events-auto">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setSelectedTicket(null)}
              aria-label="Close"
            >
              &times;
            </button>
            {/* Left column: main details */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getCrimeTypeBadge(selectedTicket.crime_type)}`}>{selectedTicket.crime_type}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded border ${getSeverityBadge(selectedTicket.severity)}`}>{getSeverityLabel(selectedTicket.severity)}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusBadge(selectedTicket.review_status)}`}>{selectedTicket.review_status}</span>
              </div>
              <h2 className="text-xl font-bold text-blue-900">{selectedTicket.description}</h2>
              <div className="space-y-1 text-sm">
                <div><span className="font-semibold text-gray-700">Caller:</span> {selectedTicket.caller_name}</div>
                <div><span className="font-semibold text-gray-700">Phone:</span> {selectedTicket.caller_phone}</div>
                <div><span className="font-semibold text-gray-700">Gender:</span> {selectedTicket.caller_gender || 'N/A'}</div>
                <div><span className="font-semibold text-gray-700">Date:</span> {formatDate(selectedTicket.created_at)}</div>
                <div><span className="font-semibold text-gray-700">Incident Date:</span> {selectedTicket.incident_date}</div>
                <div><span className="font-semibold text-gray-700">Incident Time:</span> {selectedTicket.incident_time}</div>
                <div><span className="font-semibold text-gray-700">Evidence Type:</span> {selectedTicket.evidence_type}</div>
                <div><span className="font-semibold text-gray-700">Subtype:</span> {selectedTicket.crime_subtype}</div>
                <div><span className="font-semibold text-gray-700">Severity:</span> 
                  <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full border ${
                    selectedTicket.severity >= 8 ? 'bg-red-100 text-red-800 border-red-300' :
                    selectedTicket.severity >= 6 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                    selectedTicket.severity >= 4 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                    'bg-green-100 text-green-800 border-green-300'
                  }`}>
                    {selectedTicket.severity}/10 - {getSeverityLabel(selectedTicket.severity)}
                  </span>
                </div>
                {selectedTicket.emergency_recommendations && selectedTicket.emergency_recommendations.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="font-semibold text-red-800 mb-2">🚨 Emergency Services Required</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.emergency_recommendations.map((service, index) => (
                        <span key={index} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full font-medium">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div><span className="font-semibold text-gray-700">Location:</span> {selectedTicket.address_text}</div>
                <div><span className="font-semibold text-gray-700">Geocoded Address:</span> {selectedTicket.verified_address}</div>
                <div><span className="font-semibold text-gray-700">Coordinates:</span> {selectedTicket.latitude}, {selectedTicket.longitude}</div>
              </div>
            </div>
            {/* Right column: map, audio, transcript, raw transcripts */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {/* Map */}
              <div className="h-40 w-full rounded-lg overflow-hidden border">
                {isMapLoaded && (
                  <GoogleMapComponent
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={{ lat: selectedTicket.latitude, lng: selectedTicket.longitude }}
                    zoom={15}
                    options={{
                      zoomControl: false,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      clickableIcons: false,
                      disableDefaultUI: true,
                    }}
                  >
                    <MarkerF position={{ lat: selectedTicket.latitude, lng: selectedTicket.longitude }} />
                  </GoogleMapComponent>
                )}
                {!isMapLoaded && (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading map…</div>
                )}
              </div>
              {/* Audio */}
              {selectedTicket.audio_file_url && selectedTicket.audio_file_url.startsWith('http') && (
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Audio Recording:</div>
                  <audio controls className="w-full" src={selectedTicket.audio_file_url}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              {/* Transcripts Tabs */}
              <div>
                <div className="font-semibold text-gray-700 mb-1">Audio Transcripts:</div>
                <div className="flex gap-2 mb-2">
                  {['en-IN', 'te-IN', 'hi-IN'].map(lang => (
                    <button
                      key={lang}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${transcriptTab === lang ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-blue-700 border-gray-300'}`}
                      onClick={() => setTranscriptTab(lang as 'en-IN' | 'te-IN' | 'hi-IN')}
                    >
                      {lang === 'en-IN' ? 'English' : lang === 'te-IN' ? 'Telugu' : 'Hindi'}
                    </button>
                  ))}
                </div>
                <div className="bg-gray-50 rounded p-3 text-xs text-gray-900 whitespace-pre-line max-h-32 overflow-auto min-h-[4rem]">
                  {selectedTicket.raw_transcripts && selectedTicket.raw_transcripts[transcriptTab]
                    ? selectedTicket.raw_transcripts[transcriptTab]
                    : 'Not available'}
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}