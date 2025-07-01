-- Refresh database schema cache and verify table structure
-- Run this after adding the missing columns

-- Force refresh of schema cache by running a simple query
SELECT 1 FROM call_112_tickets LIMIT 1;

-- Show the complete table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'call_112_tickets' 
ORDER BY ordinal_position;

-- Verify all required columns exist
SELECT 
  CASE 
    WHEN COUNT(*) = 12 THEN '✅ All required columns exist'
    ELSE '❌ Missing columns: ' || (12 - COUNT(*)) || ' columns missing'
  END as status
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
);

-- Test insert with new columns (optional - for verification)
-- Uncomment the following lines if you want to test the insert functionality
/*
INSERT INTO call_112_tickets (
  caller_name,
  caller_phone,
  crime_type,
  crime_subtype,
  severity,
  incident_date,
  incident_time,
  description,
  address_text,
  verified_address,
  latitude,
  longitude,
  police_station_info,
  coverage_area,
  emergency_services_needed,
  witnesses_present,
  suspects_involved,
  victims_involved,
  weapons_involved,
  vehicle_involved,
  emergency_recommendations
) VALUES (
  'Test Caller',
  '+91-1234567890',
  'Test',
  'Test Subtype',
  5,
  CURRENT_DATE,
  '12:00',
  'Test description',
  'Test address',
  'Test verified address',
  16.5062,
  80.6480,
  '{"station_name": "Test Station"}'::jsonb,
  '{"center": {"lat": 16.5062, "lng": 80.6480}}'::jsonb,
  'Police',
  true,
  'Test suspect',
  'Test victim',
  false,
  false,
  ARRAY['Police']
) ON CONFLICT DO NOTHING;
*/ 