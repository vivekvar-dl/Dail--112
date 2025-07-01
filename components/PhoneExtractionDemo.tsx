'use client'

import { useState } from 'react'

interface ExtractionResult {
  filename: string
  extractedPhone: string | null
  pattern: string
}

export default function PhoneExtractionDemo() {
  const [testFilename, setTestFilename] = useState('')
  const [result, setResult] = useState<ExtractionResult | null>(null)

  const extractPhoneFromFilename = (fileName: string): { phone: string | null, pattern: string } => {
    // Phone number patterns - same as in the actual service
    const phonePatterns = [
      { pattern: /(\+91[-\s]?)?(91[-\s]?)?([6-9]\d{9})/g, name: "Indian mobile (+91 or 91 prefix)" },
      { pattern: /(\d{10})/g, name: "10-digit number" },
      { pattern: /(\d{3}[-\s]?\d{3}[-\s]?\d{4})/g, name: "XXX-XXX-XXXX format" },
    ]
    
    for (const { pattern, name } of phonePatterns) {
      const match = fileName.match(pattern)
      if (match) {
        const phone = match[0].replace(/[-\s]/g, '') // Remove separators
        return { phone, pattern: name }
      }
    }
    
    return { phone: null, pattern: "No pattern matched" }
  }

  const handleTest = () => {
    const { phone, pattern } = extractPhoneFromFilename(testFilename)
    setResult({
      filename: testFilename,
      extractedPhone: phone,
      pattern: pattern
    })
  }

  const exampleFilenames = [
    "9876543210_emergency.mp3",
    "+91-9988776655_call.wav",
    "call_91-9123456789.mp3",
    "emergency_123-456-7890.wav",
    "theft_report_8765432109.mp3",
    "no_phone_number.wav"
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Phone Number Extraction Demo
      </h3>
      
      <div className="space-y-4">
        {/* Input Section */}
        <div>
          <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-2">
            Test Filename:
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="filename"
              value={testFilename}
              onChange={(e) => setTestFilename(e.target.value)}
              placeholder="Enter filename to test..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleTest}
              disabled={!testFilename.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Extract
            </button>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Extraction Result:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Filename:</span> {result.filename}
              </div>
              <div>
                <span className="font-medium">Extracted Phone:</span> 
                <span className={`ml-2 px-2 py-1 rounded ${result.extractedPhone ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {result.extractedPhone || 'None found'}
                </span>
              </div>
              <div>
                <span className="font-medium">Pattern Used:</span> {result.pattern}
              </div>
            </div>
          </div>
        )}

        {/* Example Section */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Try These Examples:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exampleFilenames.map((filename, index) => (
              <button
                key={index}
                onClick={() => {
                  setTestFilename(filename)
                  const { phone, pattern } = extractPhoneFromFilename(filename)
                  setResult({ filename, extractedPhone: phone, pattern })
                }}
                className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <div className="font-mono text-sm text-gray-800">{filename}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {extractPhoneFromFilename(filename).phone || 'No phone found'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Pattern Information */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Supported Patterns:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><span className="font-mono">+91-XXXXXXXXXX</span> - International format</li>
            <li><span className="font-mono">91-XXXXXXXXXX</span> - Country code format</li>
            <li><span className="font-mono">XXXXXXXXXX</span> - 10-digit mobile number</li>
            <li><span className="font-mono">XXX-XXX-XXXX</span> - Standard format with dashes</li>
          </ul>
          <p className="text-xs text-blue-700 mt-2">
            Indian mobile numbers starting with 6, 7, 8, or 9 are prioritized
          </p>
        </div>
      </div>
    </div>
  )
} 