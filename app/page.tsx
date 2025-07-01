'use client'

import { useState } from 'react'
import AudioUpload from '@/components/AudioUpload'
import BatchAudioUpload from '@/components/BatchAudioUpload'
import TicketsWithMap from '@/components/TicketsWithMap'
import ProcessingResults from '@/components/ProcessingResults'
import SystemDemo from '@/components/SystemDemo'
import GoogleMapsProvider from '@/components/GoogleMapsProvider'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'demo' | 'upload' | 'batch' | 'tickets'>('demo')
  const [processingResults, setProcessingResults] = useState<any>(null)

  return (
    <div className="full-height bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold">Dial 112 Analyzer</h1>
              </div>
              <div className="ml-4 text-sm text-blue-200 hidden md:block">
                Andhra Pradesh Police - Emergency Call Processing System
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm hidden lg:block">Automated Audio Extraction Pipeline</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 md:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('demo')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'demo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              System Demo
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Single Audio
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'batch'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Batch Processing
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Processed Tickets
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content - Full Width and Height */}
      <main className="w-full px-2 sm:px-4 lg:px-6 py-4 md:py-6">
        {activeTab === 'demo' && (
          <div className="h-full">
            <SystemDemo />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="h-full flex flex-col space-y-6">
            <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
              <AudioUpload onProcessingComplete={setProcessingResults} />
            </div>
            
            {processingResults && (
              <div className="bg-white rounded-lg shadow-lg">
                <ProcessingResults 
                  results={processingResults} 
                  onBackToUpload={() => setProcessingResults(null)}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
            <BatchAudioUpload />
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
            <GoogleMapsProvider>
              <TicketsWithMap />
            </GoogleMapsProvider>
          </div>
        )}
      </main>

      {/* Footer - Only at the end of the page */}
      <footer className="bg-gray-800 text-white mt-8">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <div>
              <p className="text-sm text-center md:text-left">
                © 2024 Andhra Pradesh Police Department. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-400 text-center">
                Powered by AI-driven emergency response technology
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
