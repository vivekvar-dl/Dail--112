import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const crimeType = searchParams.get('crime_type')
    const reviewStatus = searchParams.get('review_status')

    let query = supabase
      .from('call_112_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (crimeType) {
      query = query.eq('crime_type', crimeType)
    }
    
    if (reviewStatus) {
      query = query.eq('review_status', reviewStatus)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      tickets: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch tickets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('call_112_tickets')
      .insert([body])
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      ticket: data
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create ticket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 