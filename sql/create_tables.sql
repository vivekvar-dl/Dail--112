-- Create the call_112_tickets table based on official 112 schema
CREATE TABLE IF NOT EXISTS call_112_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Caller Information
  caller_name VARCHAR(255) NOT NULL,
  caller_phone VARCHAR(20) NOT NULL,
  caller_gender VARCHAR(10),
  
  -- Incident Information
  crime_type VARCHAR(100) NOT NULL,
  crime_subtype VARCHAR(100) NOT NULL,
  severity INTEGER NOT NULL DEFAULT 5 CHECK (severity >= 1 AND severity <= 10),
  incident_date DATE NOT NULL,
  incident_time TIME NOT NULL,
  description TEXT NOT NULL,
  
  -- Location Information
  address_text TEXT NOT NULL,
  verified_address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL DEFAULT 0,
  longitude DECIMAL(11, 8) NOT NULL DEFAULT 0,
  
  -- Metadata
  evidence_type VARCHAR(20) NOT NULL DEFAULT 'Voice',
  officer_assigned VARCHAR(255),
  audio_file_url TEXT,
  review_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  
  -- System Fields
  transcript TEXT,
  raw_transcripts JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_crime_type ON call_112_tickets(crime_type);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_review_status ON call_112_tickets(review_status);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_severity ON call_112_tickets(severity DESC);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_created_at ON call_112_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_incident_date ON call_112_tickets(incident_date DESC);

-- Add RLS (Row Level Security) policies
-- Make sure to run this if you want to use Supabase client-side access
ALTER TABLE call_112_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access" ON call_112_tickets
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authorized insert" ON call_112_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
  
CREATE POLICY "Allow service_role to do everything" ON call_112_tickets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('UTC', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_call_112_tickets_updated_at ON call_112_tickets;
CREATE TRIGGER update_call_112_tickets_updated_at
  BEFORE UPDATE ON call_112_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add sample data based on the official crime severity rankings
INSERT INTO call_112_tickets (
  caller_name,
  caller_phone,
  caller_gender,
  incident_date,
  incident_time,
  crime_type,
  crime_subtype,
  severity,
  description,
  address_text,
  verified_address,
  latitude,
  longitude,
  evidence_type,
  review_status,
  transcript,
  raw_transcripts
) VALUES 
(
  'Navina',
  '+91-8749898203',
  null,
  '2025-06-26',
  '14:30:32',
  'Accident',
  'Car Accident',
  10,
  'Car collided with a truck and flipped; 3 injured, one trapped.',
  'APSRTC Bus Depot, Kurnool Bypass Road',
  'APSRTC Bus Depot, Kurnool Bypass Road',
  15.8281,
  78.0373,
  'Voice',
  'Pending',
  'Hello, this is Navina calling from Kurnool. There has been a serious car accident at the APSRTC Bus Depot on the bypass road. A car collided with a truck and flipped over. There are 3 people injured and one person is trapped inside. We need immediate medical assistance and fire rescue. My number is 8749898203.',
  '{ "en-IN": "Hello, this is Navina calling from Kurnool...", "te-IN": "హలో, నేను కర్నూలు నుండి నవీన మాట్లాడుతున్నాను..." }'
),
(
  'Rajesh Kumar',
  '+91-9876543210',
  'Male',
  CURRENT_DATE,
  '15:00:00',
  'Robbery',
  'Chain Snatching',
  8,
  'Two men on a motorcycle snatched a woman''s gold chain and escaped.',
  'Near Central Market, Vijayawada',
  'Central Market, Vijayawada, Andhra Pradesh, India',
  16.5062,
  80.6480,
  'Voice',
  'Pending',
  'Hello, I want to report a chain snatching incident. Two men on a motorcycle just snatched a woman''s gold chain near Central Market and escaped towards the main road. This happened 5 minutes ago. The woman is injured and shaken. My name is Rajesh Kumar, phone 9876543210.',
  null
),
(
  'Priya Sharma',
  '+91-8765432109',
  'Female',
  CURRENT_DATE,
  '18:45:00',
  'Body Offence',
  'Assault',
  9,
  'A man is beating a woman on the street. She is screaming for help.',
  'MG Road, Guntur',
  'MG Road, Guntur, Andhra Pradesh, India',
  16.3067,
  80.4365,
  'Voice',
  'Reviewed',
  'Emergency! I am calling to report an assault in progress. A man is beating a woman on MG Road near the bank. She is screaming for help and there are people gathering. Please send police immediately. My name is Priya Sharma, phone 8765432109.',
  null
),
(
  'Anitha Reddy',
  '+91-7654321098',
  'Female',
  CURRENT_DATE,
  '11:20:00',
  'Missing',
  'Missing Child',
  9,
  'My 8-year-old daughter has been missing for 2 hours from the temple.',
  'Sri Venkateswara Temple, Tirupati',
  'Sri Venkateswara Temple, Tirupati, Andhra Pradesh, India',
  13.6833,
  79.3167,
  'Voice',
  'Pending',
  'Please help me! My 8-year-old daughter Lakshmi has been missing for 2 hours. She was wearing a red dress and was last seen near the Sri Venkateswara Temple. I am Anitha Reddy, my number is 7654321098. Please help me find her.',
  null
),
(
  'Suresh Babu',
  '+91-6543210987',
  'Male',
  CURRENT_DATE,
  '22:15:00',
  'Offence Against Women',
  'Domestic Violence',
  9,
  'My neighbor is beating his wife. I can hear her screaming.',
  'Apartment Complex, Visakhapatnam',
  'Beach Road Apartments, Visakhapatnam, Andhra Pradesh, India',
  17.7231,
  83.3005,
  'Voice',
  'Pending',
  'I am calling to report domestic violence in my apartment complex. My neighbor in flat 304 is beating his wife. I can hear her screaming and crying. This has been going on for 30 minutes. Please send help immediately. My name is Suresh Babu, phone 6543210987.',
  null
); 