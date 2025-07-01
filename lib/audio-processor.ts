import { GeocodingService, GeocodeResult } from './geocoding-service'
import { Call112Ticket, getSeverity } from './supabase'
import { supabaseAdmin } from './supabase'
import { GeminiAudioService, GeminiReviewAgent } from './gemini-services';

export interface ProcessingResult {
  success: boolean
  ticket?: Call112Ticket
  error?: string
  processing_steps: {
    gpt_analysis: { success: boolean, duration_ms: number, error?: string }
    review_agent: { 
      success: boolean, 
      duration_ms: number, 
      error?: string, 
      improvements?: string[],
      transcript_validation?: any,
      location_validation?: any
    }
    geocoding: { success: boolean, duration_ms: number, error?: string }
    database: { success: boolean, duration_ms: number, error?: string }
  }
  emergency_alert?: {
    requires_human_intervention: boolean
    reason: string
    severity: number
    partial_data: any
    caller_phone: string
    timestamp: string
    priority: string
  }
}

export class AudioProcessor {
  static async processAudioFile(
    audioBuffer: Buffer, 
    fileName: string,
    phoneNumber: string
  ): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      success: false,
      processing_steps: {
        gpt_analysis: { success: false, duration_ms: 0 },
        review_agent: { success: false, duration_ms: 0 },
        geocoding: { success: false, duration_ms: 0 },
        database: { success: false, duration_ms: 0 }
      }
    }

    try {
      // Step 1: AI Audio Analysis with Gemini 2.5 Flash
      console.log('Starting AI audio analysis with Gemini 2.5 Flash...')
      const gptStart = Date.now()
      
      const audioAnalysis = await GeminiAudioService.processAudio(audioBuffer, fileName)
      
      result.processing_steps.gpt_analysis = {
        success: true,
        duration_ms: Date.now() - gptStart
      }

      // Step 2: Emergency Call Validation - Check for incomplete data
      const emergencyValidation = this.validateEmergencyCallData(audioAnalysis, fileName)
      
      if (emergencyValidation.requiresHumanIntervention) {
        console.log('🚨 EMERGENCY: Call requires human intervention - insufficient data for emergency response')
        result.success = false
        result.error = `EMERGENCY CALL INCOMPLETE: ${emergencyValidation.reason}. HUMAN INTERVENTION REQUIRED IMMEDIATELY.`
        result.emergency_alert = {
          requires_human_intervention: true,
          reason: emergencyValidation.reason,
          severity: emergencyValidation.severity,
          partial_data: audioAnalysis,
          caller_phone: phoneNumber,
          timestamp: new Date().toISOString(),
          priority: 'CRITICAL'
        }
        return result
      }

      // Step 3: Gemini Review Agent (2.5 Pro equivalent)
      console.log('Starting Gemini Review Agent validation...')
      const reviewStart = Date.now()
      
      let reviewedData: any
      let transcriptValidation: any = null
      let locationValidation: any = null
      try {
        reviewedData = await GeminiReviewAgent.reviewAndImproveData(audioAnalysis, audioBuffer, fileName)
        
        // Get transcript validation results
        transcriptValidation = GeminiReviewAgent.validateTranscriptCompleteness(reviewedData)
        
        // Get location validation results
        locationValidation = GeminiReviewAgent.validateLocationSpecificity(reviewedData)
        
        result.processing_steps.review_agent = {
          success: true,
          duration_ms: Date.now() - reviewStart,
          improvements: GeminiReviewAgent.detectChanges(audioAnalysis, reviewedData),
          transcript_validation: transcriptValidation,
          location_validation: locationValidation
        }
        console.log('Review agent completed:', reviewedData)
        console.log('Transcript validation:', transcriptValidation)
        console.log('Location validation:', locationValidation)
      } catch (error) {
        result.processing_steps.review_agent = {
          success: false,
          duration_ms: Date.now() - reviewStart,
          error: error instanceof Error ? error.message : 'Unknown review agent error'
        }
        console.warn('Review agent failed, using original extracted data')
        reviewedData = audioAnalysis // Fallback to original data
      }

      // Use the reviewed/improved data for further processing
      const finalData = reviewedData

      // Log review agent approval status
      const reviewApproved = result.processing_steps.review_agent.success && 
                            (!transcriptValidation || transcriptValidation.isComplete) &&
                            (!locationValidation || locationValidation.isSpecific)
      
      console.log(`Review Agent Approval Status: ${reviewApproved ? 'APPROVED' : 'NEEDS REVIEW'}`)
      if (transcriptValidation && !transcriptValidation.isComplete) {
        console.warn('Transcript validation warnings:', transcriptValidation.warnings)
      }
      if (locationValidation && !locationValidation.isSpecific) {
        console.warn('CRITICAL: Location validation warnings:', locationValidation.warnings)
      }

      // Parse severity level from reviewed data
      const severity = parseInt(finalData.severity_level) || 5
      
      // Get crime type and subtype from reviewed data
      const crimeType = finalData.crime_type || 'Emergency'
      const crimeSubtype = finalData.crime_subtype || 'General Emergency'
      
      // Get additional incident details from reviewed data
      const emergencyServicesNeeded = finalData.emergency_services_needed || 'Police'
      const witnessesPresent = finalData.witnesses_present === 'Yes'
      const suspectsInvolved = finalData.suspects_involved || 'None'
      const victimsInvolved = finalData.victims_involved || 'None'
      const weaponsInvolved = finalData.weapons_involved === 'Yes'
      const vehicleInvolved = finalData.vehicle_involved === 'Yes'

      // Geocode the address from reviewed data
      console.log('Starting geocoding...')
      const geocodingStart = Date.now()
      
      let geocodeResult: GeocodeResult
      try {
        // Only geocode if we have a specific address from the audio transcript
        const addressFromAudio = finalData.address_text && finalData.address_text.trim()
        
        if (!addressFromAudio || 
            addressFromAudio.toLowerCase().includes('location not specified') ||
            addressFromAudio.toLowerCase().includes('not mentioned') ||
            addressFromAudio.toLowerCase().includes('unclear')) {
          
          console.log('No specific address found in audio transcript')
          geocodeResult = {
            candidates: [],
            selected: null,
            confidence: 0,
            reasoning: 'No specific address mentioned in audio transcript'
          }
        } else {
          console.log('Geocoding address from audio transcript:', addressFromAudio)
          geocodeResult = await GeocodingService.interactiveGeocode(addressFromAudio)
        }
        result.processing_steps.geocoding = {
          success: true,
          duration_ms: Date.now() - geocodingStart
        }
        console.log('Geocoding completed:', {
          address: finalData.address_text,
          candidatesFound: geocodeResult.candidates.length,
          selected: geocodeResult.selected,
          confidence: geocodeResult.confidence,
          reasoning: geocodeResult.reasoning
        })
      } catch (error) {
        result.processing_steps.geocoding = {
          success: false,
          duration_ms: Date.now() - geocodingStart,
          error: error instanceof Error ? error.message : 'Unknown geocoding error'
        }
        throw error
      }

      // NEW STEP: Upload audio file to Supabase Storage to get a playable URL
      // Note: This requires a Supabase bucket named 'audio-evidence' with public read access.
      let publicUrl = fileName // Default to original filename if upload fails
      const fileMimeType = fileName.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav'

      try {
        const storagePath = `public/${Date.now()}_${fileName}`
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('audio-evidence')
          .upload(storagePath, audioBuffer, {
            contentType: fileMimeType,
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Supabase Storage error: ${uploadError.message}`)
        }

        const { data: urlData } = supabaseAdmin.storage
          .from('audio-evidence')
          .getPublicUrl(storagePath)
        
        publicUrl = urlData.publicUrl
        console.log('Audio file successfully uploaded to:', publicUrl)
      } catch (storageError) {
        console.error('Could not upload audio to Supabase Storage.', storageError)
        // Processing will continue, but audio_file_url will be the original filename.
      }

      // Step 4: Create Complete Ticket using reviewed data
      const now = new Date()
      const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5) // HH:MM
      
      // Fix time format - ensure it's always HH:MM
      let formattedTime = finalData.incident_time || currentTime
      if (formattedTime === 'CURRENT_TIME' || formattedTime === 'UNCLEAR' || formattedTime === 'NOT_MENTIONED') {
        formattedTime = currentTime
      }
      // Validate time format (HH:MM)
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formattedTime)) {
        formattedTime = currentTime
      }
      
      // Fix date format
      let formattedDate = finalData.incident_date || currentDate
      if (formattedDate === 'CURRENT_DATE' || formattedDate === 'UNCLEAR' || formattedDate === 'NOT_MENTIONED') {
        formattedDate = currentDate
      }
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
        formattedDate = currentDate
      }

      // Extract coordinates - only use actual geocoded results, 0 means no location found
      const latitude = geocodeResult.selected ? geocodeResult.selected.geometry.location.lat : 0;
      const longitude = geocodeResult.selected ? geocodeResult.selected.geometry.location.lng : 0;
      const hasValidCoordinates = !!(geocodeResult.selected && typeof latitude === 'number' && !isNaN(latitude) && typeof longitude === 'number' && !isNaN(longitude) && latitude !== 0 && longitude !== 0);

      if (!geocodeResult.selected || typeof latitude !== 'number' || isNaN(latitude) || typeof longitude !== 'number' || isNaN(longitude)) {
        console.warn('Geocoding failed for address, as expected. Setting coordinates to 0.');
      }
      
      // Enhanced location information for emergency response
      const geocodedAddress = geocodeResult.selected?.formatted_address || 'Location not geocoded';
      const locationType = geocodeResult.selected?.geometry.location_type || 'UNKNOWN';
      const locationTypes = geocodeResult.selected?.types || [];
      const locationConfidence = geocodeResult.confidence || 0;
      
      console.log('Enhanced geocoding results:', {
        addressFromAudio: finalData.address_text,
        geocodedAddress,
        locationType,
        locationTypes,
        confidence: locationConfidence,
        latitude,
        longitude,
        hasValidCoordinates,
        reasoning: geocodeResult.reasoning
      })
      
      console.log('Final coordinates for ticket:', {
        latitude,
        longitude,
        hasValidCoordinates,
        addressFromAudio: finalData.address_text,
        geocodedAddress,
        locationType,
        confidence: locationConfidence,
        selected: geocodeResult.selected,
        rawLat: geocodeResult.selected?.geometry?.location?.lat,
        rawLon: geocodeResult.selected?.geometry?.location?.lng,
        reasoning: geocodeResult.reasoning
      })

      // Get emergency response recommendations based on crime type and severity
      const emergencyRecommendations = this.getEmergencyResponseRecommendations(crimeType, severity)

      const ticket: Call112Ticket = {
        caller_name: finalData.caller_name || 'UNKNOWN',
        caller_phone:
          (finalData.caller_phone && finalData.caller_phone !== 'Not Provided')
            ? finalData.caller_phone
            : (phoneNumber || 'Not Provided'),
        caller_gender: finalData.caller_gender || undefined,
        incident_date: formattedDate,
        incident_time: formattedTime,
        crime_type: crimeType,
        crime_subtype: crimeSubtype,
        description: finalData.description || 'No description provided',
        address_text: finalData.address_text || 'Location not specified',
        verified_address: hasValidCoordinates ? geocodedAddress : finalData.address_text || 'Location not specified',
        severity: severity,
        latitude: latitude,
        longitude: longitude,
        evidence_type: 'Voice',
        review_status: 'Pending',
        emergency_services_needed: emergencyServicesNeeded,
        witnesses_present: witnessesPresent,
        suspects_involved: suspectsInvolved,
        victims_involved: victimsInvolved,
        weapons_involved: weaponsInvolved,
        vehicle_involved: vehicleInvolved,
        transcript: finalData.transcript || finalData.full_english_transcript || '',
        raw_transcripts: finalData.raw_transcripts || {
          'en-IN': finalData.full_english_transcript || '',
          'te-IN': finalData.full_telugu_transcript || '',
          'hi-IN': finalData.full_hindi_transcript || '',
        },
        audio_file_url: publicUrl,
        emergency_recommendations: emergencyRecommendations
      }

      // Step 5: Save to Database
      console.log('Saving to database...')
      const databaseStart = Date.now()
      
      try {
        const { data: savedTicket, error: dbError } = await supabaseAdmin
          .from('call_112_tickets')
          .insert([ticket])
          .select()
          .single()

        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`)
        }

        result.processing_steps.database = {
          success: true,
          duration_ms: Date.now() - databaseStart
        }

        result.success = true
        result.ticket = savedTicket

        console.log('Audio processing completed successfully with Gemini Review Agent')
        return result

      } catch (error) {
        result.processing_steps.database = {
          success: false,
          duration_ms: Date.now() - databaseStart,
          error: error instanceof Error ? error.message : 'Unknown database error'
        }
        throw error
      }

    } catch (error) {
      console.error('Audio processing failed:', error)
      result.error = error instanceof Error ? error.message : 'Unknown processing error'
      return result
    }
  }

  // Validate emergency call data completeness and determine if human intervention is required
  private static validateEmergencyCallData(extractedData: any, fileName: string): {
    requiresHumanIntervention: boolean
    reason: string
    severity: number
  } {
    const validation = {
      requiresHumanIntervention: false,
      reason: '',
      severity: 0
    }

    // Check for critical missing information
    const missingCriticalInfo: string[] = []
    
    // 1. Check caller information
    if (!extractedData.caller_name || extractedData.caller_name === 'UNKNOWN' || extractedData.caller_name === 'Not Provided') {
      missingCriticalInfo.push('Caller name')
    }
    
    // 2. Check location information (most critical for emergency response)
    if (!extractedData.address_text || 
        extractedData.address_text === 'Location not specified' ||
        extractedData.address_text === 'Not mentioned' ||
        extractedData.address_text === 'Unclear' ||
        extractedData.address_text.length < 10) {
      missingCriticalInfo.push('Specific location')
    }
    
    // 3. Check incident type
    if (!extractedData.crime_type || extractedData.crime_type === 'UNKNOWN') {
      missingCriticalInfo.push('Incident type')
    }
    
    // 4. Check severity level
    if (!extractedData.severity_level || extractedData.severity_level === 'UNKNOWN') {
      missingCriticalInfo.push('Severity assessment')
    }
    
    // 5. Check if call seems incomplete (short transcript)
    const transcriptLength = extractedData.transcript?.length || 0
    if (transcriptLength < 50) {
      missingCriticalInfo.push('Call appears to be cut short')
    }
    
    // 6. Check for emergency keywords that indicate urgent situations
    const emergencyKeywords = ['dying', 'dead', 'killing', 'murder', 'accident', 'fire', 'bleeding', 'unconscious', 'heart attack', 'stroke']
    const hasEmergencyKeywords = emergencyKeywords.some(keyword => 
      extractedData.transcript?.toLowerCase().includes(keyword) ||
      extractedData.description?.toLowerCase().includes(keyword)
    )
    
    // Determine if human intervention is required
    if (missingCriticalInfo.length >= 3) {
      validation.requiresHumanIntervention = true
      validation.reason = `Critical information missing: ${missingCriticalInfo.join(', ')}. Emergency response cannot be initiated safely.`
      validation.severity = 10
    } else if (missingCriticalInfo.includes('Specific location') && hasEmergencyKeywords) {
      validation.requiresHumanIntervention = true
      validation.reason = `EMERGENCY SITUATION DETECTED but location unclear. Human intervention required to get exact location for emergency response.`
      validation.severity = 9
    } else if (missingCriticalInfo.includes('Call appears to be cut short') && hasEmergencyKeywords) {
      validation.requiresHumanIntervention = true
      validation.reason = `Emergency call was cut short. Human intervention required to contact caller and get complete information.`
      validation.severity = 8
    } else if (missingCriticalInfo.length >= 2) {
      validation.requiresHumanIntervention = true
      validation.reason = `Multiple data points missing: ${missingCriticalInfo.join(', ')}. Human verification required.`
      validation.severity = 7
    }
    
    // Log validation results
    if (validation.requiresHumanIntervention) {
      console.log('🚨 EMERGENCY VALIDATION FAILED:', {
        reason: validation.reason,
        severity: validation.severity,
        missingInfo: missingCriticalInfo,
        hasEmergencyKeywords,
        transcriptLength
      })
    } else {
      console.log('✅ Emergency call validation passed - sufficient data for processing')
    }
    
    return validation
  }

  // Get emergency response recommendations based on incident type and severity
  static getEmergencyResponseRecommendations(crimeType: string, severity: number): string[] {
    const recommendations: string[] = []

    // Always include police for any incident
    recommendations.push('Police')

    // Add specific services based on crime type
    switch (crimeType) {
      case 'Accident':
        recommendations.push('Ambulance', 'Fire (if vehicle fire)')
        break
      case 'Body Offence':
        if (severity >= 6) recommendations.push('Ambulance')
        break
      case 'Robbery':
        if (severity >= 7) recommendations.push('Ambulance')
        break
      case 'Offence Against Women':
        recommendations.push('Women Helpline')
        break
      case 'Missing':
        if (crimeType.includes('Child')) recommendations.push('Child Helpline')
        break
      case 'Disaster':
        recommendations.push('Disaster Management', 'Fire', 'Ambulance')
        break
      default:
        if (severity >= 8) recommendations.push('Ambulance')
    }

    return recommendations
  }

  static async batchProcessAudioFiles(audioFiles: { buffer: Buffer, fileName: string, phoneNumber: string }[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = []
    
    for (const audioFile of audioFiles) {
      const result: ProcessingResult = {
        success: false,
        processing_steps: {
          gpt_analysis: { success: false, duration_ms: 0 },
          review_agent: { success: false, duration_ms: 0 },
          geocoding: { success: false, duration_ms: 0 },
          database: { success: false, duration_ms: 0 }
        }
      }
      
      try {
        const processedResult = await this.processAudioFile(
          audioFile.buffer,
          audioFile.fileName,
          audioFile.phoneNumber
        )
        results.push(processedResult)
      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown batch processing error'
        results.push(result)
      }
    }
    
    return results
  }
} 