'use client'

import { useState } from 'react'

export default function CoordinateDebugger() {
  const [address, setAddress] = useState('Gandhi Road, Vijayawada')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testGeocode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-geocoding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const testTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tickets?limit=5')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Coordinate Debugger
      </h3>
      
      <div className="space-y-4">
        {/* Address Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Address:
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter address to test..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={testGeocode}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Testing...' : 'Test Geocoding'}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAddress('Gandhi Road, Vijayawada')}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            Gandhi Road, Vijayawada
          </button>
          <button
            onClick={() => setAddress('Clock Tower, Guntur')}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            Clock Tower, Guntur
          </button>
          <button
            onClick={() => setAddress('Beach Road, Visakhapatnam')}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            Beach Road, Visakhapatnam
          </button>
          <button
            onClick={() => setAddress('Location not specified')}
            className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-sm hover:bg-yellow-300"
          >
            No Address (should return 0,0)
          </button>
          <button
            onClick={testTickets}
            disabled={loading}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
          >
            Test Tickets
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Result:</h4>
            
            {result.success && result.result?.selected && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Address:</span> {result.result.selected.display_name}
                </div>
                <div>
                  <span className="font-medium">Coordinates:</span> 
                  <span className="ml-2 font-mono bg-green-100 px-2 py-1 rounded">
                    {result.result.selected.lat}, {result.result.selected.lon}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Confidence:</span> {result.result.confidence}
                </div>
                <div>
                  <span className="font-medium">Reasoning:</span> {result.result.reasoning}
                </div>
              </div>
            )}

            {result.success && result.tickets && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Tickets Found:</span> {result.tickets.length}
                </div>
                {result.tickets.slice(0, 3).map((ticket: any, index: number) => (
                  <div key={index} className="border-l-2 border-blue-300 pl-3">
                    <div><span className="font-medium">ID:</span> {ticket.id}</div>
                    <div><span className="font-medium">Address:</span> {ticket.address_text}</div>
                    <div>
                      <span className="font-medium">Coordinates:</span> 
                      <span className={`ml-2 font-mono px-2 py-1 rounded ${
                        ticket.latitude === 0 && ticket.longitude === 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {ticket.latitude}, {ticket.longitude}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!result.success && (
              <div className="text-red-600">
                <span className="font-medium">Error:</span> {result.error}
              </div>
            )}

            {/* Raw JSON */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Show Raw JSON
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
} 