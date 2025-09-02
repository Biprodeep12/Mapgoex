import { createContext, useContext, useState } from "react";
import type { FeatureCollection, LineString, Feature } from "geojson";

import axios from "axios";
import { BusData, BusRoutes } from "@/types/bus";

interface MapContextType {
  userLocation: [number, number] | null;
  setUserLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  anonLocation: [number, number] | null;
  setAnonLocation: React.Dispatch<React.SetStateAction<[number, number] | null>>;
  fetchBusInfo: (id:string) => Promise<void>;
  fetchRoute: (start: [number, number], end: [number, number]) => Promise<void>;
  routeGeoJSON: ORSGeoJSON|null;
  setRouteGeoJSON: React.Dispatch<React.SetStateAction<null>>;
  mapCenter: mapCenterType;
  setMapCenter: React.Dispatch<React.SetStateAction<mapCenterType>>;
  selectedBus: busDataType | null;
  setSelectedBus: React.Dispatch<React.SetStateAction<busDataType | null>>;
  selectedBusRouteInfo: BusData | null;
  setSelectedBusRouteInfo: React.Dispatch<React.SetStateAction<BusData | null>>
}

interface ORSGeoJSON extends FeatureCollection {
  features: Feature<LineString>[];
}

type busDataType = {
  label: string,
  A: [number,number],
  B: [number,number],
  NameA: string,
  NameB: string,
}

type mapCenterType = {
    center: [number,number]
    zoom: number
}

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
  const [selectedBusRouteInfo, setSelectedBusRouteInfo] = useState<BusData|null>(null)

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

  const fetchBusInfo = async(id: string) =>{
    try{
      const res = await fetch(`/api/buses/${id}`)
      const data: BusData = await res.json();
      setSelectedBusRouteInfo(data);
    }catch(err) {
      console.log(err);
    }
  }

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
        fetchBusInfo,
        mapCenter, 
        setMapCenter,
        selectedBus,
        setSelectedBus,
        selectedBusRouteInfo,
        setSelectedBusRouteInfo
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
