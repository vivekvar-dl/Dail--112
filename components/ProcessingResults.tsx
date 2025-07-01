'use client'

interface ProcessingResultsProps {
  results: {
    success: boolean
    summary: {
      total_files: number
      successful: number
      failed: number
      total_processing_time_ms: number
    }
    results: Array<{
      success: boolean
      ticket?: any
      error?: string
      emergency_alert?: {
        requires_human_intervention: boolean
        reason: string
        severity: number
        partial_data: any
        caller_phone: string
        timestamp: string
        priority: string
      }
      processing_steps: {
        gpt_analysis: { success: boolean, duration_ms: number, error?: string }
        review_agent: { 
          success: boolean, 
          duration_ms: number, 
          error?: string, 
          improvements?: string[],
          transcript_validation?: { isComplete: boolean, warnings: string[] },
          location_validation?: { isSpecific: boolean, warnings: string[] }
        }
        geocoding: { success: boolean, duration_ms: number, error?: string }
        database: { success: boolean, duration_ms: number, error?: string }
      }
    }>
  }
  onBackToUpload?: () => void
}

export default function ProcessingResults({ results, onBackToUpload }: ProcessingResultsProps) {
  const { summary, results: fileResults } = results

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    } else {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="space-y-6">
      {/* Back to Upload Button */}
      {onBackToUpload && (
        <div className="flex justify-between items-center">
          <button
            onClick={onBackToUpload}
            className="inline-flex items-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Process Another Audio File
          </button>
          <div className="text-sm text-gray-500">
            Processing completed successfully
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Processing Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{summary.total_files}</div>
            <div className="text-sm text-blue-800">Total Files</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
            <div className="text-sm text-green-800">Successful</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <div className="text-sm text-red-800">Failed</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">
              {formatDuration(summary.total_processing_time_ms)}
            </div>
            <div className="text-sm text-gray-800">Total Time</div>
          </div>
        </div>
      </div>

      {/* Individual File Results */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">File Processing Details</h3>
        {fileResults.map((result, index) => (
          <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
            <div className={`px-6 py-4 border-l-4 ${
              result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(result.success)}
                  <span className="font-medium text-gray-900">
                    File {index + 1} - {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {result.error && (
                  <span className="text-sm text-red-600">{result.error}</span>
                )}
              </div>
            </div>

            {/* Processing Steps */}
            <div className="p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Processing Pipeline</h4>
              
              {/* Emergency Alert Display */}
              {result.emergency_alert && result.emergency_alert.requires_human_intervention && (
                <div className="mb-6 p-6 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-bold text-red-800">
                        🚨 EMERGENCY: HUMAN INTERVENTION REQUIRED
                      </h3>
                      <p className="text-sm text-red-700">
                        Priority: {result.emergency_alert.priority} | Severity: {result.emergency_alert.severity}/10
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded border border-red-200">
                    <div className="text-sm font-semibold text-red-800 mb-2">Reason for Human Intervention:</div>
                    <div className="text-red-700 mb-4">{result.emergency_alert.reason}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Caller Phone:</span>{' '}
                        <span className="text-red-600 font-mono">{result.emergency_alert.caller_phone}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Timestamp:</span>{' '}
                        <span className="text-gray-600">{new Date(result.emergency_alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {result.emergency_alert.partial_data && (
                      <div className="mt-4">
                        <div className="text-sm font-semibold text-red-800 mb-2">Partial Data Available:</div>
                        <div className="bg-gray-50 p-3 rounded text-xs text-gray-700 max-h-32 overflow-y-auto">
                          <pre>{JSON.stringify(result.emergency_alert.partial_data, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-sm font-semibold text-yellow-800 mb-1">🚨 IMMEDIATE ACTION REQUIRED:</div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Contact caller immediately to get complete information</li>
                      <li>• Verify exact location for emergency response</li>
                      <li>• Assess severity and dispatch appropriate services</li>
                      <li>• Document all actions taken for follow-up</li>
                    </ul>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {Object.entries(result.processing_steps).map(([step, stepResult]) => {
                  const stepNames: { [key: string]: string } = {
                    gpt_analysis: 'AI Audio Analysis (Gemini 2.5 Flash)',
                    review_agent: 'Review & Validation (Gemini Review Agent)',
                    geocoding: 'Location Geocoding',
                    database: 'Database Storage'
                  }
                  
                  return (
                    <div key={step} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(stepResult.success)}
                        <div>
                          <span className="font-medium text-gray-900">{stepNames[step] || step}</span>
                          {step === 'review_agent' && 'improvements' in stepResult && stepResult.improvements && stepResult.improvements.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {stepResult.improvements.length} improvement(s) made
                            </div>
                          )}
                          {step === 'review_agent' && 'transcript_validation' in stepResult && stepResult.transcript_validation && (
                            <div className={`text-xs mt-1 ${stepResult.transcript_validation.isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                              Transcripts: {stepResult.transcript_validation.isComplete ? '✓ Complete' : '⚠ Needs Review'}
                              {!stepResult.transcript_validation.isComplete && stepResult.transcript_validation.warnings && (
                                <div className="text-xs text-red-600 mt-1">
                                  {stepResult.transcript_validation.warnings.length} warning(s)
                                </div>
                              )}
                            </div>
                          )}
                          {step === 'review_agent' && 'location_validation' in stepResult && stepResult.location_validation && (
                            <div className={`text-xs mt-1 ${stepResult.location_validation.isSpecific ? 'text-green-600' : 'text-red-600'}`}>
                              Location: {stepResult.location_validation.isSpecific ? '✓ Specific' : '⚠ CRITICAL: Generic'}
                              {!stepResult.location_validation.isSpecific && stepResult.location_validation.warnings && (
                                <div className="text-xs text-red-600 mt-1 font-bold">
                                  {stepResult.location_validation.warnings.length} CRITICAL warning(s)
                                </div>
                              )}
                            </div>
                          )}
                          {stepResult.error && (
                            <span className="text-sm text-red-600">({stepResult.error})</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDuration(stepResult.duration_ms)}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Ticket Details */}
              {result.ticket && (
                <div className="mt-6">
                  <h5 className="text-md font-medium text-gray-900 mb-3">Generated Ticket</h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Caller:</span>{' '}
                        <span className="text-gray-900">{result.ticket.caller_name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Phone:</span>{' '}
                        <span className="text-gray-900">{result.ticket.caller_phone}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Crime Type:</span>{' '}
                        <span className="text-gray-900">{result.ticket.crime_type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Subtype:</span>{' '}
                        <span className="text-gray-900">{result.ticket.crime_subtype}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Location:</span>{' '}
                        <span className="text-gray-900">{result.ticket.address_text}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Description:</span>{' '}
                        <span className="text-gray-900">{result.ticket.description}</span>
                      </div>
                      
                      {/* Transcript Validation Details */}
                      {result.processing_steps.review_agent && 'transcript_validation' in result.processing_steps.review_agent && result.processing_steps.review_agent.transcript_validation && (
                        <div className="md:col-span-2">
                          <div className="border-t pt-4 mt-4">
                            <h6 className="font-medium text-gray-700 mb-2">Multilingual Transcript Validation</h6>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className={`p-2 rounded ${result.ticket.raw_transcripts?.['en-IN'] ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <div className="text-xs font-medium text-gray-600">English</div>
                                <div className={`text-xs ${result.ticket.raw_transcripts?.['en-IN'] ? 'text-green-700' : 'text-red-700'}`}>
                                  {result.ticket.raw_transcripts?.['en-IN'] ? '✓ Complete' : '✗ Missing'}
                                </div>
                              </div>
                              <div className={`p-2 rounded ${result.ticket.raw_transcripts?.['te-IN'] ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <div className="text-xs font-medium text-gray-600">Telugu</div>
                                <div className={`text-xs ${result.ticket.raw_transcripts?.['te-IN'] ? 'text-green-700' : 'text-red-700'}`}>
                                  {result.ticket.raw_transcripts?.['te-IN'] ? '✓ Complete' : '✗ Missing'}
                                </div>
                              </div>
                              <div className={`p-2 rounded ${result.ticket.raw_transcripts?.['hi-IN'] ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <div className="text-xs font-medium text-gray-600">Hindi</div>
                                <div className={`text-xs ${result.ticket.raw_transcripts?.['hi-IN'] ? 'text-green-700' : 'text-red-700'}`}>
                                  {result.ticket.raw_transcripts?.['hi-IN'] ? '✓ Complete' : '✗ Missing'}
                                </div>
                              </div>
                            </div>
                            
                            {!result.processing_steps.review_agent.transcript_validation.isComplete && result.processing_steps.review_agent.transcript_validation.warnings && (
                              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                                <div className="text-xs font-medium text-orange-800 mb-1">Validation Warnings:</div>
                                <ul className="text-xs text-orange-700 space-y-1">
                                  {result.processing_steps.review_agent.transcript_validation.warnings.map((warning: string, idx: number) => (
                                    <li key={idx}>• {warning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Critical Location Validation */}
                      {result.processing_steps.review_agent && 'location_validation' in result.processing_steps.review_agent && result.processing_steps.review_agent.location_validation && (
                        <div className="md:col-span-2">
                          <div className="border-t pt-4 mt-4">
                            <h6 className="font-medium text-gray-700 mb-2">Location Validation</h6>
                            <div className={`p-3 rounded ${result.processing_steps.review_agent.location_validation.isSpecific ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                              <div className={`text-sm font-medium ${result.processing_steps.review_agent.location_validation.isSpecific ? 'text-green-800' : 'text-red-800'}`}>
                                Location Status: {result.processing_steps.review_agent.location_validation.isSpecific ? '✓ Specific Location Identified' : '⚠ CRITICAL: Generic Location'}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Address: {result.ticket.address_text}
                              </div>
                              
                              {!result.processing_steps.review_agent.location_validation.isSpecific && result.processing_steps.review_agent.location_validation.warnings && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                  <div className="text-xs font-medium text-red-800 mb-1">🚨 CRITICAL LOCATION WARNINGS:</div>
                                  <ul className="text-xs text-red-700 space-y-1">
                                    {result.processing_steps.review_agent.location_validation.warnings.map((warning: string, idx: number) => (
                                      <li key={idx} className="font-medium">• {warning}</li>
                                    ))}
                                  </ul>
                                  <div className="text-xs text-red-600 mt-2 font-medium">
                                    ⚠️ This location may not be specific enough for emergency response!
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {result.ticket.transcript && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700">Transcript:</span>
                          <div className="mt-2 p-3 bg-white rounded border text-gray-900">
                            {result.ticket.transcript}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 