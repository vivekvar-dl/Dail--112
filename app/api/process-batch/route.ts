import { NextRequest, NextResponse } from 'next/server'
import { AudioProcessor } from '@/lib/audio-processor'

// Helper to extract phone number from filename
function extractPhoneNumberFromFilename(filename: string): string {
  const match = filename.match(/\+91[_-]?(\d{10})/);
  return match ? match[1] : 'Not Provided';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files provided'
      }, { status: 400 })
    }

    // Validate file types
    const validFiles = files.filter(file => {
      const isAudio = file.type.startsWith('audio/') ||
                     file.name.toLowerCase().endsWith('.wav') ||
                     file.name.toLowerCase().endsWith('.mp3') ||
                     file.name.toLowerCase().endsWith('.m4a')
      
      const sizeLimit = 50 * 1024 * 1024 // 50MB
      return isAudio && file.size <= sizeLimit
    })

    if (validFiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid audio files found'
      }, { status: 400 })
    }

    const results = []
    const errors = []
    
    // Process files sequentially to avoid overwhelming the system
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      
      try {
        console.log(`Processing batch file ${i + 1}/${validFiles.length}: ${file.name}`)
        
        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer())
        const phoneNumber = extractPhoneNumberFromFilename(file.name)
        
        // Process the audio file
        const result = await AudioProcessor.processAudioFile(buffer, file.name, phoneNumber)
        
        if (result.success) {
          results.push({
            filename: file.name,
            success: true,
            ticket: result.ticket,
            processingSteps: result.processing_steps
          })
        } else {
          errors.push({
            filename: file.name,
            error: result.error || 'Processing failed'
          })
        }
        
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      
      // Add small delay between files to prevent rate limiting
      if (i < validFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const response = {
      success: results.length > 0,
      totalFiles: validFiles.length,
      successfulFiles: results.length,
      failedFiles: errors.length,
      results,
      errors,
      summary: {
        processed: results.length,
        failed: errors.length,
        successRate: Math.round((results.length / validFiles.length) * 100)
      }
    }

    console.log(`Batch processing completed: ${results.length}/${validFiles.length} successful`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Batch processing error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch processing failed'
    }, { status: 500 })
  }
}

// Set route segment config for larger file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Increased for multiple files
    },
  },
} 