import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { FeatureCollection, LineString, Feature } from "geojson";
import axios from "axios";
import { BusData, BusRoute } from "@/types/bus";

interface MapContextType {
  userLocation: [number, number] | null;
  setUserLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  
  anonLocation: [number, number] | null;
  setAnonLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  
  activeLiveBus: boolean;
  setActiveLiveBus: React.Dispatch<React.SetStateAction<boolean>>
  selectedBus: BusRoute | null;
  setSelectedBus: React.Dispatch<React.SetStateAction<BusRoute | null>>;
  selectedBusRouteInfo: BusData | null;
  setSelectedBusRouteInfo: React.Dispatch<React.SetStateAction<BusData | null>>;
  
  routeGeoJSON: ORSGeoJSON | null;
  setRouteGeoJSON: React.Dispatch<React.SetStateAction<ORSGeoJSON | null>>;
  
  mapCenter: MapCenterType;
  setMapCenter: React.Dispatch<React.SetStateAction<MapCenterType>>;
  
  fetchBusInfo: (id: string) => Promise<void>;
  fetchRoute: (start: [number, number], end: [number, number]) => Promise<void>;
  clearRoute: () => void;
  clearBusSelection: () => void;

  busPos: [number, number] | null;
  setBusPos: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  reachedStopIds: Set<string>;
  setReachedStopIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  busSpeedKmh: number | null;
  setBusSpeedKmh: React.Dispatch<React.SetStateAction<number | null>>;
  reachedStopTimes: Record<string, number>;
  setReachedStopTimes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

interface ORSGeoJSON extends FeatureCollection {
  features: Feature<LineString>[];
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
  const [anonLocation, setAnonLocation] = useState<[number, number] | null>(null);
  
  const [routeGeoJSON, setRouteGeoJSON] = useState<ORSGeoJSON | null>(null);
  const [activeLiveBus, setActiveLiveBus] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusRoute | null>(null);
  const [selectedBusRouteInfo, setSelectedBusRouteInfo] = useState<BusData | null>(null);
  const [busPos, setBusPos] = useState<[number, number] | null>(null);
  const [reachedStopIds, setReachedStopIds] = useState<Set<string>>(new Set());
  const [busSpeedKmh, setBusSpeedKmh] = useState<number | null>(null);
  const [reachedStopTimes, setReachedStopTimes] = useState<Record<string, number>>({});

  const fetchRoute = useCallback(async (start: [number, number], end: [number, number]) => {
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
    anonLocation,
    setAnonLocation,
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
    busPos,
    setBusPos,
    reachedStopIds,
    setReachedStopIds,
    busSpeedKmh,
    setBusSpeedKmh,
    reachedStopTimes,
    setReachedStopTimes,
  }), [
    userLocation,
    anonLocation,
    routeGeoJSON,
    selectedBus,
    activeLiveBus,
    selectedBusRouteInfo,
    mapCenter,
    fetchRoute,
    fetchBusInfo,
    clearRoute,
    clearBusSelection,
    busPos,
    reachedStopIds,
    busSpeedKmh,
    reachedStopTimes,
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
