import axios from "axios";
import { GeocodingResult } from "@/types/bus";

const geocodingCache = new Map<string, string>();

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

const getCacheKey = (lat: number, lon: number): string => 
  `${lat.toFixed(6)}_${lon.toFixed(6)}`;

export const busStopsInfo = async (coords: [number, number]): Promise<string> => {
  if (!coords || coords.length !== 2) {
    return "Invalid coordinates";
  }

  const [lon, lat] = coords;
  const cacheKey = getCacheKey(lat, lon);
  
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
      
      geocodingCache.set(cacheKey, locationName);
      return locationName;
    }
    
    return "Location unavailable";
  } catch (err) {
    console.error("Error fetching location info:", err);
    
    const fallback = "Location unavailable";
    geocodingCache.set(cacheKey, fallback);
    return fallback;
  }
};

export const busStopsInfoDebounced = debounce(busStopsInfo, 300);

export const clearGeocodingCache = (): void => {
  geocodingCache.clear();
};

export const getCacheStats = (): { size: number; keys: string[] } => {
  return {
    size: geocodingCache.size,
    keys: Array.from(geocodingCache.keys())
  };
};