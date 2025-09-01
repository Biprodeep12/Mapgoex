import Map, { Marker, NavigationControl, Source, Layer, MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { useMapContext } from "@/context/MapContext";
import * as turf from "@turf/turf";

export default function MainMap() {
  const { 
    userLocation, 
    routeGeoJSON, 
    mapCenter, 
    selectedBus,
    setAnonLocation
  } = useMapContext();
  const mapRef = useRef<MapRef>(null);

  const getBusStops = () => {
    if(!routeGeoJSON) return [];
    const intervalMeters = 1000;
    const coords = routeGeoJSON.features[0].geometry.coordinates;
    const line = turf.lineString(coords);
    const totalDistance = routeGeoJSON?.features[0]?.properties?.segments[0].distance;
    const numStops = Math.floor(totalDistance / intervalMeters);
    
    const busStops: [number, number][] = [];
    for (let i = 1; i <= numStops; i++) {
      const point = turf.along(line, (i * intervalMeters) / 1000, { units: "kilometers" });
      busStops.push(point.geometry.coordinates as [number, number]);
    }
    return busStops;
  };

  useEffect(()=>{
    mapRef.current?.flyTo(mapCenter);
  },[mapCenter])

  const busStops = getBusStops();

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
      mapStyle={{
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
          },
        ],
      }}
    >
      <NavigationControl position="bottom-right" />

      {userLocation && (
        <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="bottom">
        </Marker>
      )}

      {/* Display selected bus route */}
      {selectedBus && routeGeoJSON && (
        <>
            {/* Start point */}
            <Marker longitude={selectedBus.Point1[0]} latitude={selectedBus.Point1[1]} anchor="bottom">
                <div 
                    onClick={() => setAnonLocation(selectedBus.Point1)}
                    className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            </Marker>
            
            {/* End point */}
            <Marker longitude={selectedBus.Point2[0]} latitude={selectedBus.Point2[1]} anchor="bottom">
                <div 
                    onClick={() => setAnonLocation(selectedBus.Point2)} 
                    className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            </Marker>
            
            {/* Bus stops along the route */}
            {busStops.map((stop: [number, number], index: number) => (
                <Marker key={index} longitude={stop[0]} latitude={stop[1]} anchor="bottom">
                    <div 
                        onClick={() => setAnonLocation(stop)} 
                        className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
                </Marker>
            ))}

        </>
      )}

      {/* Display route line */}
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
