export interface GeocodeCandidate {
  place_id: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
    viewport?: {
      northeast: { lat: number; lng: number }
      southwest: { lat: number; lng: number }
    }
    location_type?: string
  }
  types: string[]
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  name?: string
  vicinity?: string
  rating?: number
  user_ratings_total?: number
}

export interface GeocodeResult {
  candidates: GeocodeCandidate[]
  selected: GeocodeCandidate | null
  confidence: number
  reasoning?: string
}

export class GeocodingService {
  private static readonly API_KEY = process.env.GOOGLE_MAPS_API_KEY!
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api'

  static async searchLocation(address: string): Promise<GeocodeCandidate[]> {
    try {
      // Clean and format the address for better geocoding results
      const formattedAddress = this.formatAddressForIndia(address)
      console.log('Formatted address for geocoding:', formattedAddress)
      
      // Try multiple geocoding strategies for better accuracy
      const results = await Promise.allSettled([
        this.geocodeWithStreetLevel(formattedAddress),
        this.geocodeWithPlacesAPI(formattedAddress),
        this.geocodeWithBasicAPI(formattedAddress)
      ])
      
      // Combine and deduplicate results
      const allCandidates: GeocodeCandidate[] = []
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          console.log(`Strategy ${index + 1} found ${result.value.length} candidates`)
          allCandidates.push(...result.value)
        }
      })
      
      // Remove duplicates based on place_id and coordinates
      const uniqueCandidates = this.removeDuplicateCandidates(allCandidates)
      console.log('Unique candidates after deduplication:', uniqueCandidates.length)
      
      // Sort by relevance (street-level first, then locality, then administrative)
      const sortedCandidates = this.sortCandidatesByRelevance(uniqueCandidates)
      
      // If we have multiple candidates, use distance-based filtering for better accuracy
      if (sortedCandidates.length > 1) {
        // Use the first candidate as reference point for distance calculation
        const referenceLat = sortedCandidates[0].geometry.location.lat;
        const referenceLng = sortedCandidates[0].geometry.location.lng;
        
        // Filter and sort by distance within 900m radius
        const distanceFilteredCandidates = this.filterAndSortCandidatesByDistance(
          sortedCandidates, 
          referenceLat, 
          referenceLng, 
          900 // 900m radius for emergency response
        );
        
        // Log distance information for each candidate
        distanceFilteredCandidates.forEach((result, index) => {
          const distance = this.calculateDistance(
            referenceLat, referenceLng,
            result.geometry.location.lat,
            result.geometry.location.lng
          );
          console.log(`Candidate ${index + 1} (${distance.toFixed(0)}m):`, {
            formatted_address: result.formatted_address,
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            types: result.types,
            location_type: result.geometry.location_type,
            distance: `${distance.toFixed(0)}m`
          })
        })
        
        return distanceFilteredCandidates;
      }
      
      // Log the selected results
      sortedCandidates.forEach((result, index) => {
        console.log(`Candidate ${index + 1}:`, {
          formatted_address: result.formatted_address,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          types: result.types,
          location_type: result.geometry.location_type
        })
      })
      
      return sortedCandidates
    } catch (error) {
      console.error('Error geocoding address:', error)
      throw error
    }
  }

  private static async geocodeWithStreetLevel(address: string): Promise<GeocodeCandidate[]> {
    try {
      // Use Geocoding API with result_type=street_address for street-level accuracy
      const url = `${this.BASE_URL}/geocode/json?address=${encodeURIComponent(address)}&key=${this.API_KEY}&region=in&components=country:IN&result_type=street_address|route|premise`
      
      const response = await fetch(url)
      if (!response.ok) return []
      
      const data = await response.json()
      if (data.status !== 'OK' || !data.results) return []
      
      return data.results.filter((result: GeocodeCandidate) => 
        result.geometry.location_type === 'ROOFTOP' || 
        result.geometry.location_type === 'RANGE_INTERPOLATED' ||
        result.types.includes('street_address') ||
        result.types.includes('route')
      )
    } catch (error) {
      console.error('Street-level geocoding failed:', error)
      return []
    }
  }

  private static async geocodeWithPlacesAPI(address: string): Promise<GeocodeCandidate[]> {
    try {
      // Use Places API Text Search for better POI matching
      const url = `${this.BASE_URL}/place/textsearch/json?query=${encodeURIComponent(address)}&key=${this.API_KEY}&region=in&type=establishment`
      
      const response = await fetch(url)
      if (!response.ok) return []
      
      const data = await response.json()
      if (data.status !== 'OK' || !data.results) return []
      
      // Convert Places API results to GeocodeCandidate format
      return data.results.map((place: any) => ({
        place_id: place.place_id,
        formatted_address: place.formatted_address,
        geometry: {
          location: place.geometry.location,
          viewport: place.geometry.viewport,
          location_type: 'GEOMETRIC_CENTER'
        },
        types: place.types || [],
        address_components: [],
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total
      }))
    } catch (error) {
      console.error('Places API geocoding failed:', error)
      return []
    }
  }

  private static async geocodeWithBasicAPI(address: string): Promise<GeocodeCandidate[]> {
    try {
      const url = `${this.BASE_URL}/geocode/json?address=${encodeURIComponent(address)}&key=${this.API_KEY}&region=in&components=country:IN`
      
      const response = await fetch(url)
      if (!response.ok) return []
      
      const data = await response.json()
      if (data.status !== 'OK' || !data.results) return []
      
      // Filter results to focus on Andhra Pradesh or nearby areas
      return data.results.filter((result: GeocodeCandidate) => {
        const address = result.formatted_address.toLowerCase()
        return address.includes('andhra pradesh') || 
               address.includes('telangana') || 
               address.includes('india') ||
               result.types.includes('locality') ||
               result.types.includes('administrative_area_level_1')
      })
    } catch (error) {
      console.error('Basic geocoding failed:', error)
      return []
    }
  }

  private static removeDuplicateCandidates(candidates: GeocodeCandidate[]): GeocodeCandidate[] {
    const seen = new Set<string>()
    const unique: GeocodeCandidate[] = []
    
    for (const candidate of candidates) {
      const key = `${candidate.place_id}-${candidate.geometry.location.lat}-${candidate.geometry.location.lng}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(candidate)
      }
    }
    
    return unique
  }

  private static sortCandidatesByRelevance(candidates: GeocodeCandidate[]): GeocodeCandidate[] {
    return candidates.sort((a, b) => {
      // Priority 1: Street-level accuracy
      const aStreetLevel = a.geometry.location_type === 'ROOFTOP' || a.types.includes('street_address')
      const bStreetLevel = b.geometry.location_type === 'ROOFTOP' || b.types.includes('street_address')
      
      if (aStreetLevel && !bStreetLevel) return -1
      if (!aStreetLevel && bStreetLevel) return 1
      
      // Priority 2: Route/street names
      const aRoute = a.types.includes('route')
      const bRoute = b.types.includes('route')
      
      if (aRoute && !bRoute) return -1
      if (!aRoute && bRoute) return 1
      
      // Priority 3: Establishment/POI with distance consideration
      const aEstablishment = a.types.includes('establishment') || a.types.includes('point_of_interest')
      const bEstablishment = b.types.includes('establishment') || b.types.includes('point_of_interest')
      
      if (aEstablishment && !bEstablishment) return -1
      if (!aEstablishment && bEstablishment) return 1
      
      // Priority 4: Rating (for places)
      if (a.rating && b.rating) {
        return b.rating - a.rating
      }
      
      return 0
    })
  }

  // Calculate distance between two coordinates using Haversine formula
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance * 1000; // Convert to meters
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Filter candidates within specified radius and sort by relevance
  private static filterAndSortCandidatesByDistance(candidates: GeocodeCandidate[], targetLat: number, targetLng: number, maxRadiusMeters: number = 900): GeocodeCandidate[] {
    if (candidates.length === 0) return candidates;

    // Calculate distances and filter
    const candidatesWithDistance = candidates.map(candidate => ({
      ...candidate,
      distance: this.calculateDistance(
        targetLat, targetLng,
        candidate.geometry.location.lat,
        candidate.geometry.location.lng
      )
    }));

    // Filter by distance
    const withinRadius = candidatesWithDistance.filter(c => c.distance <= maxRadiusMeters);
    console.log(`Distance filtering: ${candidates.length} total, ${withinRadius.length} within ${maxRadiusMeters}m radius`);

    // Sort by distance first, then by relevance
    return withinRadius.sort((a, b) => {
      // Priority 1: Distance (closer is better)
      if (Math.abs(a.distance - b.distance) > 100) { // If distance difference is significant
        return a.distance - b.distance;
      }

      // Priority 2: Street-level accuracy
      const aStreetLevel = a.geometry.location_type === 'ROOFTOP' || a.types.includes('street_address');
      const bStreetLevel = b.geometry.location_type === 'ROOFTOP' || b.types.includes('street_address');
      
      if (aStreetLevel && !bStreetLevel) return -1;
      if (!aStreetLevel && bStreetLevel) return 1;

      // Priority 3: Route/street names
      const aRoute = a.types.includes('route');
      const bRoute = b.types.includes('route');
      
      if (aRoute && !bRoute) return -1;
      if (!aRoute && bRoute) return 1;

      // Priority 4: Establishment/POI
      const aEstablishment = a.types.includes('establishment') || a.types.includes('point_of_interest');
      const bEstablishment = b.types.includes('establishment') || b.types.includes('point_of_interest');
      
      if (aEstablishment && !bEstablishment) return -1;
      if (!aEstablishment && bEstablishment) return 1;

      // Priority 5: Rating (for places)
      if (a.rating && b.rating) {
        return b.rating - a.rating;
      }

      return 0;
    });
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `${this.BASE_URL}/geocode/json?latlng=${lat},${lng}&key=${this.API_KEY}&result_type=street_address|route|premise`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address
      }
      
      return `${lat}, ${lng}`
    } catch (error) {
      console.error('Error reverse geocoding:', error)
      return `${lat}, ${lng}`
    }
  }

  private static formatAddressForIndia(address: string): string {
    // Enhanced address formatting for better geocoding accuracy in Andhra Pradesh
    const lowerAddress = address.toLowerCase()
    
    // Common AP district and city mappings
    const apLocations = [
      'visakhapatnam', 'vijayawada', 'guntur', 'nellore', 'kurnool', 'rajahmundry', 
      'tirupati', 'anantapur', 'kadapa', 'eluru', 'ongole', 'machilipatnam',
      'vizianagaram', 'proddatur', 'chittoor', 'hindupur', 'srikakulam'
    ]
    
    // Check if it's already a known AP location
    const isKnownAPLocation = apLocations.some(city => lowerAddress.includes(city))
    
    if (!lowerAddress.includes('andhra pradesh') && !lowerAddress.includes('india')) {
      if (isKnownAPLocation) {
        return `${address}, Andhra Pradesh, India`
      } else {
        // Try with just India first, then fall back to AP if needed
        return `${address}, Andhra Pradesh, India`
      }
    }
    
    if (!lowerAddress.includes('india')) {
      return `${address}, India`
    }
    
    return address
  }

  static async interactiveGeocode(addressText: string): Promise<GeocodeResult> {
    try {
      console.log('Starting enhanced geocoding for address:', addressText)
      
      // Check if address is meaningful (not generic/default text)
      if (!addressText || 
          addressText.trim() === '' ||
          addressText.toLowerCase().includes('location not specified') ||
          addressText.toLowerCase().includes('not mentioned') ||
          addressText.toLowerCase().includes('unclear') ||
          addressText.toLowerCase().includes('default')) {
        console.log('Address is not specific enough for geocoding:', addressText)
        return {
          candidates: [],
          selected: null,
          confidence: 0,
          reasoning: 'Address not specific enough for accurate geocoding'
        }
      }
      
      // Check for API key
      if (!this.API_KEY) {
        console.error('Google Maps API key not found')
        return {
          candidates: [],
          selected: null,
          confidence: 0,
          reasoning: 'Google Maps API key not configured'
        }
      }
      
      // Get candidate locations using enhanced multi-API approach
      const candidates = await this.searchLocation(addressText)
      console.log('Enhanced geocoding candidates found:', candidates.length)
      
      if (candidates.length === 0) {
        console.log('No candidates found for the specific address')
        return {
          candidates: [],
          selected: null,
          confidence: 0,
          reasoning: 'No geocoding results found for the specified address'
        }
      }
      
      // If only one candidate, auto-select it with high confidence
      if (candidates.length === 1) {
        console.log('Single candidate selected:', candidates[0].formatted_address)
        return {
          candidates,
          selected: candidates[0],
          confidence: 0.9,
          reasoning: 'Only one location found, auto-selected'
        }
      }
      
      // Multiple candidates - select the most relevant one
      const topCandidate = candidates[0]
      console.log('Top candidate selected:', topCandidate.formatted_address)
      
      // Calculate confidence based on location type, types, and distance
      let confidence = 0.7
      
      // Base confidence on location type
      if (topCandidate.geometry.location_type === 'ROOFTOP') confidence = 0.95
      else if (topCandidate.types.includes('street_address')) confidence = 0.9
      else if (topCandidate.types.includes('route')) confidence = 0.85
      else if (topCandidate.types.includes('establishment')) confidence = 0.8
      
      // Adjust confidence based on distance if available
      if ('distance' in topCandidate) {
        const distance = (topCandidate as any).distance;
        if (distance <= 50) confidence = Math.min(confidence + 0.05, 1.0); // Bonus for very close
        else if (distance <= 200) confidence = confidence; // Keep current confidence
        else if (distance <= 500) confidence = Math.max(confidence - 0.05, 0.7); // Slight penalty
        else if (distance <= 900) confidence = Math.max(confidence - 0.1, 0.6); // More penalty
        else confidence = Math.max(confidence - 0.2, 0.5); // Significant penalty for far locations
        
        console.log(`Distance-based confidence adjustment: ${distance.toFixed(0)}m -> ${(confidence * 100).toFixed(0)}% confidence`);
      }
      
      return {
        candidates,
        selected: topCandidate,
        confidence,
        reasoning: 'Multiple candidates found, selected the most relevant result within 900m radius'
      }
    } catch (error) {
      console.error('Error in enhanced interactive geocoding:', error)
      return {
        candidates: [],
        selected: null,
        confidence: 0,
        reasoning: `Geocoding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
} 