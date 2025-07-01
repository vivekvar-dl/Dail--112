'use client'

import React, { useState, useRef } from 'react'

interface ProcessingFile {
  file: File
  status: 'waiting' | 'processing' | 'completed' | 'error'
  progress: number
  result?: any
  error?: string
  ticketId?: string
}

interface BatchProcessingResult {
  success: boolean
  total: number
  completed: number
  failed: number
  results: any[]
}

export default function BatchAudioUpload() {
  const [files, setFiles] = useState<ProcessingFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchProcessingResult | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    processFiles(selectedFiles)
  }

  const processFiles = (selectedFiles: File[]) => {
    const audioFiles = selectedFiles.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.toLowerCase().endsWith('.wav') ||
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.m4a')
    )

    const processingFiles: ProcessingFile[] = audioFiles.map(file => ({
      file,
      status: 'waiting',
      progress: 0
    }))

    setFiles(prev => [...prev, ...processingFiles])
    setBatchResult(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }

  const removeFile = (index: number) => {
    if (isProcessing) return
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
  }

  const processBatch = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setProcessingStatus(`Preparing to process ${files.length} files...`)
    
    // Update all files to processing status
    setFiles(prev => prev.map(f => ({ ...f, status: 'processing' })))

    try {
      setProcessingStatus('Uploading files to server...')
      
      // Create FormData with all files
      const formData = new FormData()
      files.forEach(fileItem => {
        formData.append('files', fileItem.file)
      })

      setProcessingStatus('Starting batch processing...')

      // Start batch processing
      const response = await fetch('/api/process-batch', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setProcessingStatus('Processing completed, updating results...')
      const batchResult = await response.json()

      // Update individual file statuses based on results
      if (batchResult.success) {
        setFiles(prev => prev.map(fileItem => {
          const result = batchResult.results.find((r: any) => r.filename === fileItem.file.name)
          const error = batchResult.errors.find((e: any) => e.filename === fileItem.file.name)
          
          if (result) {
            return {
              ...fileItem,
              status: 'completed',
              progress: 100,
              result: result,
              ticketId: result.ticket?.id
            }
          } else if (error) {
            return {
              ...fileItem,
              status: 'error',
              progress: 0,
              error: error.error
            }
          } else {
            return {
              ...fileItem,
              status: 'error',
              progress: 0,
              error: 'Unknown processing error'
            }
          }
        }))

        setBatchResult({
          success: true,
          total: batchResult.totalFiles,
          completed: batchResult.successfulFiles,
          failed: batchResult.failedFiles,
          results: batchResult.results
        })
      } else {
        // All files failed
        setFiles(prev => prev.map(f => ({
          ...f,
          status: 'error',
          progress: 0,
          error: batchResult.error || 'Batch processing failed'
        })))

        setBatchResult({
          success: false,
          total: files.length,
          completed: 0,
          failed: files.length,
          results: []
        })
      }

    } catch (error) {
      console.error('Batch processing error:', error)
      
      // Update all files to error status
      setFiles(prev => prev.map(f => ({
        ...f,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })))

      setBatchResult({
        success: false,
        total: files.length,
        completed: 0,
        failed: files.length,
        results: []
      })
    }

    setIsProcessing(false)
    setProcessingStatus('')
  }

  const clearAll = () => {
    if (isProcessing) return
    setFiles([])
    setBatchResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusIcon = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'waiting': return '⏳'
      case 'processing': return '🔄'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '📁'
    }
  }

  const getStatusColor = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'waiting': return 'text-gray-700 bg-gray-100 border-gray-300'
      case 'processing': return 'text-blue-700 bg-blue-100 border-blue-300'
      case 'completed': return 'text-green-700 bg-green-100 border-green-300'
      case 'error': return 'text-red-700 bg-red-100 border-red-300'
      default: return 'text-gray-700 bg-gray-100 border-gray-300'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-800 text-white p-6 rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Batch Audio Processing</h2>
              <p className="text-green-100">Process multiple 112 emergency call recordings simultaneously</p>
            </div>
          </div>
          {files.length > 0 && (
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <div className="text-sm font-medium">Files Queued</div>
              <div className="text-2xl font-bold">{files.length}</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 bg-white overflow-y-auto">
        {/* Instructions Banner */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Batch Processing Guidelines</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Upload multiple emergency call recordings for efficient bulk processing. Each file will be processed independently with individual status tracking. Recommended batch size: 10-50 files for optimal performance.</p>
              </div>
            </div>
        </div>
      </div>

      {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div 
            className={`p-12 text-center transition-all ${
          isDragOver 
                ? 'border-green-500 bg-green-50 scale-105' 
                : 'hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.wav,.mp3,.m4a"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isProcessing}
        />
            <div className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragOver ? 'Drop Multiple Audio Files Here' : 'Select Multiple Audio Files'}
                </p>
                <p className="text-gray-600 mb-4">
                  Drag & drop files here or click to browse • Supports batch upload of emergency call recordings
                </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
                  className="inline-flex items-center px-6 py-3 border border-green-600 text-green-600 font-medium rounded-lg hover:bg-green-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {files.length > 0 ? 'Add More Files' : 'Choose Multiple Audio Files'}
        </button>
                <div className="mt-4 text-sm text-gray-500">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      WAV, MP3, M4A formats
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Max 50MB per file
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Bulk processing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>

        {/* Processing Status */}
        {isProcessing && processingStatus && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <div>
                <div className="font-semibold text-blue-900">Processing in Progress</div>
                <div className="text-blue-700 text-sm">{processingStatus}</div>
              </div>
            </div>
          </div>
        )}

      {/* File List */}
      {files.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Processing Queue ({files.length} files)
            </h3>
              <div className="flex gap-3">
              <button
                onClick={clearAll}
                disabled={isProcessing}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={processBatch}
                disabled={isProcessing || files.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
            </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Batch Processing
          </div>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {files.map((fileItem, index) => (
              <div
                key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{getStatusIcon(fileItem.status)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                        {fileItem.file.name}
                      </div>
                          <div className="text-sm text-gray-600">
                        {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                      {fileItem.error && (
                            <div className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded border border-red-200">
                              <strong>Error:</strong> {fileItem.error}
                        </div>
                      )}
                      {fileItem.ticketId && (
                            <div className="text-sm text-green-600 mt-1 bg-green-50 p-2 rounded border border-green-200">
                              <strong>✅ Ticket Created:</strong> {fileItem.ticketId.substring(0, 12)}...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {fileItem.status === 'processing' && (
                        <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300 animate-pulse"
                          style={{ width: '75%' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(fileItem.status)}`}>
                    {fileItem.status.toUpperCase()}
                  </span>
                  {!isProcessing && fileItem.status === 'waiting' && (
                    <button
                      onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove file"
                    >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
              </div>
          </div>
        </div>
      )}

      {/* Batch Processing Results */}
      {batchResult && (
          <div className="space-y-6">
            {/* Summary Statistics */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 002 2h2a2 2 0 012-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Batch Processing Summary
          </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-gray-900">{batchResult.total}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Files</div>
            </div>
                <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                  <div className="text-3xl font-bold text-green-600">{batchResult.completed}</div>
                  <div className="text-sm text-green-600 font-medium">Completed</div>
            </div>
                <div className="bg-white p-4 rounded-lg border border-red-200 text-center">
                  <div className="text-3xl font-bold text-red-600">{batchResult.failed}</div>
                  <div className="text-sm text-red-600 font-medium">Failed</div>
            </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                {Math.round((batchResult.completed / batchResult.total) * 100)}%
              </div>
                  <div className="text-sm text-blue-600 font-medium">Success Rate</div>
            </div>
          </div>

              <div className="flex gap-3">
            <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Processed Tickets
            </button>
            <button
              onClick={clearAll}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Start New Batch
            </button>
          </div>
        </div>

            {/* Detailed Processing Results */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                File Processing Details
              </h3>
              
              {files.filter(f => f.status === 'completed' || f.status === 'error').map((fileItem, index) => {
                const result = batchResult.results.find((r: any) => r.filename === fileItem.file.name)
                
                return (
                  <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className={`px-6 py-4 border-l-4 ${
                      fileItem.status === 'completed' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            {fileItem.status === 'completed' ? (
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{fileItem.file.name}</span>
                            <div className="text-sm text-gray-600">
                              {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB • {fileItem.status === 'completed' ? 'Successfully Processed' : 'Processing Failed'}
                            </div>
                          </div>
                        </div>
                        {fileItem.error && (
                          <span className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded">{fileItem.error}</span>
                        )}
                      </div>
                    </div>

                    {/* Processing Pipeline Steps */}
                    {result && result.ticket && (
                      <div className="p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Processing Pipeline
                        </h4>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="font-medium text-gray-900">AI Audio Analysis</span>
                            </div>
                            <span className="text-sm text-green-600 font-medium">Completed</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="font-medium text-gray-900">Location Geocoding</span>
                            </div>
                            <span className="text-sm text-green-600 font-medium">Completed</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-3">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="font-medium text-gray-900">Database Storage</span>
                            </div>
                            <span className="text-sm text-green-600 font-medium">Completed</span>
                          </div>
                        </div>

                        {/* Generated Ticket Details */}
                        <div>
                          <h5 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            Generated Emergency Ticket
                          </h5>
                          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Caller Name:</span>{' '}
                                <span className="text-gray-900">{result.ticket.caller_name}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Phone Number:</span>{' '}
                                <span className="text-gray-900">{result.ticket.caller_phone}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Crime Type:</span>{' '}
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                  {result.ticket.crime_type}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Subtype:</span>{' '}
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                  {result.ticket.crime_subtype}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Incident Date:</span>{' '}
                                <span className="text-gray-900">{result.ticket.incident_date}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Incident Time:</span>{' '}
                                <span className="text-gray-900">{result.ticket.incident_time}</span>
                              </div>
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Location:</span>{' '}
                                <span className="text-gray-900">{result.ticket.address_text}</span>
                              </div>
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Incident Description:</span>{' '}
                                <div className="mt-2 p-3 bg-white rounded border text-gray-900">
                                  {result.ticket.description}
                                </div>
                              </div>
                              {result.ticket.transcript && (
                                <div className="md:col-span-2">
                                  <span className="font-medium text-gray-700">Call Transcript:</span>
                                  <div className="mt-2 p-3 bg-white rounded border text-gray-900 font-mono text-xs max-h-32 overflow-y-auto">
                                    {result.ticket.transcript}
                                  </div>
                                </div>
                              )}
                              <div className="md:col-span-2 pt-2 border-t border-gray-300">
                                <span className="font-medium text-gray-700">Ticket ID:</span>{' '}
                                <span className="text-blue-600 font-mono text-sm">{fileItem.ticketId}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 