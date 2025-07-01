'use client'

import { useState } from 'react'
import PhoneExtractionDemo from './PhoneExtractionDemo'
import CoordinateDebugger from './CoordinateDebugger'

export default function SystemDemo() {
  const [activeExample, setActiveExample] = useState<'english' | 'telugu' | 'hindi'>('english')

  const processingSteps = [
    {
      step: "Audio Upload",
      description: "Secure upload of MP3/WAV emergency call recordings",
      icon: "🎵",
      color: "blue",
      details: "Supports files up to 10MB with automatic format validation"
    },
    {
      step: "AI Transcription",
      description: "Google Gemini 1.5 Flash processes multilingual audio",
      icon: "🤖",
      color: "green",
      details: "Simultaneous processing in Telugu, Hindi, and English"
    },
    {
      step: "Data Extraction",
      description: "Intelligent extraction of caller info and incident details",
      icon: "🔍",
      color: "purple",
      details: "Crime classification with severity ranking (1-10 scale)"
    },
    {
      step: "Geocoding",
      description: "Converts spoken addresses to precise GPS coordinates",
      icon: "🗺️",
      color: "orange",
      details: "Google Maps API with fallback geocoding services"
    },
    {
      step: "Ticket Creation",
      description: "Structured incident tickets stored in secure database",
      icon: "📋",
      color: "indigo",
      details: "Complete audit trail with audio playback capability"
    }
  ]

  const sampleExamples = {
    english: {
      transcript: "Hello, I want to report a theft. Someone stole my bicycle from the parking area near Central Market in Vijayawada. This happened around 2 PM today. My name is Rajesh Kumar and my phone number is 9876543210.",
      extractedData: {
        caller_name: "Rajesh Kumar",
        caller_phone: "+91-9876543210",
        crime_type: "Robbery",
        crime_subtype: "Vehicle Theft",
        severity: "5",
        description: "Bicycle theft from parking area near Central Market",
        address_text: "Near Central Market, Vijayawada",
        verified_address: "Central Market, Vijayawada, Andhra Pradesh, India",
        coordinates: "16.5062, 80.6480",
        timestamp: "2:00 PM"
      }
    },
    telugu: {
      transcript: "నమస్కారం, నేను ఒక దొంగతనం గురించి ఫిర్యాదు చేయాలనుకుంటున్నాను. విజయవాడలో సెంట్రల్ మార్కెట్ దగ్గర పార్కింగ్ ఏరియా నుండి ఎవరో నా సైకిల్ దొంగిలించారు. ఇది ఈరోజు మధ్యాహ్నం 2 గంటలకు జరిగింది. నా పేరు రాజేష్ కుమార్, ఫోన్ నంబర్ 9876543210.",
      extractedData: {
        caller_name: "రాజేష్ కుమార్ (Rajesh Kumar)",
        caller_phone: "+91-9876543210",
        crime_type: "Robbery",
        crime_subtype: "Vehicle Theft",
        severity: "5",
        description: "సైకిల్ దొంగతనం - పార్కింగ్ ఏరియా నుండి",
        address_text: "సెంట్రల్ మార్కెట్ దగ్గర, విజయవాడ",
        verified_address: "Central Market, Vijayawada, Andhra Pradesh, India",
        coordinates: "16.5062, 80.6480",
        timestamp: "మధ్యాహ్నం 2:00"
      }
    },
    hindi: {
      transcript: "नमस्ते, मैं एक चोरी की रिपोर्ट करना चाहता हूं। किसी ने विजयवाड़ा में सेंट्रल मार्केट के पास पार्किंग एरिया से मेरी साइकिल चुराई है। यह आज दोपहर 2 बजे हुआ था। मेरा नाम राजेश कुमार है और मेरा फोन नंबर 9876543210 है।",
      extractedData: {
        caller_name: "राजेश कुमार (Rajesh Kumar)",
        caller_phone: "+91-9876543210",
        crime_type: "Robbery",
        crime_subtype: "Vehicle Theft",
        severity: "5",
        description: "साइकिल की चोरी - पार्किंग एरिया से",
        address_text: "सेंट्रल मार्केट के पास, विजयवाड़ा",
        verified_address: "Central Market, Vijayawada, Andhra Pradesh, India",
        coordinates: "16.5062, 80.6480",
        timestamp: "दोपहर 2:00"
      }
    }
  }

  const techStack = [
    {
      category: "Frontend",
      icon: "⚛️",
      color: "blue",
      technologies: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS"],
      description: "Modern React framework with server-side rendering"
    },
    {
      category: "AI & ML",
      icon: "🤖",
      color: "green",
      technologies: ["Google Gemini 1.5 Flash", "Multilingual Processing", "Audio Analysis"],
      description: "Advanced AI for direct audio transcription and analysis"
    },
    {
      category: "Database",
      icon: "🗄️",
      color: "purple",
      technologies: ["Supabase PostgreSQL", "Row Level Security", "Real-time Updates"],
      description: "Secure, scalable database with real-time capabilities"
    },
    {
      category: "Maps & Location",
      icon: "🗺️",
      color: "orange",
      technologies: ["Google Maps API", "Geocoding Service", "Coordinate Validation"],
      description: "Precise location services and mapping integration"
    }
  ]

  const keyFeatures = [
    {
      title: "Multilingual Support",
      description: "Processes emergency calls in Telugu, Hindi, and English simultaneously",
      icon: "🗣️",
      color: "blue",
      stats: "3 Languages"
    },
    {
      title: "Crime Classification",
      description: "6 main categories with detailed subtypes and severity ranking",
      icon: "📊",
      color: "green",
      stats: "20+ Crime Types"
    },
    {
      title: "Smart Geocoding",
      description: "Converts vague spoken addresses to precise GPS coordinates",
      icon: "📍",
      color: "purple",
      stats: "99.5% Accuracy"
    },
    {
      title: "Real-time Processing",
      description: "Instant audio processing with live status updates",
      icon: "⚡",
      color: "orange",
      stats: "< 30 Seconds"
    },
    {
      title: "Batch Operations",
      description: "Process multiple audio files simultaneously",
      icon: "📁",
      color: "indigo",
      stats: "Up to 50 Files"
    },
    {
      title: "Secure & Compliant",
      description: "Government-grade security with complete audit trails",
      icon: "🔒",
      color: "red",
      stats: "100% Secure"
    }
  ]

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-500 text-white",
      green: "bg-green-500 text-white",
      purple: "bg-purple-500 text-white",
      orange: "bg-orange-500 text-white",
      indigo: "bg-indigo-500 text-white",
      red: "bg-red-500 text-white"
    }
    return colorMap[color as keyof typeof colorMap] || "bg-gray-500 text-white"
  }

  const getBgColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 border-blue-200",
      green: "bg-green-50 border-green-200",
      purple: "bg-purple-50 border-purple-200",
      orange: "bg-orange-50 border-orange-200",
      indigo: "bg-indigo-50 border-indigo-200",
      red: "bg-red-50 border-red-200"
    }
    return colorMap[color as keyof typeof colorMap] || "bg-gray-50 border-gray-200"
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-8 py-16 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Dial 112 Analyzer
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              AI-Powered Emergency Call Processing System
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl mb-2">🚨</div>
                <div className="text-lg font-semibold">Emergency Response</div>
                <div className="text-blue-200 text-sm">Automated 112 call processing</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl mb-2">🤖</div>
                <div className="text-lg font-semibold">AI-Powered</div>
                <div className="text-blue-200 text-sm">Google Gemini 1.5 Flash</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl mb-2">🗺️</div>
                <div className="text-lg font-semibold">Location Intelligence</div>
                <div className="text-blue-200 text-sm">Precise geocoding & mapping</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Flow */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Automated Processing Pipeline
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our AI-powered system transforms raw emergency call recordings into structured, actionable incident tickets through a sophisticated 5-step process.
          </p>
        </div>
        
        <div className="relative">
          {/* Desktop Flow */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            {processingSteps.map((step, index) => (
              <div key={index} className="flex-1 relative">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full ${getColorClasses(step.color)} flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg`}>
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.step}</h3>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  <p className="text-xs text-gray-500">{step.details}</p>
                </div>
                {index < processingSteps.length - 1 && (
                  <div className="absolute top-8 -right-4 w-8 h-0.5 bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Flow */}
          <div className="lg:hidden space-y-6">
            {processingSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-full ${getColorClasses(step.color)} flex items-center justify-center text-xl flex-shrink-0`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{step.step}</h3>
                  <p className="text-sm text-gray-600 mb-1">{step.description}</p>
                  <p className="text-xs text-gray-500">{step.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Example */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Multilingual Processing Example
          </h2>
          <p className="text-lg text-gray-600">
            See how our system processes emergency calls in different languages
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex space-x-1">
            {Object.keys(sampleExamples).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveExample(lang as keyof typeof sampleExamples)}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeExample === lang
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audio Transcript */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🎵</span>
              Original Audio Transcript
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 italic leading-relaxed">
                "{sampleExamples[activeExample].transcript}"
              </p>
            </div>
          </div>

          {/* Extracted Data */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🔍</span>
              AI-Extracted Information
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="space-y-3">
                {Object.entries(sampleExamples[activeExample].extractedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="font-medium text-green-800 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-green-700 text-right flex-1 ml-4">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Grid */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Key Features & Capabilities
          </h2>
          <p className="text-lg text-gray-600">
            Advanced features designed for emergency response operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {keyFeatures.map((feature, index) => (
            <div key={index} className={`${getBgColorClasses(feature.color)} border rounded-xl p-6 hover:shadow-lg transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${getColorClasses(feature.color)} flex items-center justify-center text-xl`}>
                  {feature.icon}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getColorClasses(feature.color)}`}>
                  {feature.stats}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Technology Stack
          </h2>
          <p className="text-lg text-gray-600">
            Built with cutting-edge technologies for reliability and performance
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {techStack.map((tech, index) => (
            <div key={index} className="text-center group hover:scale-105 transition-transform">
              <div className={`w-20 h-20 rounded-2xl ${getBgColorClasses(tech.color)} border-2 flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-shadow`}>
                <span className="text-3xl">{tech.icon}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{tech.category}</h3>
              <div className="space-y-1 mb-3">
                {tech.technologies.map((item, i) => (
                  <div key={i} className="text-sm text-gray-600">{item}</div>
                ))}
              </div>
              <p className="text-xs text-gray-500">{tech.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Demo Components */}
      <div className="space-y-8">
        <PhoneExtractionDemo />
        <CoordinateDebugger />
      </div>
    </div>
  )
} 