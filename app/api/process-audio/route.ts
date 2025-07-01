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
    const files = formData.getAll('audio') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No audio files provided' },
        { status: 400 }
      )
    }

    // Convert files to buffers
    const audioFiles: { buffer: Buffer, fileName: string, phoneNumber: string }[] = []
    
    for (const file of files) {
      if (!file.type.startsWith('audio/') && !file.name.endsWith('.wav') && !file.name.endsWith('.mp3')) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only audio files are supported.` },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const phoneNumber = extractPhoneNumberFromFilename(file.name)
      audioFiles.push({
        buffer,
        fileName: file.name,
        phoneNumber
      })
    }

    console.log(`Processing ${audioFiles.length} audio file(s)`)

    // Process files
    let results
    if (audioFiles.length === 1) {
      const result = await AudioProcessor.processAudioFile(
        audioFiles[0].buffer,
        audioFiles[0].fileName,
        audioFiles[0].phoneNumber
      )
      results = [result]
    } else {
      results = await AudioProcessor.batchProcessAudioFiles(audioFiles)
    }

    // Calculate summary statistics
    const summary = {
      total_files: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      total_processing_time_ms: results.reduce((total, r) => {
        return total + 
          r.processing_steps.gpt_analysis.duration_ms +
          r.processing_steps.review_agent.duration_ms +
          r.processing_steps.geocoding.duration_ms +
          r.processing_steps.database.duration_ms
      }, 0)
    }

    return NextResponse.json({
      success: true,
      summary,
      results
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Audio Processing API',
    endpoints: {
      POST: '/api/process-audio - Upload and process audio files',
    },
    supported_formats: ['MP3', 'WAV'],
    max_file_size: '10MB per file'
  })
} 