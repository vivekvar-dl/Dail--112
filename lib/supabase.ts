import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wfnlptnctxbukwfektwy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbmxwdG5jdHhidWt3ZmVrdHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMTkxODIsImV4cCI6MjA2NjU5NTE4Mn0.KypR6BBi4qfDAjE2kvbOvZXy9wp3BR5jj0a-IHG4Gzo'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbmxwdG5jdHhidWt3ZmVrdHd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAxOTE4MiwiZXhwIjoyMDY2NTk1MTgyfQ.PbYxAYm01OC73AP6W8W7XgaaRi6WqhATpdoxjbiLHZ4'

// Create a single instance to avoid multiple client warnings
let supabaseInstance: any = null
let supabaseAdminInstance: any = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })
  }
  return supabaseInstance
})()

// Only create admin client on server side
export const supabaseAdmin = (() => {
  if (typeof window === 'undefined') {
    if (!supabaseAdminInstance) {
      supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false
        }
      })
    }
    return supabaseAdminInstance
  }
  return supabase
})()

// Database table schema types based on official 112 ticket schema
export interface Call112Ticket {
  id?: string
  // Caller Information
  caller_name: string
  caller_phone: string
  caller_gender?: string
  // Incident Information
  crime_type: string
  crime_subtype: string
  severity: number // 1-10 severity ranking
  incident_date: string
  incident_time: string
  description: string
  // Location Information
  address_text: string
  verified_address: string
  latitude: number
  longitude: number
  // Metadata
  evidence_type: 'Voice' | 'Text' | 'Image'
  officer_assigned?: string
  audio_file_url?: string
  review_status: 'Pending' | 'Approved' | 'Rejected'
  // System Fields
  transcript?: string
  raw_transcripts?: { [language: string]: string }
  // Enhanced Incident Details
  emergency_services_needed?: string
  witnesses_present?: boolean
  suspects_involved?: string
  victims_involved?: string
  weapons_involved?: boolean
  vehicle_involved?: boolean
  emergency_recommendations?: string[]
  created_at?: string
  updated_at?: string
}

// Official 112 Crime types and subtypes with severity rankings
export const CRIME_TYPES = {
  'Accident': {
    subtypes: ['Car Accident', 'Train Accident'],
    severities: { 'Car Accident': 10, 'Train Accident': 7 }
  },
  'Robbery': {
    subtypes: ['Chain Snatching', 'Vehicle Theft'],
    severities: { 'Chain Snatching': 8, 'Vehicle Theft': 5 }
  },
  'Body Offence': {
    subtypes: ['Assault', 'Kidnapping', 'Murder', 'Attempt to Murder'],
    severities: { 'Assault': 9, 'Kidnapping': 8, 'Murder': 10, 'Attempt to Murder': 10 }
  },
  'Disaster': {
    subtypes: ['Flood Disaster'],
    severities: { 'Flood Disaster': 6 }
  },
  'Offence Against Public': {
    subtypes: ['Drunken Misconduct in Public'],
    severities: { 'Drunken Misconduct in Public': 5 }
  },
  'Missing': {
    subtypes: ['Missing Child'],
    severities: { 'Missing Child': 9 }
  },
  'Offence Against Women': {
    subtypes: ['Eve-Teasing', 'Domestic Violence'],
    severities: { 'Eve-Teasing': 6, 'Domestic Violence': 9 }
  }
} as const

// Helper function to get severity for a crime type and subtype
export const getSeverity = (crimeType: string, crimeSubtype: string): number => {
  const type = CRIME_TYPES[crimeType as keyof typeof CRIME_TYPES]
  if (type && type.severities[crimeSubtype as keyof typeof type.severities]) {
    return type.severities[crimeSubtype as keyof typeof type.severities]
  }
  return 5 // Default severity
}

export type CrimeType = keyof typeof CRIME_TYPES
export type CrimeSubtype = typeof CRIME_TYPES[CrimeType]['subtypes'][number] 