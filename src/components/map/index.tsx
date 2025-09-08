import Map, { Marker, NavigationControl, Source, Layer, MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState, useMemo } from "react";
import { useMapContext } from "@/context/MapContext";
import { BusStop } from "@/types/bus";
import * as turf from "@turf/turf";
import Image from "next/image";
import { isAtStop } from "@/utils/busStops";

type Coord = [number, number];

export default function MainMap() {
  const { 
    userLocation, 
    routeGeoJSON, 
    mapCenter, 
    selectedBus,
    setMapCenter,
    selectedBusRouteInfo,
    activeLiveBus,
    setActiveLiveBus,
    busPos,
    setBusPos,
    reachedStopIds,
    setReachedStopIds,
    setBusSpeedKmh,
    setReachedStopTimes
  } = useMapContext();
  const mapRef = useRef<MapRef>(null);
  const [busStopInfo, setBusStopInfo] = useState<[number, number][]>([]);
  const prevBusPosRef = useRef<Coord | null>(null);
  const reachedStopIdsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!selectedBus || !routeGeoJSON || !selectedBusRouteInfo) return;
    
    const coordsArray: [number, number][] =
      selectedBusRouteInfo.busStops?.map(
        (stop: BusStop) => stop.coords as [number, number]
      );

    setBusStopInfo(coordsArray);
  }, [selectedBus, routeGeoJSON, selectedBusRouteInfo]);

  useEffect(()=>{
    mapRef.current?.flyTo(mapCenter);
  },[mapCenter])

  const routeCoords = routeGeoJSON?.features[0]?.geometry?.coordinates;

  useEffect(() => {
    reachedStopIdsRef.current = reachedStopIds;
  }, [reachedStopIds]);

  const stopIds = useMemo(() => {
    return selectedBusRouteInfo?.busStops?.map(s => s.stopId) ?? [];
  }, [selectedBusRouteInfo]);

  useEffect(() => {
    if(!routeCoords) return;
    if (!activeLiveBus || routeCoords.length === 0) return;
    
    const line = turf.lineString(routeCoords);
    const length = turf.length(line, { units: "kilometers" });

    let step = 0;
    const totalSteps = 200;

    const timer = setInterval(() => {
      const dist = (length / totalSteps) * step;
      const point = turf.along(line, dist, { units: "kilometers" });
      const pos = point.geometry.coordinates as Coord
      setBusPos(pos);
      const prev = prevBusPosRef.current;
      if (prev) {
        const prevPoint = turf.point(prev);
        const currPoint = turf.point(pos);
        const dKm = turf.distance(prevPoint, currPoint, { units: "kilometers" });
        const seconds = 5;
        const kmh = seconds > 0 ? (dKm / seconds) * 3600 : 0;
        setBusSpeedKmh(kmh);
      }
      prevBusPosRef.current = pos;

      busStopInfo?.forEach((stop, idx)=>{
        const stopId = stopIds[idx];
        if (!stopId) return;
        if (reachedStopIdsRef.current.has(stopId)) return;
        if (isAtStop(pos, stop)) {
          const updated = new Set(reachedStopIdsRef.current);
          updated.add(stopId);
          setReachedStopIds(updated);
          setReachedStopTimes(prev => ({
            ...prev,
            [stopId]: Date.now()
          }));
        }
      })

      step++;
      if (step > totalSteps) {
        clearInterval(timer);
        setActiveLiveBus(false);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [activeLiveBus, routeCoords, busStopInfo, stopIds]);

  useEffect(() => {
    if (!activeLiveBus) {
      setReachedStopIds(new Set());
      setBusSpeedKmh(null);
      setReachedStopTimes({});
      prevBusPosRef.current = null;
    }
  }, [activeLiveBus, setReachedStopIds, setBusSpeedKmh, setReachedStopTimes]);

  useEffect(() => {
    setReachedStopIds(new Set());
    setBusSpeedKmh(null);
    setReachedStopTimes({});
    prevBusPosRef.current = null;
  }, [routeCoords, selectedBus, setReachedStopIds, setBusSpeedKmh, setReachedStopTimes]);

  const Focus = (coords: [number,number]) => {
    setMapCenter({center:coords,zoom:15})
  }

  const mapStyle = useMemo(() => ({
    version: 8 as const,
    sources: {
      osm: {
        type: "raster" as const,
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© MapGeox"
      },
    },
    layers: [
      {
        id: "osm-tiles",
        type: "raster" as const,
        source: "osm",
        paint: {
          "raster-opacity": 0.9
        }
      },
    ],
  }), []);

  return (
    <Map
      ref={mapRef}
      mapLib={maplibregl}
      initialViewState={{
        longitude: 79.0888,
        latitude: 21.1466,
        zoom: 5
      }}
      style={{ width: "100%", height: "100vh" }}
      mapStyle={mapStyle}
    >
      <NavigationControl position="bottom-right" />

      {userLocation && (
        <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="bottom">
        </Marker>
      )}

      {selectedBus &&  routeGeoJSON && (
        <>
            <Marker longitude={selectedBus.A[0]} latitude={selectedBus.A[1]} anchor="bottom">
                <div 
                    onClick={() => Focus(selectedBus.A)}
                    className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            </Marker>
            
            <Marker longitude={selectedBus.B[0]} latitude={selectedBus.B[1]} anchor="bottom">
                <div 
                    onClick={() => Focus(selectedBus.B)} 
                    className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            </Marker>
            
            {busStopInfo?.map((stop, indx) => (
                <Marker key={indx} longitude={stop[0]} latitude={stop[1]} anchor="bottom">
                    <div 
                        onClick={() => Focus(stop)} 
                        className={`w-4 h-4 ${selectedBusRouteInfo && reachedStopIds.has(selectedBusRouteInfo?.busStops[indx]?.stopId) ? 'bg-blue-300' : 'bg-blue-500'} rounded-full border-2 border-white shadow-md`}></div>
                </Marker>
            ))}

            {activeLiveBus && busPos && (
              <Marker
                longitude={busPos[0]}
                latitude={busPos[1]}
                anchor="bottom"
              >
                 <Image
                    src='/bus.png'
                    width={40}
                    height={40}
                    alt="buslogo"
                    className="rotate-90 z-20"
                  />
              </Marker>
            )}
        </>
      )}

      {routeGeoJSON && (
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer
            id="route-line"
            type="line"
            paint={{
              "line-color": "#0074D9",
              "line-width": 6,
            }}
          />
        </Source>
      )}
    </Map>
  );
}
