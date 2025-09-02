export interface BusStop {
  stopId: string;
  name: string;
  coords: [number, number];
  estimatedTime?: string;
  distance?: number;
  isTerminal?: boolean;
}

export interface BusData {
  id: string;
  label: string;
  startPoint: {
    name: string;
    coords: [number, number];
  };
  endPoint: {
    name: string;
    coords: [number, number];
  };
  busStops: BusStop[];
  totalDistance?: number;
  estimatedDuration?: number;
  frequency?: string;
  operatingHours?: {
    start: string;
    end: string;
  };
}

export interface BusRoute {
  id: string;
  label: string;
  A: [number, number];
  B: [number, number];
  NameA: string;
  NameB: string;
  color?: string;
  isActive?: boolean;
}

export type BusRoutes = Record<string, BusData>;

export interface LocationInfo {
  suburb?: string;
  city?: string;
  village?: string;
  town?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

export interface GeocodingResult {
  lat: string;
  lon: string;
  address: LocationInfo;
}
