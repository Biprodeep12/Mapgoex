import * as turf from "@turf/turf";

const geocodingCache = new Map<string, string>();

export const clearGeocodingCache = (): void => {
  geocodingCache.clear();
};

export const getCacheStats = (): { size: number; keys: string[] } => {
  return {
    size: geocodingCache.size,
    keys: Array.from(geocodingCache.keys())
  };
};

export function isAtStop(busPos: [number, number], stopPos: [number, number]): boolean {
  const busPoint = turf.point(busPos);
  const stopPoint = turf.point(stopPos);

  const distanceKm = turf.distance(busPoint, stopPoint, { units: "kilometers" });
  const distanceMeters = distanceKm * 1000;
  return distanceMeters <= 100;
}