-- Emergency Call Analysis System - Complete Database Schema
-- For Andhra Pradesh Police 112 Emergency Response System
-- Created: 2025-01-XX

-- =====================================================
-- MAIN TABLES
-- =====================================================

-- Primary table for emergency call tickets
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
  
  -- Enhanced Police Station Information
  police_station_info JSONB,
  
  -- Enhanced Incident Details
  emergency_services_needed TEXT,
  witnesses_present BOOLEAN DEFAULT FALSE,
  suspects_involved TEXT,
  victims_involved TEXT,
  weapons_involved BOOLEAN DEFAULT FALSE,
  vehicle_involved BOOLEAN DEFAULT FALSE,
  emergency_recommendations TEXT[],
  coverage_area JSONB,
  
  -- Processing Metadata
  processing_steps JSONB,
  processing_duration_ms INTEGER,
  processing_errors TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- Police Stations table for storing station information
CREATE TABLE IF NOT EXISTS police_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Contact Information
  contact_number VARCHAR(20),
  officer_in_charge VARCHAR(255),
  
  -- Jurisdiction Information
  jurisdiction_radius_km DECIMAL(5, 2) NOT NULL DEFAULT 10.0,
  district VARCHAR(100),
  state VARCHAR(100) DEFAULT 'Andhra Pradesh',
  
  -- Google Places Information
  place_id VARCHAR(255),
  rating DECIMAL(3, 2),
  user_ratings_total INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- Audio Files table for managing uploaded audio evidence
CREATE TABLE IF NOT EXISTS audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- File Information
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Storage Information
  storage_path TEXT NOT NULL,
  public_url TEXT,
  
  -- Processing Information
  processing_status VARCHAR(20) DEFAULT 'Pending', -- Pending, Processing, Completed, Failed
  processing_result JSONB,
  
  -- Metadata
  phone_number VARCHAR(20),
  upload_source VARCHAR(50) DEFAULT 'Web', -- Web, Mobile, API
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- Processing Logs table for tracking audio processing
CREATE TABLE IF NOT EXISTS processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference Information
  audio_file_id UUID REFERENCES audio_files(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES call_112_tickets(id) ON DELETE CASCADE,
  
  -- Processing Information
  step_name VARCHAR(100) NOT NULL, -- gpt_analysis, geocoding, database, police_station
  status VARCHAR(20) NOT NULL, -- success, failed, pending
  duration_ms INTEGER,
  error_message TEXT,
  
  -- Step-specific Data
  step_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- =====================================================
-- LOOKUP TABLES
-- =====================================================

-- Crime Types and Subtypes lookup table
CREATE TABLE IF NOT EXISTS crime_types (
  id SERIAL PRIMARY KEY,
  crime_type VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  default_severity INTEGER DEFAULT 5 CHECK (default_severity >= 1 AND default_severity <= 10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- Crime Subtypes lookup table
CREATE TABLE IF NOT EXISTS crime_subtypes (
  id SERIAL PRIMARY KEY,
  crime_type_id INTEGER REFERENCES crime_types(id) ON DELETE CASCADE,
  subtype_name VARCHAR(100) NOT NULL,
  severity INTEGER NOT NULL DEFAULT 5 CHECK (severity >= 1 AND severity <= 10),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW()),
  UNIQUE(crime_type_id, subtype_name)
);

-- Emergency Services lookup table
CREATE TABLE IF NOT EXISTS emergency_services (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  contact_number VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC', NOW())
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Call 112 Tickets indexes
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_crime_type ON call_112_tickets(crime_type);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_review_status ON call_112_tickets(review_status);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_severity ON call_112_tickets(severity DESC);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_created_at ON call_112_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_incident_date ON call_112_tickets(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_location ON call_112_tickets(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_caller_phone ON call_112_tickets(caller_phone);
CREATE INDEX IF NOT EXISTS idx_call_112_tickets_officer_assigned ON call_112_tickets(officer_assigned);

-- Police Stations indexes
CREATE INDEX IF NOT EXISTS idx_police_stations_district ON police_stations(district);
CREATE INDEX IF NOT EXISTS idx_police_stations_active ON police_stations(is_active);
CREATE INDEX IF NOT EXISTS idx_police_stations_location ON police_stations(latitude, longitude);

-- Audio Files indexes
CREATE INDEX IF NOT EXISTS idx_audio_files_processing_status ON audio_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_audio_files_phone_number ON audio_files(phone_number);
CREATE INDEX IF NOT EXISTS idx_audio_files_created_at ON audio_files(created_at DESC);

-- Processing Logs indexes
CREATE INDEX IF NOT EXISTS idx_processing_logs_audio_file_id ON processing_logs(audio_file_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_ticket_id ON processing_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_step_name ON processing_logs(step_name);
CREATE INDEX IF NOT EXISTS idx_processing_logs_status ON processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_processing_logs_created_at ON processing_logs(created_at DESC);

-- Crime Types and Subtypes indexes
CREATE INDEX IF NOT EXISTS idx_crime_subtypes_crime_type_id ON crime_subtypes(crime_type_id);
CREATE INDEX IF NOT EXISTS idx_crime_subtypes_severity ON crime_subtypes(severity DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE call_112_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE police_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crime_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE crime_subtypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_services ENABLE ROW LEVEL SECURITY;

-- Call 112 Tickets policies
CREATE POLICY "Allow public read-only access to tickets" ON call_112_tickets
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to tickets" ON call_112_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access to tickets" ON call_112_tickets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Police Stations policies
CREATE POLICY "Allow public read-only access to police stations" ON police_stations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service_role full access to police stations" ON police_stations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Audio Files policies
CREATE POLICY "Allow public read-only access to audio files" ON audio_files
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated insert to audio files" ON audio_files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access to audio files" ON audio_files
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Processing Logs policies
CREATE POLICY "Allow public read-only access to processing logs" ON processing_logs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service_role full access to processing logs" ON processing_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Lookup tables policies
CREATE POLICY "Allow public read-only access to lookup tables" ON crime_types
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read-only access to crime subtypes" ON crime_subtypes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read-only access to emergency services" ON emergency_services
  FOR SELECT
  TO public
  USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('UTC', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_call_112_tickets_updated_at ON call_112_tickets;
DROP TRIGGER IF EXISTS update_police_stations_updated_at ON police_stations;
DROP TRIGGER IF EXISTS update_audio_files_updated_at ON audio_files;

-- Create triggers for updated_at columns
CREATE TRIGGER update_call_112_tickets_updated_at BEFORE UPDATE ON call_112_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_police_stations_updated_at BEFORE UPDATE ON police_stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audio_files_updated_at BEFORE UPDATE ON audio_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL, 
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Earth's radius in kilometers
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearest police station
CREATE OR REPLACE FUNCTION find_nearest_police_station(
  incident_lat DECIMAL, 
  incident_lon DECIMAL
) RETURNS TABLE(
  station_id UUID,
  station_name VARCHAR,
  distance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.name,
    calculate_distance(incident_lat, incident_lon, ps.latitude, ps.longitude) as distance
  FROM police_stations ps
  WHERE ps.is_active = true
  ORDER BY distance
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert crime types
INSERT INTO crime_types (crime_type, description, default_severity) VALUES
('Accident', 'Traffic and transportation accidents', 7),
('Robbery', 'Theft and robbery incidents', 6),
('Body Offence', 'Physical assault and violence', 8),
('Disaster', 'Natural and man-made disasters', 7),
('Offence Against Public', 'Public order offences', 5),
('Missing', 'Missing person reports', 7),
('Offence Against Women', 'Crimes against women', 8)
ON CONFLICT (crime_type) DO NOTHING;

-- Insert crime subtypes
INSERT INTO crime_subtypes (crime_type_id, subtype_name, severity, description) VALUES
((SELECT id FROM crime_types WHERE crime_type = 'Accident'), 'Car Accident', 10, 'Motor vehicle collisions'),
((SELECT id FROM crime_types WHERE crime_type = 'Accident'), 'Train Accident', 7, 'Railway accidents'),
((SELECT id FROM crime_types WHERE crime_type = 'Robbery'), 'Chain Snatching', 8, 'Snatching of jewelry'),
((SELECT id FROM crime_types WHERE crime_type = 'Robbery'), 'Vehicle Theft', 5, 'Theft of vehicles'),
((SELECT id FROM crime_types WHERE crime_type = 'Body Offence'), 'Assault', 9, 'Physical assault'),
((SELECT id FROM crime_types WHERE crime_type = 'Body Offence'), 'Kidnapping', 8, 'Abduction cases'),
((SELECT id FROM crime_types WHERE crime_type = 'Body Offence'), 'Murder', 10, 'Homicide cases'),
((SELECT id FROM crime_types WHERE crime_type = 'Body Offence'), 'Attempt to Murder', 10, 'Attempted homicide'),
((SELECT id FROM crime_types WHERE crime_type = 'Disaster'), 'Flood Disaster', 6, 'Flood-related emergencies'),
((SELECT id FROM crime_types WHERE crime_type = 'Offence Against Public'), 'Drunken Misconduct in Public', 5, 'Public intoxication'),
((SELECT id FROM crime_types WHERE crime_type = 'Missing'), 'Missing Child', 9, 'Missing children cases'),
((SELECT id FROM crime_types WHERE crime_type = 'Offence Against Women'), 'Eve-Teasing', 6, 'Harassment of women'),
((SELECT id FROM crime_types WHERE crime_type = 'Offence Against Women'), 'Domestic Violence', 9, 'Domestic abuse cases')
ON CONFLICT (crime_type_id, subtype_name) DO NOTHING;

-- Insert emergency services
INSERT INTO emergency_services (service_name, description, contact_number) VALUES
('Police', 'Law enforcement services', '100'),
('Ambulance', 'Medical emergency services', '108'),
('Fire', 'Fire and rescue services', '101'),
('Women Helpline', 'Women safety helpline', '1091'),
('Child Helpline', 'Child protection services', '1098'),
('Senior Citizen Helpline', 'Elder care services', '14567'),
('Disaster Management', 'Natural disaster response', '1070')
ON CONFLICT (service_name) DO NOTHING;

-- Insert major police stations in Andhra Pradesh
INSERT INTO police_stations (name, address, latitude, longitude, contact_number, officer_in_charge, jurisdiction_radius_km, district) VALUES
('Vijayawada Police Station', 'Vijayawada, Andhra Pradesh', 16.5062, 80.6480, '+91-866-2471000', 'SP Vijayawada', 15.0, 'Krishna'),
('Guntur Police Station', 'Guntur, Andhra Pradesh', 16.3067, 80.4365, '+91-863-2220000', 'SP Guntur', 12.0, 'Guntur'),
('Visakhapatnam Police Station', 'Visakhapatnam, Andhra Pradesh', 17.7231, 83.3005, '+91-891-2560000', 'SP Visakhapatnam', 18.0, 'Visakhapatnam'),
('Tirupati Police Station', 'Tirupati, Andhra Pradesh', 13.6288, 79.4192, '+91-877-2280000', 'SP Tirupati', 10.0, 'Chittoor'),
('Kurnool Police Station', 'Kurnool, Andhra Pradesh', 15.8281, 78.0373, '+91-8518-220000', 'SP Kurnool', 12.0, 'Kurnool'),
('Anantapur Police Station', 'Anantapur, Andhra Pradesh', 14.6819, 77.6006, '+91-8554-220000', 'SP Anantapur', 10.0, 'Anantapur'),
('Kadapa Police Station', 'Kadapa, Andhra Pradesh', 14.4753, 78.8298, '+91-8562-220000', 'SP Kadapa', 11.0, 'YSR Kadapa'),
('Srikakulam Police Station', 'Srikakulam, Andhra Pradesh', 18.2969, 83.8963, '+91-8942-220000', 'SP Srikakulam', 9.0, 'Srikakulam'),
('Vizianagaram Police Station', 'Vizianagaram, Andhra Pradesh', 18.1166, 83.4115, '+91-8922-220000', 'SP Vizianagaram', 8.0, 'Vizianagaram'),
('Prakasam Police Station', 'Ongole, Andhra Pradesh', 15.5036, 80.0444, '+91-8592-220000', 'SP Prakasam', 13.0, 'Prakasam'),
('West Godavari Police Station', 'Eluru, Andhra Pradesh', 16.7069, 81.1047, '+91-8812-220000', 'SP West Godavari', 14.0, 'West Godavari'),
('East Godavari Police Station', 'Kakinada, Andhra Pradesh', 16.9604, 82.2386, '+91-884-220000', 'SP East Godavari', 15.0, 'East Godavari')
ON CONFLICT (name) DO NOTHING;

-- Insert sample emergency call tickets
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
  raw_transcripts,
  emergency_services_needed,
  witnesses_present,
  suspects_involved,
  victims_involved,
  weapons_involved,
  vehicle_involved,
  emergency_recommendations
) VALUES 
(
  'Navina',
  '+91-8749898203',
  'Female',
  '2025-01-26',
  '14:30:32',
  'Accident',
  'Car Accident',
  10,
  'Car collided with a truck and flipped; 3 injured, one trapped.',
  'APSRTC Bus Depot, Kurnool Bypass Road',
  'APSRTC Bus Depot, Kurnool Bypass Road, Kurnool, Andhra Pradesh',
  15.8281,
  78.0373,
  'Voice',
  'Pending',
  'Hello, this is Navina calling from Kurnool. There has been a serious car accident at the APSRTC Bus Depot on the bypass road. A car collided with a truck and flipped over. There are 3 people injured and one person is trapped inside. We need immediate medical assistance and fire rescue. My number is 8749898203.',
  '{"en-IN": "Hello, this is Navina calling from Kurnool. There has been a serious car accident at the APSRTC Bus Depot on the bypass road. A car collided with a truck and flipped over. There are 3 people injured and one person is trapped inside. We need immediate medical assistance and fire rescue. My number is 8749898203.", "te-IN": "హలో, నేను కర్నూలు నుండి నవీన మాట్లాడుతున్నాను. బైపాస్ రోడ్‌లోని APSRTC బస్ డిపో వద్ద తీవ్రమైన కార్ ప్రమాదం జరిగింది. ఒక కార్ ట్రక్‌తో ఢీకొని తిరగబడింది. 3 మంది గాయపడ్డారు మరియు ఒక వ్యక్తి లోపల చిక్కుకున్నారు. మాకు వెంటనే వైద్య సహాయం మరియు అగ్నిమాపక బృందం అవసరం. నా నంబర్ 8749898203.", "hi-IN": "हैलो, मैं कुर्नूल से नवीना बोल रही हूं। बाईपास रोड पर APSRTC बस डिपो में एक गंभीर कार दुर्घटना हुई है। एक कार ट्रक से टकरा गई और पलट गई। 3 लोग घायल हैं और एक व्यक्ति अंदर फंसा हुआ है। हमें तत्काल चिकित्सा सहायता और अग्निशमन बचाव की आवश्यकता है। मेरा नंबर 8749898203 है।"}',
  'Police, Ambulance, Fire',
  true,
  'Two men in truck',
  'Three people in car',
  false,
  true,
  ARRAY['Police', 'Ambulance', 'Fire']
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
  '{"en-IN": "Hello, I want to report a chain snatching incident. Two men on a motorcycle just snatched a woman''s gold chain near Central Market and escaped towards the main road. This happened 5 minutes ago. The woman is injured and shaken. My name is Rajesh Kumar, phone 9876543210.", "te-IN": "హలో, నేను చైన్ స్నాచింగ్ సంఘటనను నివేదించాలనుకుంటున్నాను. ఇద్దరు పురుషులు మోటార్‌సైకిల్‌లో సెంట్రల్ మార్కెట్ వద్ద ఒక మహిళ గోల్డ్ చైన్‌ని స్నాచ్ చేసి మెయిన్ రోడ్ వైపు తప్పించుకున్నారు. ఇది 5 నిమిషాల క్రితం జరిగింది. ఆ మహిళ గాయపడింది మరియు కంగారుపడింది. నా పేరు రాజేష్ కుమార్, ఫోన్ 9876543210.", "hi-IN": "हैलो, मैं एक चेन स्नैचिंग की घटना की रिपोर्ट करने के लिए कॉल कर रहा हूं। दो आदमी मोटरसाइकिल पर सेंट्रल मार्केट के पास एक महिला की सोने की चेन छीनकर मेन रोड की तरफ भाग गए। यह 5 मिनट पहले हुआ। महिला घायल और परेशान है। मेरा नाम राजेश कुमार है, फोन 9876543210।"}',
  'Police',
  true,
  'Two men on motorcycle',
  'One woman',
  false,
  true,
  ARRAY['Police']
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
  '{"en-IN": "Emergency! I am calling to report an assault in progress. A man is beating a woman on MG Road near the bank. She is screaming for help and there are people gathering. Please send police immediately. My name is Priya Sharma, phone 8765432109.", "te-IN": "అత్యవసరం! నేను జరుగుతున్న దాడిని నివేదించడానికి కాల్ చేస్తున్నాను. ఒక వ్యక్తి బ్యాంక్ వద్ద MG రోడ్‌లో ఒక మహిళను కొడుతున్నారు. ఆమె సహాయం కోసం అరుస్తున్నారు మరియు ప్రజలు చేరుకుంటున్నారు. దయచేసి వెంటనే పోలీసులను పంపండి. నా పేరు ప్రియ శర్మ, ఫోన్ 8765432109.", "hi-IN": "आपातकाल! मैं एक चल रहे हमले की रिपोर्ट करने के लिए कॉल कर रही हूं। एक आदमी बैंक के पास MG रोड पर एक महिला को पीट रहा है। वह मदद के लिए चिल्ला रही है और लोग इकट्ठे हो रहे हैं। कृपया तुरंत पुलिस भेजें। मेरा नाम प्रिया शर्मा है, फोन 8765432109।"}',
  'Police, Ambulance',
  true,
  'One man',
  'One woman',
  false,
  false,
  ARRAY['Police', 'Ambulance']
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
  '{"en-IN": "Please help me! My 8-year-old daughter Lakshmi has been missing for 2 hours. She was wearing a red dress and was last seen near the Sri Venkateswara Temple. I am Anitha Reddy, my number is 7654321098. Please help me find her.", "te-IN": "దయచేసి నాకు సహాయం చేయండి! నా 8 సంవత్సరాల కుమార్తె లక్ష్మి 2 గంటలుగా తప్పిపోయింది. ఆమె ఎరుపు డ్రెస్ ధరించి ఉంది మరియు శ్రీ వెంకటేశ్వర ఆలయం వద్ద చివరిసారి చూసారు. నేను అనిత రెడ్డి, నా నంబర్ 7654321098. దయచేసి ఆమెను కనుగొనడంలో నాకు సహాయం చేయండి.", "hi-IN": "कृपया मेरी मदद करें! मेरी 8 साल की बेटी लक्ष्मी 2 घंटे से गायब है। वह लाल ड्रेस पहने हुई थी और श्री वेंकटेश्वर मंदिर के पास आखिरी बार देखी गई थी। मैं अनिता रेड्डी हूं, मेरा नंबर 7654321098 है। कृपया उसे खोजने में मेरी मदद करें।"}',
  'Police, Child Helpline',
  true,
  'Unknown',
  '8-year-old girl',
  false,
  false,
  ARRAY['Police', 'Child Helpline']
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
  '{"en-IN": "I am calling to report domestic violence in my apartment complex. My neighbor in flat 304 is beating his wife. I can hear her screaming and crying. This has been going on for 30 minutes. Please send help immediately. My name is Suresh Babu, phone 6543210987.", "te-IN": "నేను నా అపార్ట్మెంట్ కాంప్లెక్స్‌లో దేశీయ హింసను నివేదించడానికి కాల్ చేస్తున్నాను. ఫ్లాట్ 304లోని నా పొరుగువారు తన భార్యను కొడుతున్నారు. నేను ఆమె అరుపులు మరియు ఏడుపులు వినగలను. ఇది 30 నిమిషాలుగా జరుగుతున్నది. దయచేసి వెంటనే సహాయం పంపండి. నా పేరు సురేష్ బాబు, ఫోన్ 6543210987.", "hi-IN": "मैं अपने अपार्टमेंट कॉम्प्लेक्स में घरेलू हिंसा की रिपोर्ट करने के लिए कॉल कर रहा हूं। फ्लैट 304 में मेरा पड़ोसी अपनी पत्नी को पीट रहा है। मैं उसकी चीखें और रोना सुन सकता हूं। यह 30 मिनट से चल रहा है। कृपया तुरंत मदद भेजें। मेरा नाम सुरेश बाबू है, फोन 6543210987।"}',
  'Police, Women Helpline',
  true,
  'Husband',
  'Wife',
  false,
  false,
  ARRAY['Police', 'Women Helpline']
);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active tickets with police station information
CREATE OR REPLACE VIEW active_tickets_with_stations AS
SELECT 
  t.*,
  ps.name as assigned_station_name,
  ps.contact_number as station_contact,
  ps.officer_in_charge as station_officer
FROM call_112_tickets t
LEFT JOIN police_stations ps ON ps.is_active = true
WHERE t.review_status != 'Rejected';

-- View for processing statistics
CREATE OR REPLACE VIEW processing_statistics AS
SELECT 
  DATE(created_at) as processing_date,
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN review_status = 'Pending' THEN 1 END) as pending_tickets,
  COUNT(CASE WHEN review_status = 'Reviewed' THEN 1 END) as reviewed_tickets,
  AVG(severity) as avg_severity
FROM call_112_tickets
GROUP BY DATE(created_at)
ORDER BY processing_date DESC;

-- View for crime type statistics
CREATE OR REPLACE VIEW crime_type_statistics AS
SELECT 
  crime_type,
  crime_subtype,
  COUNT(*) as incident_count,
  AVG(severity) as avg_severity,
  COUNT(CASE WHEN review_status = 'Pending' THEN 1 END) as pending_count
FROM call_112_tickets
GROUP BY crime_type, crime_subtype
ORDER BY incident_count DESC;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE call_112_tickets IS 'Main table for storing emergency call tickets from 112 system';
COMMENT ON TABLE police_stations IS 'Police stations information with jurisdiction and contact details';
COMMENT ON TABLE audio_files IS 'Audio evidence files uploaded for processing';
COMMENT ON TABLE processing_logs IS 'Logs for tracking audio processing steps and errors';
COMMENT ON TABLE crime_types IS 'Lookup table for crime types and their default severities';
COMMENT ON TABLE crime_subtypes IS 'Lookup table for crime subtypes with specific severities';
COMMENT ON TABLE emergency_services IS 'Lookup table for emergency services and their contact numbers';

COMMENT ON COLUMN call_112_tickets.police_station_info IS 'JSON object containing assigned police station details';
COMMENT ON COLUMN call_112_tickets.coverage_area IS 'JSON object containing coverage area and jurisdiction information';
COMMENT ON COLUMN call_112_tickets.raw_transcripts IS 'JSON object containing transcripts in multiple languages';
COMMENT ON COLUMN call_112_tickets.processing_steps IS 'JSON object containing processing step results and timings';

-- =====================================================
-- FINAL NOTES
-- =====================================================

/*
This schema provides a comprehensive database structure for the Andhra Pradesh Police
Emergency Call Analysis System. Key features include:

1. Enhanced ticket storage with multilingual transcripts
2. Police station management with jurisdiction tracking
3. Audio file processing and storage
4. Comprehensive logging and error tracking
5. Lookup tables for crime types and emergency services
6. Performance optimized indexes and views
7. Row Level Security for data protection
8. Sample data for testing and development

To use this schema:
1. Run this file in your Supabase SQL editor
2. Create a storage bucket named 'audio-evidence' with public read access
3. Update your environment variables with the correct API keys
4. Test the system with the provided sample data

The system supports:
- Multilingual audio processing (English, Telugu, Hindi)
- Dynamic police station assignment
- Geographic coverage area calculation
- Emergency service recommendations
- Comprehensive incident tracking and reporting
*/ 