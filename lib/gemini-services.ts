import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
const reviewModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Using same model for now, can be changed to Pro

export class GeminiAudioService {
  static async processAudio(audioBuffer: Buffer, fileName: string): Promise<any> {
    console.log("Starting audio processing with Gemini 2.5 Flash...");

    try {
      const audioMimeType = fileName.endsWith('.mp3') ? 'audio/mp3' : 'audio/wav';
      const audioBase64 = audioBuffer.toString('base64');

      const audioPart = {
        inlineData: {
          data: audioBase64,
          mimeType: audioMimeType,
        },
      };

      const prompt = `You are an expert AI assistant for the Andhra Pradesh Police 112 emergency call analysis system. Your task is to process the provided audio file of an emergency call. The audio may be in English, Telugu, Hindi, or a mix of these.

CRITICAL LOCATION IDENTIFICATION REQUIREMENT:
This is a REAL-TIME EMERGENCY SYSTEM where people's lives depend on accurate location identification. You must extract the MOST SPECIFIC location details possible from the audio:

1. **PRIORITIZE SPECIFIC LOCATIONS:**
   - Street names (e.g., "AC Nagar Road", "Chinna Bazaar Road")
   - Specific place names (e.g., "Atmakur Bus Stand Market", "Stonehouse Pet Market")
   - Canal names (e.g., "Upputeru Canal", "Gorasapani Canal")
   - Landmarks (e.g., "Clock Tower", "Temple", "Bridge")
   - Village names (e.g., "Pata Bitragunta", "Balusumoodi")
   - Mandal names (e.g., "Bogole Mandal")
   - Police station names (e.g., "Bitragunta Station", "Tippa Station")

2. **LOCATION EXTRACTION GUIDELINES:**
   - Extract EVERY specific location detail mentioned
   - Include street numbers, building names, shop names
   - Note distances and directions (e.g., "near", "by", "opposite")
   - Capture local area names and neighborhoods
   - Include any reference points or landmarks

3. **ACCURACY IS CRITICAL:**
   - Wrong locations can cost lives in emergencies
   - Be extremely precise with location details
   - Include all context that helps identify the exact spot
   - Don't generalize or approximate locations

Analyze the audio and return a single, valid JSON object with the following structure. Do not include any text or markdown formatting before or after the JSON object.

JSON STRUCTURE:
{
  "full_english_transcript": "A complete and accurate transcription of the entire conversation, translated into English.",
  "full_telugu_transcript": "A complete and accurate transcription of the entire conversation in Telugu. If no Telugu is present, return an empty string.",
  "full_hindi_transcript": "A complete and accurate transcription of the entire conversation in Hindi. If no Hindi is present, return an empty string.",
  "caller_name": "The caller's name, or 'Unknown' if not mentioned.",
  "caller_phone": "The caller's phone number, or 'Not Provided' if not mentioned.",
  "caller_gender": "The caller's gender ('Male', 'Female', 'Other'), or 'Unknown' if not determinable.",
  "incident_date": "The date of the incident in YYYY-MM-DD format. Use the current date if not specified.",
  "incident_time": "The time of the incident in HH:MM format (24-hour). Use the current time if not specified.",
  "crime_type": "Classify the incident into one of these official categories: Accident, Robbery, Body Offence, Disaster, Offence Against Public, Missing, Offence Against Women, Emergency.",
  "crime_subtype": "Based on the crime_type, classify into a subtype. Examples: Car Accident, Chain Snatching, Assault, Kidnapping, Murder, Attempt to Murder, Flood Disaster, Drunken Misconduct in Public, Missing Child, Eve -Teasing, Domestic Violence, General Emergency.",
  "description": "A concise, one-paragraph summary of the incident in English.",
  "address_text": "The MOST SPECIFIC location of the incident as described by the caller. Include ALL specific details: street names, place names, landmarks, canal names, village names, mandal names, police station names, building names, shop names, distances, directions. This will be used for Google Maps geocoding to find the exact location.",
  "severity_level": "Rate the severity from 1-10 where 1=Low (minor incident), 5=Medium (moderate incident), 8-10=Critical (life-threatening or major incident).",
  "police_station_required": "Yes/No - whether this incident requires immediate police station response.",
  "emergency_services_needed": "List required services: Police, Ambulance, Fire, Rescue, etc.",
  "witnesses_present": "Yes/No - whether witnesses are mentioned or present.",
  "suspects_involved": "Number of suspects mentioned or 'None' if no suspects.",
  "victims_involved": "Number of victims mentioned or 'None' if no victims.",
  "weapons_involved": "Yes/No - whether weapons are mentioned.",
  "vehicle_involved": "Yes/No - whether vehicles are involved in the incident."
}

OFFICIAL CRIME CATEGORIES AND SUBTYPES:
- Accident: Car Accident, Train Accident
- Robbery: Chain Snatching, Vehicle Theft
- Body Offence: Assault, Kidnapping, Murder, Attempt to Murder
- Disaster: Flood Disaster
- Offence Against Public: Drunken Misconduct in Public
- Missing: Missing Child
- Offence Against Women: Eve -Teasing, Domestic Violence
- Emergency: Use 'General Emergency' if no other category fits.

IMPORTANT TRANSCRIPT REQUIREMENTS:
1. ALWAYS provide full_english_transcript - this is the primary transcript
2. ALWAYS provide full_telugu_transcript - even if the audio is not in Telugu, provide a Telugu translation of the English transcript
3. ALWAYS provide full_hindi_transcript - even if the audio is not in Hindi, provide a Hindi translation of the English transcript
4. If the audio is in Telugu or Hindi, provide accurate transcriptions in those languages
5. If the audio is in English, provide Telugu and Hindi translations of the English content

SEVERITY ASSESSMENT GUIDELINES:
- 1-3: Minor incidents (no injuries, property damage only)
- 4-5: Moderate incidents (minor injuries, some property damage)
- 6-7: Serious incidents (injuries, significant property damage)
- 8-10: Critical incidents (life-threatening, major injuries, fatalities)

LOCATION ACCURACY IS CRITICAL FOR EMERGENCY RESPONSE. Extract every specific detail mentioned about the location.

Process the audio now and provide the JSON output. Make sure to fill all transcript fields as described above.`;

      const result = await model.generateContent([prompt, audioPart]);
      const response = result.response;
      const responseText = response.text();

      // Clean the response to ensure it's valid JSON
      const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      console.log("Received raw response from Gemini:", jsonString);
      
      const extractedData = JSON.parse(jsonString);

      // Add the separate transcript fields for compatibility
      extractedData.transcript = extractedData.full_english_transcript;
      extractedData.raw_transcripts = {
        'en-IN': extractedData.full_english_transcript || '',
        'te-IN': extractedData.full_telugu_transcript || '',
        'hi-IN': extractedData.full_hindi_transcript || '',
      };

      console.log("Successfully processed audio with Gemini.");
      return extractedData;

    } catch (error) {
      console.error("Error processing audio with Gemini:", error);
      throw new Error("Failed to process audio using Gemini AI service.");
    }
  }
}

export class GeminiReviewAgent {
  static async reviewAndImproveData(
    extractedData: any, 
    audioBuffer: Buffer, 
    fileName: string
  ): Promise<any> {
    console.log("Starting review and improvement with Gemini Review Agent...");

    try {
      const audioMimeType = fileName.endsWith('.mp3') ? 'audio/mp3' : 'audio/wav';
      const audioBase64 = audioBuffer.toString('base64');

      const audioPart = {
        inlineData: {
          data: audioBase64,
          mimeType: audioMimeType,
        },
      };

      const reviewPrompt = `You are an expert AI review agent for the Andhra Pradesh Police 112 emergency call analysis system. Your task is to review, validate, and improve the data extracted from an emergency call audio file.

CRITICAL LOCATION ACCURACY REQUIREMENT:
This is a REAL-TIME EMERGENCY SYSTEM where people's lives depend on accurate location identification. You must ensure the MOST SPECIFIC location details are extracted and validated:

1. **LOCATION VALIDATION IS CRITICAL:**
   - Listen carefully for ALL specific location details mentioned
   - Street names, place names, canal names, landmarks
   - Village names, mandal names, police station names
   - Building names, shop names, reference points
   - Distances and directions (near, by, opposite, etc.)

2. **ACCURACY REQUIREMENTS:**
   - Wrong locations can cost lives in emergencies
   - Be extremely precise with location details
   - Include all context that helps identify the exact spot
   - Don't generalize or approximate locations
   - Every specific detail matters for emergency response

3. **LOCATION EXTRACTION PRIORITY:**
   - Street names (e.g., "AC Nagar Road", "Chinna Bazaar Road")
   - Specific place names (e.g., "Atmakur Bus Stand Market", "Stonehouse Pet Market")
   - Canal names (e.g., "Upputeru Canal", "Gorasapani Canal")
   - Landmarks (e.g., "Clock Tower", "Temple", "Bridge")
   - Village names (e.g., "Pata Bitragunta", "Balusumoodi")
   - Mandal names (e.g., "Bogole Mandal")
   - Police station names (e.g., "Bitragunta Station", "Tippa Station")

CONTEXT:
- You have access to the original audio file
- You have the initial data extraction results from Gemini 2.5 Flash
- Your job is to verify accuracy, correct errors, and enhance the information
- You must specifically analyze and validate ALL THREE LANGUAGE TRANSCRIPTS

INITIAL EXTRACTED DATA:
${JSON.stringify(extractedData, null, 2)}

CRITICAL TRANSCRIPT VALIDATION TASKS:
1. **Listen to the audio and verify each transcript:**
   - English transcript: Verify it's a complete and accurate translation of the conversation
   - Telugu transcript: Verify it's a complete and accurate transcription/translation in Telugu
   - Hindi transcript: Verify it's a complete and accurate transcription/translation in Hindi

2. **Cross-validate transcripts:**
   - Ensure all three transcripts convey the same information
   - Check for missing details in any language
   - Verify proper translation accuracy between languages
   - Ensure cultural context is preserved in translations

3. **Audio-Transcript Alignment:**
   - Listen to the audio and verify every detail mentioned is captured in transcripts
   - Check for any missed conversations or important details
   - Verify speaker identification and dialogue attribution
   - Ensure no important information is lost in transcription

4. **CRITICAL LOCATION DETAIL VALIDATION:**
   - Listen carefully for ALL specific location details
   - Verify every street name, place name, canal name, landmark
   - Ensure location details are captured in all three transcripts
   - Cross-validate location information across languages
   - Don't miss any specific location identifiers

REVIEW TASKS:
1. **Validate Caller Information**: 
   - Listen to audio and verify caller name, phone, and gender extraction
   - Cross-check with all three transcripts for consistency

2. **Validate Incident Details**: 
   - Verify date, time, location, and incident description across all transcripts
   - Ensure location details are consistent in all languages
   - **CRITICAL: Verify ALL specific location details are captured**

3. **Review Crime Classification**: 
   - Ensure crime type and subtype are correctly categorized based on audio content
   - Cross-validate with all three language transcripts

4. **Assess Severity**: 
   - Verify the severity level (1-10) is appropriate based on audio content
   - Consider cultural context from different language perspectives

5. **Check Emergency Services**: 
   - Validate which services are actually needed based on audio analysis
   - Verify witness, suspect, and victim counts across all transcripts

6. **Verify Additional Details**: 
   - Check for weapons, vehicles, and other incident details
   - Ensure consistency across all language transcripts

IMPROVEMENT GUIDELINES:
- If you find errors in any transcript, correct them based on the audio content
- If information is missing from any language, add it
- If classifications are wrong, provide the correct ones based on audio analysis
- If severity is misassessed, adjust it appropriately
- Ensure all three transcripts are complete, accurate, and consistent
- **CRITICAL: Make sure ALL specific location details are captured and accurate**
- Preserve cultural nuances and context in translations

TRANSCRIPT QUALITY REQUIREMENTS:
- All three transcripts must be complete and accurate
- No important information should be missing from any language
- Translations should preserve the original meaning and context
- Speaker identification should be clear in all transcripts
- Cultural and regional context should be maintained
- **ALL specific location details must be preserved in all languages**

OUTPUT FORMAT:
Return a single, valid JSON object with the same structure as the input, but with any corrections or improvements made. Do not include any text or markdown formatting before or after the JSON object.

CRITICAL REQUIREMENTS:
- Maintain the exact same JSON structure
- Only change values that are actually incorrect or can be improved
- If something is correct, keep it as is
- Ensure all required fields are present
- Validate that the JSON is properly formatted
- All three transcripts (English, Telugu, Hindi) must be complete and accurate
- Cross-validate all information across the three language transcripts
- **CRITICAL: Ensure address_text contains ALL specific location details for accurate Google Maps geocoding**

LOCATION ACCURACY IS CRITICAL FOR EMERGENCY RESPONSE. People's lives depend on getting the exact location right.

Review the audio, analyze all three transcripts, and provide the corrected/improved JSON output with validated multilingual transcripts and precise location details.`;

      const result = await reviewModel.generateContent([reviewPrompt, audioPart]);
      const response = result.response;
      const responseText = response.text();

      // Clean the response to ensure it's valid JSON
      const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      console.log("Received review response from Gemini:", jsonString);
      
      const reviewedData = JSON.parse(jsonString);

      // Add the separate transcript fields for compatibility
      reviewedData.transcript = reviewedData.full_english_transcript;
      reviewedData.raw_transcripts = {
        'en-IN': reviewedData.full_english_transcript || '',
        'te-IN': reviewedData.full_telugu_transcript || '',
        'hi-IN': reviewedData.full_hindi_transcript || '',
      };

      // Log what was changed
      const changes = this.detectChanges(extractedData, reviewedData);
      if (changes.length > 0) {
        console.log("Review agent made the following improvements:", changes);
        
        // Log transcript-specific changes
        const transcriptChanges = changes.filter(change => 
          change.includes('full_english_transcript') || 
          change.includes('full_telugu_transcript') || 
          change.includes('full_hindi_transcript')
        );
        
        if (transcriptChanges.length > 0) {
          console.log("Transcript improvements made:", transcriptChanges);
        }

        // Log location-specific changes
        const locationChanges = changes.filter(change => 
          change.includes('address_text')
        );
        
        if (locationChanges.length > 0) {
          console.log("CRITICAL: Location improvements made:", locationChanges);
        }
      } else {
        console.log("Review agent found no changes needed - data was accurate");
      }

      // Validate transcript completeness
      const transcriptValidation = this.validateTranscriptCompleteness(reviewedData);
      if (!transcriptValidation.isComplete) {
        console.warn("Transcript validation warnings:", transcriptValidation.warnings);
      }

      // Validate location specificity
      const locationValidation = this.validateLocationSpecificity(reviewedData);
      if (!locationValidation.isSpecific) {
        console.warn("CRITICAL: Location specificity warnings:", locationValidation.warnings);
      }

      console.log("Successfully reviewed and improved data with Gemini Review Agent.");
      return reviewedData;

    } catch (error) {
      console.error("Error in review agent:", error);
      console.log("Falling back to original extracted data due to review agent error");
      return extractedData; // Fallback to original data if review fails
    }
  }

  public static detectChanges(original: any, reviewed: any): string[] {
    const changes: string[] = [];
    const fieldsToCheck = [
      'caller_name', 'caller_phone', 'caller_gender', 'incident_date', 'incident_time',
      'crime_type', 'crime_subtype', 'description', 'address_text', 'severity_level',
      'police_station_required', 'emergency_services_needed', 'witnesses_present',
      'suspects_involved', 'victims_involved', 'weapons_involved', 'vehicle_involved',
      'full_english_transcript', 'full_telugu_transcript', 'full_hindi_transcript'
    ];

    for (const field of fieldsToCheck) {
      if (original[field] !== reviewed[field]) {
        changes.push(`${field}: "${original[field]}" → "${reviewed[field]}"`);
      }
    }

    return changes;
  }

  public static validateTranscriptCompleteness(data: any): { isComplete: boolean, warnings: string[] } {
    const warnings: string[] = [];
    let isComplete = true;

    // Check if all three transcripts exist and are not empty
    const transcripts = {
      english: data.full_english_transcript || '',
      telugu: data.full_telugu_transcript || '',
      hindi: data.full_hindi_transcript || ''
    };

    // Check for empty transcripts
    if (!transcripts.english.trim()) {
      warnings.push("English transcript is missing or empty");
      isComplete = false;
    }

    if (!transcripts.telugu.trim()) {
      warnings.push("Telugu transcript is missing or empty");
      isComplete = false;
    }

    if (!transcripts.hindi.trim()) {
      warnings.push("Hindi transcript is missing or empty");
      isComplete = false;
    }

    // Check for minimum length (basic conversation should be at least 50 characters)
    const minLength = 50;
    if (transcripts.english.length < minLength) {
      warnings.push("English transcript seems too short");
    }
    if (transcripts.telugu.length < minLength) {
      warnings.push("Telugu transcript seems too short");
    }
    if (transcripts.hindi.length < minLength) {
      warnings.push("Hindi transcript seems too short");
    }

    // Check for key information presence in transcripts
    const keyInfo = ['caller', 'incident', 'location', 'police'];
    const hasKeyInfo = (transcript: string) => 
      keyInfo.some(info => transcript.toLowerCase().includes(info));

    if (!hasKeyInfo(transcripts.english)) {
      warnings.push("English transcript may be missing key information");
    }
    if (!hasKeyInfo(transcripts.telugu)) {
      warnings.push("Telugu transcript may be missing key information");
    }
    if (!hasKeyInfo(transcripts.hindi)) {
      warnings.push("Hindi transcript may be missing key information");
    }

    return { isComplete, warnings };
  }

  public static validateLocationSpecificity(data: any): { isSpecific: boolean, warnings: string[] } {
    const warnings: string[] = [];
    let isSpecific = true;

    const addressText = data.address_text || '';
    const transcripts = {
      english: data.full_english_transcript || '',
      telugu: data.full_telugu_transcript || '',
      hindi: data.full_hindi_transcript || ''
    };

    // Check for specific location indicators
    const specificLocationPatterns = [
      /road|street|lane|avenue/i,
      /canal|river|bridge/i,
      /temple|church|mosque/i,
      /market|shop|store/i,
      /bus stand|railway station/i,
      /police station/i,
      /village|mandal|district/i,
      /near|by|opposite|beside/i
    ];

    const hasSpecificLocation = specificLocationPatterns.some(pattern => 
      pattern.test(addressText) || 
      pattern.test(transcripts.english) || 
      pattern.test(transcripts.telugu) || 
      pattern.test(transcripts.hindi)
    );

    if (!hasSpecificLocation) {
      warnings.push("CRITICAL: No specific location details found (street names, landmarks, etc.)");
      isSpecific = false;
    }

    // Check for generic locations
    const genericPatterns = [
      /location not specified/i,
      /not mentioned/i,
      /unclear/i,
      /somewhere/i,
      /around/i
    ];

    const hasGenericLocation = genericPatterns.some(pattern => 
      pattern.test(addressText)
    );

    if (hasGenericLocation) {
      warnings.push("CRITICAL: Location is too generic for emergency response");
      isSpecific = false;
    }

    // Check minimum address length
    if (addressText.length < 20) {
      warnings.push("CRITICAL: Address text seems too short for accurate location identification");
      isSpecific = false;
    }

    return { isSpecific, warnings };
  }
} 