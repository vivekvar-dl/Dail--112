'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface AudioUploadProps {
  onProcessingComplete: (results: any) => void
}

export default function AudioUpload({ onProcessingComplete }: AudioUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const audioFiles = acceptedFiles.filter(file => 
      file.type.startsWith('audio/') || 
      file.name.endsWith('.mp3') || 
      file.name.endsWith('.wav')
    )
    setFiles(prevFiles => [...prevFiles, ...audioFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav'],
    },
    multiple: true
  })

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const processFiles = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setUploadProgress('Uploading files...')

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('audio', file)
      })

      setUploadProgress('Processing audio files...')
      
      const response = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const results = await response.json()
      onProcessingComplete(results)
      setFiles([]) // Clear files after successful processing
      setUploadProgress('Processing completed!')
      
      setTimeout(() => setUploadProgress(''), 3000)
    } catch (error) {
      console.error('Error processing files:', error)
      setUploadProgress('Error processing files. Please try again.')
      setTimeout(() => setUploadProgress(''), 5000)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white p-6 rounded-t-lg flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Single Audio File Processing</h2>
            <p className="text-blue-100">Andhra Pradesh Police - Emergency Call Analysis System</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 bg-white overflow-y-auto">
        {/* Instructions Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Processing Instructions</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Upload 112 emergency call recordings for automated analysis. The system will transcribe audio, extract caller information, classify incidents, and resolve locations to create structured tickets.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
          <div
            {...getRootProps()}
            className={`p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 scale-105'
                : 'hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragActive ? 'Drop Audio Files Here' : 'Upload Emergency Call Recordings'}
                </p>
                <p className="text-gray-600 mb-4">
                  Drag and drop audio files here, or click to select files from your computer
                </p>
                <div className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Select Audio Files
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <div className="flex items-center justify-center space-x-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      MP3, WAV formats
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Maximum 10MB per file
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Secure processing
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Selected Files ({files.length})
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={isProcessing}
                      title="Remove file"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Processing Section */}
        {files.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <button
                onClick={processFiles}
                disabled={isProcessing}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Audio Files...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Process {files.length} File{files.length > 1 ? 's' : ''}
                  </div>
                )}
              </button>
              
              {uploadProgress && (
                <div className={`mt-4 p-4 rounded-lg text-center font-medium ${
                  uploadProgress.includes('Error') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : uploadProgress.includes('completed')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {uploadProgress.includes('Error') && (
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {uploadProgress.includes('completed') && (
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {uploadProgress}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing Pipeline Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">Automated Processing Pipeline</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-blue-800">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">1</div>
                    <span>Multilingual speech transcription (Telugu, Hindi, English)</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">2</div>
                    <span>AI-powered caller information and incident data extraction</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-blue-800">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">3</div>
                    <span>Smart geocoding and location verification with mapping APIs</span>
                  </div>
                  <div className="flex items-center text-sm text-blue-800">
                    <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">4</div>
                    <span>Structured incident ticket creation and secure database storage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 