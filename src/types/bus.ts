export interface BusStop {
  stopId: string;
  name: string;
  coords: [number, number];
}

export interface BusData {
  Route: string;
  rating: number;
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

export interface BusRoute {
  id: string;
  A: [number, number];
  B: [number, number];
  NameA: string;
  NameB: string;
  forward: boolean;
}