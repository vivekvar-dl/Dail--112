-- Add missing columns to existing call_112_tickets table
-- Run this script in your Supabase SQL editor to add the new columns

-- Add enhanced police station information column
ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS police_station_info JSONB;

-- Add enhanced incident details columns
ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS emergency_services_needed TEXT;

ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS witnesses_present BOOLEAN DEFAULT FALSE;

ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS suspects_involved TEXT;

ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS victims_involved TEXT;

ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS weapons_involved BOOLEAN DEFAULT FALSE;

ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS vehicle_involved BOOLEAN DEFAULT FALSE;

ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS emergency_recommendations TEXT[];

-- Add coverage area column
ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS coverage_area JSONB;

-- Add processing metadata columns
ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS processing_steps JSONB;

ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER;

ALTER TABLE call_112_tickets 
ADD COLUMN IF NOT EXISTS processing_errors TEXT[];

-- Add comments to the new columns
COMMENT ON COLUMN call_112_tickets.police_station_info IS 'JSON object containing assigned police station details';
COMMENT ON COLUMN call_112_tickets.coverage_area IS 'JSON object containing coverage area and jurisdiction information';
COMMENT ON COLUMN call_112_tickets.emergency_services_needed IS 'Comma-separated list of emergency services required';
COMMENT ON COLUMN call_112_tickets.witnesses_present IS 'Whether witnesses were present at the incident';
COMMENT ON COLUMN call_112_tickets.suspects_involved IS 'Description of suspects involved in the incident';
COMMENT ON COLUMN call_112_tickets.victims_involved IS 'Description of victims involved in the incident';
COMMENT ON COLUMN call_112_tickets.weapons_involved IS 'Whether weapons were involved in the incident';
COMMENT ON COLUMN call_112_tickets.vehicle_involved IS 'Whether vehicles were involved in the incident';
COMMENT ON COLUMN call_112_tickets.emergency_recommendations IS 'Array of recommended emergency services';
COMMENT ON COLUMN call_112_tickets.processing_steps IS 'JSON object containing processing step results and timings';
COMMENT ON COLUMN call_112_tickets.processing_duration_ms IS 'Total processing time in milliseconds';
COMMENT ON COLUMN call_112_tickets.processing_errors IS 'Array of errors encountered during processing';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'call_112_tickets' 
AND column_name IN (
  'police_station_info', 
  'coverage_area', 
  'emergency_services_needed',
  'witnesses_present',
  'suspects_involved',
  'victims_involved',
  'weapons_involved',
  'vehicle_involved',
  'emergency_recommendations',
  'processing_steps',
  'processing_duration_ms',
  'processing_errors'
)
ORDER BY column_name; 