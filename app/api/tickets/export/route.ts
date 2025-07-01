import { NextRequest, NextResponse } from 'next/server'
import { supabase, Call112Ticket } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json or excel
    const crimeType = searchParams.get('crime_type')
    const reviewStatus = searchParams.get('review_status')
    const severityMin = searchParams.get('severity_min')
    const severityMax = searchParams.get('severity_max')

    let query = supabase
      .from('call_112_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (crimeType) {
      query = query.eq('crime_type', crimeType)
    }
    
    if (reviewStatus) {
      query = query.eq('review_status', reviewStatus)
    }

    if (severityMin) {
      query = query.gte('severity', parseInt(severityMin))
    }

    if (severityMax) {
      query = query.lte('severity', parseInt(severityMax))
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    const tickets = data || []

    if (format === 'excel') {
      // Create Excel workbook
      const workbook = XLSX.utils.book_new()
      
      // Transform data for Excel format
      const excelData = tickets.map((ticket: Call112Ticket) => ({
        'Ticket ID': ticket.id,
        'Caller Name': ticket.caller_name,
        'Caller Phone': ticket.caller_phone,
        'Caller Gender': ticket.caller_gender || 'Not Specified',
        'Incident Date': ticket.incident_date,
        'Incident Time': ticket.incident_time,
        'Crime Type': ticket.crime_type,
        'Crime Subtype': ticket.crime_subtype,
        'Severity (1-10)': ticket.severity,
        'Priority Level': ticket.severity >= 9 ? 'CRITICAL' : 
                        ticket.severity >= 7 ? 'HIGH' : 
                        ticket.severity >= 5 ? 'MEDIUM' : 'LOW',
        'Description': ticket.description,
        'Address Text': ticket.address_text,
        'Verified Address': ticket.verified_address,
        'Latitude': ticket.latitude,
        'Longitude': ticket.longitude,
        'Evidence Type': ticket.evidence_type,
        'Officer Assigned': ticket.officer_assigned || 'Not Assigned',
        'Review Status': ticket.review_status,
        'Audio File': ticket.audio_file_url || 'Not Available',
        'Transcript': ticket.transcript || 'Not Available',
        'Created At': ticket.created_at,
        'Updated At': ticket.updated_at
      }))

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      
      // Auto-size columns
      const colWidths = [
        { wch: 10 }, // Ticket ID
        { wch: 20 }, // Caller Name
        { wch: 15 }, // Caller Phone
        { wch: 12 }, // Caller Gender
        { wch: 12 }, // Incident Date
        { wch: 12 }, // Incident Time
        { wch: 18 }, // Crime Type
        { wch: 20 }, // Crime Subtype
        { wch: 12 }, // Severity
        { wch: 12 }, // Priority Level
        { wch: 40 }, // Description
        { wch: 30 }, // Address Text
        { wch: 30 }, // Verified Address
        { wch: 12 }, // Latitude
        { wch: 12 }, // Longitude
        { wch: 12 }, // Evidence Type
        { wch: 18 }, // Officer Assigned
        { wch: 12 }, // Review Status
        { wch: 20 }, // Audio File
        { wch: 40 }, // Transcript
        { wch: 20 }, // Created At
        { wch: 20 }  // Updated At
      ]
      worksheet['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Emergency Tickets')

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      // Return Excel file
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `emergency_tickets_${timestamp}.xlsx`

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': excelBuffer.length.toString()
        }
      })
    } else {
      // Return JSON format
      const jsonData = {
        metadata: {
          total_tickets: tickets.length,
          export_date: new Date().toISOString(),
          filters_applied: {
            crime_type: crimeType || 'all',
            review_status: reviewStatus || 'all',
            severity_range: severityMin || severityMax ? 
              `${severityMin || 1}-${severityMax || 10}` : 'all'
          }
        },
        tickets: tickets.map((ticket: Call112Ticket) => ({
          id: ticket.id,
          caller: {
            name: ticket.caller_name,
            phone: ticket.caller_phone,
            gender: ticket.caller_gender
          },
          incident: {
            crimeType: ticket.crime_type,
            crimeSubType: ticket.crime_subtype,
            severity: ticket.severity,
            priorityLevel: ticket.severity >= 9 ? 'CRITICAL' : 
                          ticket.severity >= 7 ? 'HIGH' : 
                          ticket.severity >= 5 ? 'MEDIUM' : 'LOW',
            date: ticket.incident_date,
            time: ticket.incident_time,
            description: ticket.description
          },
          location: {
            addressText: ticket.address_text,
            verifiedAddress: ticket.verified_address,
            latitude: ticket.latitude,
            longitude: ticket.longitude
          },
          metadata: {
            evidenceType: ticket.evidence_type,
            officerAssigned: ticket.officer_assigned,
            audioFile: ticket.audio_file_url,
            reviewStatus: ticket.review_status,
            transcript: ticket.transcript
          },
          timestamps: {
            created_at: ticket.created_at,
            updated_at: ticket.updated_at
          }
        }))
      }

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `emergency_tickets_${timestamp}.json`

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }

  } catch (error) {
    console.error('Export Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to export tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 