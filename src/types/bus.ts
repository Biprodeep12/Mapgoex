export interface BusStop {
  stopId: string;
  name: string;
  coords: [number, number];
}

export interface BusData {
  startPoint: {
    name: string;
    coords: [number, number];
  };
  endPoint: {
    name: string;
    coords: [number, number];
  };
  busStops: BusStop[];
}

export type BusRoutes = Record<string, BusData>;
