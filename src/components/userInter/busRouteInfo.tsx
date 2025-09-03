import { useMapContext } from "@/context/MapContext";
import { BusStop } from "@/types/bus";
import { X, Bus } from "lucide-react";
import { memo } from "react";

interface BusStopItemProps {
  stop: BusStop;
}

const BusStopItem = memo(({ stop }: BusStopItemProps) => (
  <div className="grid grid-cols-[15%_85%] h-15">
    <div className="relative flex-shrink-0 flex items-center justify-center">
      <div className={`w-4 h-4 rounded-full border-2 bg-blue-600 border-blue-600`} />
      <div className="absolute -z-10 top-1/2 left-1/2 -translate-1/2 bg-blue-400 w-2 h-full"></div>
    </div>
      
    <div className="min-w-0 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-1">
        <div className="font-semibold text-gray-900 truncate">{stop.name}</div>
      </div>
    </div>
  </div>
));

BusStopItem.displayName = 'BusStopItem';

export const BusRouteInfo = memo(() => {
  const { 
    selectedBus, 
    routeGeoJSON, 
    selectedBusRouteInfo, 
    clearRoute 
  } = useMapContext();

  if (!selectedBus || !routeGeoJSON) return null;

  const totalStops = selectedBusRouteInfo?.busStops?.length || 0;

  return (
    <div className="fixed md:top-5 md:right-5 max-md:bottom-0 md:max-w-[400px] w-full bg-white max-md:rounded-t-3xl md:rounded-xl drop-shadow-2xl border border-gray-100 overflow-hidden">

      <div className="flex md:hidden justify-center w-full py-2 bg-gray-50">
        <div className="w-12 h-1.5 rounded-full bg-gray-300" />
      </div>
      
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <h2 className="text-xl font-bold text-gray-900">{selectedBus.label}</h2>
          </div>
          <button 
            onClick={clearRoute}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
            aria-label="Close route info"
          >
            <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>
        
        <div className="flex flex-row text-xl font-semibold">
          {selectedBus.NameA} - {selectedBus.NameB}
        </div>
        
      </div>
      
      {selectedBusRouteInfo && (
        <div className="border-t border-gray-100">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-700">Route Stops</h3>
              <span className="text-sm text-gray-500">({totalStops} stops)</span>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-4">
            <div className="grid grid-cols-[15%_85%] h-15">
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <div className={`w-5 h-5 rounded-full border-2 bg-blue-300 border-blue-600`} />
                <div className="absolute -z-10 bottom-0 left-1/2 -translate-x-1/2 bg-blue-400 w-2 h-1/2"></div>
              </div>
                
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-gray-900 truncate">{selectedBus.NameA}</div>
                </div>
              </div>
            </div>
            {selectedBusRouteInfo.busStops?.map((stop) => (
              <BusStopItem
                key={stop.stopId}
                stop={stop}
              />
            ))}
            <div className="grid grid-cols-[15%_85%] h-15">
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <div className={`w-5 h-5 rounded-full border-2 bg-blue-300 border-blue-600`} />
                <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 bg-blue-400 w-2 h-1/2"></div>
              </div>
                
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-gray-900 truncate">{selectedBus.NameB}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

BusRouteInfo.displayName = 'BusRouteInfo';