import { useMapContext } from "@/context/MapContext";
import { X, Bus } from "lucide-react";
import { memo } from "react";
import { BusStops } from "./busStops";
import BottomDrawer from "@/components/drawer";

export const BusRouteInfo = memo(() => {
  const { 
    selectedBus, 
    routeGeoJSON, 
    selectedBusRouteInfo,
    clearRoute 
  } = useMapContext();

  if (!selectedBus || !routeGeoJSON) return null;

  const totalStops = selectedBusRouteInfo?.busStops?.length || 0;
  const distance = (routeGeoJSON?.features[0]?.properties?.summary?.distance) / 1000

  if (!routeGeoJSON && !selectedBusRouteInfo) return null;

  return (
    <>
    <div className="fixed md:flex hidden flex-col md:top-5 md:left-5 md:bottom-5 max-md:bottom-0 md:max-w-[400px] w-full bg-white max-md:rounded-t-3xl md:rounded-xl drop-shadow-2xl border border-gray-100 overflow-hidden">

      <div className="flex md:hidden justify-center w-full py-2 bg-gray-50">
        <div className="w-12 h-1.5 rounded-full bg-gray-300" />
      </div>
      
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <div className="text-xl font-bold text-gray-900">{selectedBus.id}</div>
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
    
      <div className="border-t border-gray-100 flex-1 flex flex-col overflow-y-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bus className="w-4 h-4 text-gray-600" />
            <div className="font-semibold text-gray-700">Route</div>
            <div className="text-sm text-gray-500">({totalStops} stops)</div>
            <div>{Number((distance).toFixed(1))} KM</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <BusStops/>
        </div>
      </div>

    </div>
    <BottomDrawer>
      <div className="flex flex-col w-full overflow-hidden">

        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
              <h2 className="text-xl font-bold text-gray-900">{selectedBus.id}</h2>
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
          <div className="border-t border-gray-100 flex-1 flex flex-col overflow-y-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-gray-600" />
                <div className="font-semibold text-gray-700">Route</div>
                <div className="text-sm text-gray-500">({totalStops} stops)</div>
                <div>{Number((distance).toFixed(1))} KM</div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <BusStops/>
            </div>
          </div>
        )}
      </div>
    </BottomDrawer>
    </>
  );
});

BusRouteInfo.displayName = 'BusRouteInfo';