-- Remove police station related columns from call_112_tickets table
-- Run this script in your Supabase SQL editor to clean up the schema

-- Remove police station info column
ALTER TABLE call_112_tickets 
DROP COLUMN IF EXISTS police_station_info;

-- Remove coverage area column
ALTER TABLE call_112_tickets 
DROP COLUMN IF EXISTS coverage_area;

-- Remove police_stations table if it exists
DROP TABLE IF EXISTS police_stations CASCADE;

-- Verify the columns were removed
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'call_112_tickets' 
AND column_name IN ('police_station_info', 'coverage_area')
ORDER BY column_name;

-- Show remaining columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'call_112_tickets' 
ORDER BY ordinal_position; 