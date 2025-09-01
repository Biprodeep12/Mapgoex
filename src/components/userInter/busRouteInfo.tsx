import { useMapContext } from "@/context/MapContext"
import { busStopsInfo } from "@/utils/busStops"; 
import { useEffect, useState } from "react";
import * as turf from "@turf/turf";

export const BusRouteInfo = () => {
    const { selectedBus, routeGeoJSON, setSelectedBus, setRouteGeoJSON } = useMapContext();
    const [busStopsInfoData, setBusStopsInfoData] = useState<string[]>([]);
    const [loadingStops, setLoadingStops] = useState(false);
    
    // Calculate bus stops at the component level
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
    
    useEffect(() => {
        const fetchBusStopsInfo = async () => {
            if (!selectedBus || !routeGeoJSON) return;
            
            setLoadingStops(true);
            const stops = getBusStops();
            const stopsInfo: string[] = [];
            
            for (const stop of stops) {
                try {
                    const info = await busStopsInfo(stop);
                    stopsInfo.push(info);
                } catch (error) {
                    stopsInfo.push("Location unavailable");
                }
            }
            
            setBusStopsInfoData(stopsInfo);
            setLoadingStops(false);
        };
        
        fetchBusStopsInfo();
    }, [selectedBus, routeGeoJSON]);
    
    const busStops = getBusStops();
    
    return(
        <>
        {selectedBus && routeGeoJSON &&
        <>
            <div className={`fixed flex flex-col transform transition-all duration-300 ${routeGeoJSON?'opacity-100 md:translate-x-0 max-md:translate-y-0':'opacity-0 md:translate-x-100 max-md:translate-y-100'} md:top-5 md:right-5 max-md:bottom-0 md:max-w-[350px] w-full bg-white max-md:rounded-t-3xl md:rounded-lg drop-shadow-lg p-4`}>
                <div className="flex md:hidden justify-center w-full">
                    <div className="w-[40%] h-3.5 rounded-lg bg-gray-300"></div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="font-bold text-xl text-blue-700">{selectedBus.label}</div>
                </div>
                <div className="text-lg text-gray-600 space-y-1 mb-3">
                  <div><span className="font-medium">From:</span> {selectedBus.Point1Name}</div>
                  <div><span className="font-medium">To:</span> {selectedBus.Point2Name}</div>
                  <div><span className="font-medium">Stops:</span> {busStops.length}</div>
                </div>
                
                {/* <div className="border-t pt-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Route Stops:</div>
                    {loadingStops ? (
                        <div className="text-center py-4 text-gray-500">
                            Loading stops information...
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {busStopsInfoData.map((stopInfo, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <span className="text-gray-600">{stopInfo}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div> */}
                
                <button
                  onClick={() => {
                    setSelectedBus(null)
                    setRouteGeoJSON(null)
                }}
                  className="mt-3 w-full cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md text-sm transition-colors"
                >
                  Close Route
                </button>
            </div>
        </>
        }
        </>
    )
}