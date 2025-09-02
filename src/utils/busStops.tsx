import axios from "axios";
import { GeocodingResult } from "@/types/bus";

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map<string, string>();

// Debounce function to limit API calls
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Generate cache key from coordinates
const getCacheKey = (lat: number, lon: number): string => 
  `${lat.toFixed(6)}_${lon.toFixed(6)}`;

/**
 * Fetches location information for given coordinates
 * @param coords - [longitude, latitude] coordinates
 * @returns Promise<string> - Location name or fallback text
 */
export const busStopsInfo = async (coords: [number, number]): Promise<string> => {
  if (!coords || coords.length !== 2) {
    return "Invalid coordinates";
  }

  const [lon, lat] = coords;
  const cacheKey = getCacheKey(lat, lon);
  
  // Check cache first
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=16&addressdetails=1`,
      {
        timeout: 5000,
        headers: {
          'User-Agent': 'MapGoEx/1.0'
        }
      }
    );
    
    const data: GeocodingResult = res.data;
    
    if (data.address) {
      const { suburb, city, state, country, village, town } = data.address;
      
      // Prioritize location names for better user experience
      let locationName = "Unknown location";
      
      if (suburb && city) {
        locationName = `${suburb}, ${city}`;
      } else if (city) {
        locationName = city;
      } else if (village) {
        locationName = village;
      } else if (town) {
        locationName = town;
      } else if (state) {
        locationName = state;
      } else if (country) {
        locationName = country;
      }
      
      // Cache the result
      geocodingCache.set(cacheKey, locationName);
      return locationName;
    }
    
    return "Location unavailable";
  } catch (err) {
    console.error("Error fetching location info:", err);
    
    // Return cached fallback if available, otherwise return error message
    const fallback = "Location unavailable";
    geocodingCache.set(cacheKey, fallback);
    return fallback;
  }
};

// Debounced version for better performance in rapid calls
export const busStopsInfoDebounced = debounce(busStopsInfo, 300);

// Clear cache function for memory management
export const clearGeocodingCache = (): void => {
  geocodingCache.clear();
};

// Get cache statistics
export const getCacheStats = (): { size: number; keys: string[] } => {
  return {
    size: geocodingCache.size,
    keys: Array.from(geocodingCache.keys())
  };
};