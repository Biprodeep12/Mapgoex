import Map, { Marker, NavigationControl, Source, Layer, MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState, useMemo } from "react";
import { useMapContext } from "@/context/MapContext";
import { BusStop } from "@/types/bus";
import Image from "next/image";
import { useBusSimulator } from "@/context/BusSimulatorContext";

export default function MainMap() {
  const { 
    userLocation, 
    routeGeoJSON, 
    mapCenter, 
    selectedBus,
    setMapCenter,
    selectedBusRouteInfo,
    activeLiveBus,
  } = useMapContext();
  const { busPos, busStopsETA } = useBusSimulator();
  const [busStopInfo, setBusStopInfo] = useState<[number, number][]>([]);
  const mapRef = useRef<MapRef>(null);
  const busFocusRef = useRef<boolean>(false);

  useEffect(() => {
    if(!busFocusRef.current) return;
    if(!busPos || busPos.length === 0) return;
    setMapCenter({center: busPos[0].coords,zoom:15})
  },[busPos,busFocusRef,setMapCenter])
  
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
                        className={`w-4 h-4 ${busStopsETA && selectedBusRouteInfo && busStopsETA[indx].reached ? 'bg-blue-300' : 'bg-blue-500'} rounded-full border-2 border-white shadow-md`}></div>
                </Marker>
            ))}

          {activeLiveBus && busPos && (
              <Marker
                longitude={busPos[0].coords[0]}
                latitude={busPos[0].coords[1]}
                anchor="bottom"
              >
                <Image
                  onClick={()=>busFocusRef.current = !busFocusRef.current}
                  src="/bus.png"
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
