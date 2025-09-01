import { createContext, useContext, useState } from "react";
import axios from "axios";

interface MapContextType {
  userLocation: [number, number] | null;
  setUserLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  anonLocation: [number, number] | null;
  setAnonLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  routeGeoJSON: any;
  setRouteGeoJSON: React.Dispatch<React.SetStateAction<any>>;
  fetchRoute: (start: [number, number], end: [number, number]) => Promise<void>;
  mapCenter: mapCenterType;
  setMapCenter: React.Dispatch<React.SetStateAction<mapCenterType>>;
  busData: busDataType[];
  searchBuses: (query: string) => busDataType[];
  selectedBus: busDataType | null;
  setSelectedBus: React.Dispatch<React.SetStateAction<busDataType | null>>;
}

type busDataType = {
  label: string,
  Point1: [number,number],
  Point2: [number,number],
  Point1Name: string,
  Point2Name: string,
}

type mapCenterType = {
    center: [number,number]
    zoom: number
}

// Mock bus data
const mockBusData: busDataType[] = [
  {
    label: 'A15',
    Point1: [88.384, 22.458],
    Point2: [88.366, 22.518],
    Point1Name: 'Howrah Station',
    Point2Name: 'Esplanade',
  },
  {
    label: 'A20',
    Point1: [88.350, 22.500],
    Point2: [88.400, 22.450],
    Point1Name: 'Salt Lake City Centre',
    Point2Name: 'Park Street',
  },
  {
    label: 'B22',
    Point1: [88.350, 22.500],
    Point2: [88.400, 22.450],
    Point1Name: 'New Town',
    Point2Name: 'Dalhousie Square',
  },
  {
    label: 'C33',
    Point1: [88.320, 22.520],
    Point2: [88.420, 22.420],
    Point1Name: 'Airport',
    Point2Name: 'Sealdah Station',
  },
  {
    label: 'D44',
    Point1: [88.300, 22.540],
    Point2: [88.440, 22.400],
    Point1Name: 'Barrackpore',
    Point2Name: 'Garia',
  }
];

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mapCenter, setMapCenter] = useState<{ center: [number, number]; zoom: number }>({
        center: [88.3639, 22.5726],
        zoom: 15,
  })
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [anonLocation, setAnonLocation] = useState<[number, number] | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [selectedBus, setSelectedBus] = useState<busDataType | null>(null);

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const res = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        { coordinates: [start, end] },
        {
          headers: {
            Authorization: "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjczZGM4NTFmMDVkOTRiOTRhNzFmNTBlMmRhODI0OThhIiwiaCI6Im11cm11cjY0In0=",
            "Content-Type": "application/json",
          },
        }
      );
      setRouteGeoJSON(res.data);
      
    } catch (err) {
      console.error("ORS error:", err);
    }
  };

  const searchBuses = (query: string): busDataType[] => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return mockBusData.filter(bus => 
      bus.label.toLowerCase().includes(lowerQuery)
    );
  };

  return (
    <MapContext.Provider 
      value={{ 
        userLocation,
        setUserLocation, 
        anonLocation, 
        setAnonLocation, 
        routeGeoJSON,
        setRouteGeoJSON,
        fetchRoute, 
        mapCenter, 
        setMapCenter,
        busData: mockBusData,
        searchBuses,
        selectedBus,
        setSelectedBus
      }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used within MapProvider");
  return ctx;
}
