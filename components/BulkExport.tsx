'use client'

import React, { useState } from 'react'
import { CRIME_TYPES } from '@/lib/supabase'

interface BulkExportProps {
  className?: string
}

export default function BulkExport({ className = '' }: BulkExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportFilters, setExportFilters] = useState({
    crime_type: '',
    review_status: '',
    severity_min: '',
    severity_max: ''
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'json' | 'excel') => {
    try {
      setIsExporting(true)
      const params = new URLSearchParams()
      params.append('format', format)
      
      // Apply export filters
      if (exportFilters.crime_type) params.append('crime_type', exportFilters.crime_type)
      if (exportFilters.review_status) params.append('review_status', exportFilters.review_status)
      if (exportFilters.severity_min) params.append('severity_min', exportFilters.severity_min)
      if (exportFilters.severity_max) params.append('severity_max', exportFilters.severity_max)

      const response = await fetch(`/api/tickets/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="([^"]*)"/)
      const filename = filenameMatch ? filenameMatch[1] : `tickets_export.${format === 'excel' ? 'xlsx' : 'json'}`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setIsOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export tickets. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 ${className}`}
      >
        📋 Bulk Export
      </button>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">📋 Bulk Export Options</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Crime Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crime Type
          </label>
          <select
            value={exportFilters.crime_type}
            onChange={(e) => setExportFilters(prev => ({ ...prev, crime_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Types</option>
            {Object.keys(CRIME_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Review Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Status
          </label>
          <select
            value={exportFilters.review_status}
            onChange={(e) => setExportFilters(prev => ({ ...prev, review_status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Severity Range Filter */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Severity
            </label>
            <select
              value={exportFilters.severity_min}
              onChange={(e) => setExportFilters(prev => ({ ...prev, severity_min: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">No Min</option>
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num.toString()}>{num} - {
                  num >= 9 ? 'Critical' : num >= 7 ? 'High' : num >= 5 ? 'Medium' : 'Low'
                }</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Severity
            </label>
            <select
              value={exportFilters.severity_max}
              onChange={(e) => setExportFilters(prev => ({ ...prev, severity_max: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">No Max</option>
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <option key={num} value={num.toString()}>{num} - {
                  num >= 9 ? 'Critical' : num >= 7 ? 'High' : num >= 5 ? 'Medium' : 'Low'
                }</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Export Summary:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Crime Type: {exportFilters.crime_type || 'All'}</div>
            <div>Status: {exportFilters.review_status || 'All'}</div>
            <div>Severity: {
              exportFilters.severity_min || exportFilters.severity_max 
                ? `${exportFilters.severity_min || '1'} - ${exportFilters.severity_max || '10'}`
                : 'All'
            }</div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? '⏳ Exporting...' : '📄 Export JSON'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? '⏳ Exporting...' : '📊 Export Excel'}
          </button>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => setExportFilters({ crime_type: '', review_status: '', severity_min: '', severity_max: '' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
} 