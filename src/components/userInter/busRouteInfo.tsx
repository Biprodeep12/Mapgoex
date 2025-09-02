import { useMapContext } from "@/context/MapContext";
import { BusStop } from "@/types/bus";
import { MapPin, Clock, Route, X, Bus, Navigation } from "lucide-react";
import { memo } from "react";

interface BusStopItemProps {
  stop: BusStop;
  index: number;
  isLast: boolean;
}

const BusStopItem = memo(({ stop, index, isLast }: BusStopItemProps) => (
  <div className="relative">
    {/* Connection line */}
    {!isLast && (
      <div className="absolute left-6 top-8 w-0.5 h-8 bg-gradient-to-b from-blue-400 to-blue-200" />
    )}
    
    <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      {/* Stop indicator */}
      <div className="relative flex-shrink-0">
        <div className={`w-4 h-4 rounded-full border-2 ${
          stop.isTerminal 
            ? 'bg-blue-600 border-blue-700' 
            : 'bg-blue-400 border-blue-500'
        }`} />
        {stop.isTerminal && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-white" />
        )}
      </div>
      
      {/* Stop info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900 truncate">{stop.name}</h4>
          {stop.isTerminal && (
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Terminal
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {stop.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{stop.estimatedTime}</span>
            </div>
          )}
          {stop.distance && (
            <div className="flex items-center gap-1">
              <Route className="w-4 h-4" />
              <span>{stop.distance}km</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Stop number */}
      <div className="flex-shrink-0">
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {index + 1}
        </span>
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
  const estimatedDuration = selectedBusRouteInfo?.estimatedDuration;
  const totalDistance = selectedBusRouteInfo?.totalDistance;

  return (
    <div className="fixed md:top-5 md:right-5 max-md:bottom-0 md:max-w-[400px] w-full bg-white max-md:rounded-t-3xl md:rounded-xl drop-shadow-2xl border border-gray-100 overflow-hidden">
      {/* Mobile drag handle */}
      <div className="flex md:hidden justify-center w-full py-2 bg-gray-50">
        <div className="w-12 h-1.5 rounded-full bg-gray-300" />
      </div>
      
      {/* Header */}
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
        
        {/* Route summary */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900">From</div>
              <div className="text-gray-700">{selectedBus.NameA}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Navigation className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-900">To</div>
              <div className="text-gray-700">{selectedBus.NameB}</div>
            </div>
          </div>
        </div>
        
        {/* Route stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{totalStops}</div>
            <div className="text-xs text-gray-600">Stops</div>
          </div>
          {estimatedDuration && (
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{estimatedDuration}min</div>
              <div className="text-xs text-gray-600">Duration</div>
            </div>
          )}
          {totalDistance && (
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{totalDistance}km</div>
              <div className="text-xs text-gray-600">Distance</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bus stops list */}
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
            {selectedBusRouteInfo.busStops?.map((stop, index) => (
              <BusStopItem
                key={stop.stopId}
                stop={stop}
                index={index}
                isLast={index === selectedBusRouteInfo.busStops.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

BusRouteInfo.displayName = 'BusRouteInfo';