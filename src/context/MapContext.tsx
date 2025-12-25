import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { FeatureCollection, LineString, Feature  } from "geojson";
import axios from "axios";
import { BusData, BusRoute } from "@/types/bus";

interface MapContextType {
  userLocation: [number, number] | null;
  setUserLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>;

  sourceLocation: [number, number] | null;
  setSourceLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  
  anonLocation: [number, number] | null;
  setAnonLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  
  activeLiveBus: boolean;
  setActiveLiveBus: React.Dispatch<React.SetStateAction<boolean>>
  selectedBus: BusRoute | null;
  setSelectedBus: React.Dispatch<React.SetStateAction<BusRoute | null>>;
  selectedBusRouteInfo: BusData | null;
  setSelectedBusRouteInfo: React.Dispatch<React.SetStateAction<BusData | null>>;
  
  anonRouteGeoJSON: ORSGeoJSON | null;
  setAnonRouteGeoJSON: React.Dispatch<React.SetStateAction<ORSGeoJSON | null>>;
  routeGeoJSON: ORSGeoJSON | null;
  setRouteGeoJSON: React.Dispatch<React.SetStateAction<ORSGeoJSON | null>>;
  
  mapCenter: MapCenterType;
  setMapCenter: React.Dispatch<React.SetStateAction<MapCenterType>>;
  
  fetchBusInfo: (id: string) => Promise<void>;
  fetchRoute: (start: [number, number], end: [number, number]) => Promise<void>;
  clearRoute: () => void;
  clearBusSelection: () => void;
}

interface ORSMetadata {
  query: {
    profile: string;
  };
}

interface ORSGeoJSON extends FeatureCollection {
  features: Feature<LineString>[];
  metadata: ORSMetadata;
}

interface MapCenterType {
  center: [number, number];
  zoom: number;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [mapCenter, setMapCenter] = useState<MapCenterType>({
    center: [88.3639, 22.5726],
    zoom: 15,
  });
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sourceLocation, setSourceLocation] = useState<[number, number] | null>(null);
  const [anonLocation, setAnonLocation] = useState<[number, number] | null>(null);
  
  const [routeGeoJSON, setRouteGeoJSON] = useState<ORSGeoJSON | null>(null);
  const [anonRouteGeoJSON, setAnonRouteGeoJSON] = useState<ORSGeoJSON | null>(null)
  const [activeLiveBus, setActiveLiveBus] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusRoute | null>(null);
  const [selectedBusRouteInfo, setSelectedBusRouteInfo] = useState<BusData | null>(null);

  const fetchRoute = useCallback(async (start: [number, number], end: [number, number]) => {
    setUserLocation(null);
    try {
      const res = await axios.post(
        "/api/route",
        { coordinates: [start, end] },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setRouteGeoJSON(res.data);
    } catch (err) {
      console.error("Error fetching route:", err);
      throw err;
    }
  }, []);

  const fetchBusInfo = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/bus/${id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: BusData = await res.json();
      setSelectedBusRouteInfo(data);
    } catch (err) {
      console.error("Error fetching bus info:", err);
      throw err;
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRouteGeoJSON(null);
    setSelectedBus(null);
    setSelectedBusRouteInfo(null);
  }, []);

  const clearBusSelection = useCallback(() => {
    setSelectedBus(null);
    setSelectedBusRouteInfo(null);
  }, []);

  const contextValue = useMemo(() => ({
    userLocation,
    setUserLocation,
    sourceLocation,
    setSourceLocation,
    anonLocation,
    setAnonLocation,
    anonRouteGeoJSON,
    setAnonRouteGeoJSON,
    routeGeoJSON,
    setRouteGeoJSON,
    fetchRoute,
    fetchBusInfo,
    mapCenter,
    setMapCenter,
    selectedBus,
    setSelectedBus,
    activeLiveBus,
    setActiveLiveBus,
    selectedBusRouteInfo,
    setSelectedBusRouteInfo,
    clearRoute,
    clearBusSelection,
  }), [
    userLocation,
    sourceLocation,
    anonLocation,
    anonRouteGeoJSON,
    routeGeoJSON,
    selectedBus,
    activeLiveBus,
    selectedBusRouteInfo,
    mapCenter,
    fetchRoute,
    fetchBusInfo,
    clearRoute,
    clearBusSelection,
  ]);

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("useMapContext must be used within MapProvider");
  }
  return ctx;
}
