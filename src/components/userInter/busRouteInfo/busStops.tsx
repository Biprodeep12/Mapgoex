import { useMapContext } from "@/context/MapContext";
import { memo, useEffect, useMemo, useState } from "react";
import * as turf from "@turf/turf";
import { formatTime } from "@/utils/time";
import { BusStop } from "@/types/bus";
import { LoaderCircle } from "lucide-react";

interface BusStopItemProps {
    stop: BusStop;
    etaText: string;
    reached: boolean;
  }
  
  const BusStopItem = memo(({ stop, etaText, reached }: BusStopItemProps) => (
    <div className="grid grid-cols-[25%_15%_60%] h-15">
      <div className={`m-auto text-xl ${reached?'text-gray-500':'text-gray-900'}`}>{etaText?etaText:<LoaderCircle className="shrink-0 text-blue-400 animate-spin"/>}</div>
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <div className={`w-4 h-4 rounded-full border-2 ${reached ? 'bg-white' : 'bg-blue-600'} border-blue-600`} />
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-1/2 bg-blue-400 w-2 h-full"></div>
      </div>
        
      <div className="min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <div className={`font-semibold ${reached?'text-gray-500':'text-gray-900'}`}>{stop.name}</div>
        </div>
      </div>
    </div>
  ));
  
  BusStopItem.displayName = 'BusStopItem';

export const BusStops = () => {
    const {
        busPos,
        reachedStopIds,
        busSpeedKmh,
        selectedBus,
        selectedBusRouteInfo,
        reachedStopTimes
    } = useMapContext();
    const [nowTs, setNowTs] = useState<number>(Date.now());
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
      setCurrentTime(formatTime(Date.now()));
    }, []);

    useEffect(() => {
      const t = setInterval(() => setNowTs(Date.now()), 20000);
      return () => clearInterval(t);
    }, []);

    const etaTexts = useMemo(() => {
        if (!selectedBusRouteInfo || !busPos) return [] as string[];
        const points: [number, number][] = [
          selectedBusRouteInfo.startPoint.coords,
          ...selectedBusRouteInfo.busStops.map(s => s.coords),
          selectedBusRouteInfo.endPoint.coords,
        ];
        const result: string[] = [];
        const busPoint = turf.point(busPos);
        for (let i = 0; i < points.length; i++) {
          const stopPoint = turf.point(points[i]);
          const distanceKm = turf.distance(busPoint, stopPoint, { units: 'kilometers' });
          const speed = Math.max(10, Math.min(busSpeedKmh ?? 25, 80));
          const hours = distanceKm / speed;
          const etaMs = nowTs + hours * 3600 * 1000;
          result.push(formatTime(etaMs));
        }
        return result;
      }, [selectedBusRouteInfo, busPos, busSpeedKmh, nowTs]);
    
      const displayTimes = useMemo(() => {
        if (!selectedBusRouteInfo) return [] as string[];
        const times: string[] = [];
        // start
        times.push(etaTexts[0] ?? '');
        // stops
        selectedBusRouteInfo.busStops.forEach((stop, idx) => {
          const reachedTs = reachedStopTimes[stop.stopId];
          if (reachedTs) {
            times.push(formatTime(reachedTs));
          } else {
            times.push(etaTexts[idx + 1] ?? '');
          }
        });
        // end
        times.push(etaTexts[selectedBusRouteInfo.busStops.length + 1] ?? '');
        return times;
      }, [selectedBusRouteInfo, etaTexts, reachedStopTimes]);

    return(
        <>
            {selectedBusRouteInfo &&
            <>
            <div className="grid grid-cols-[25%_15%_60%] h-15">
              <div className="m-auto text-xl">{currentTime}</div>
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <div className={`w-5 h-5 rounded-full border-2 bg-blue-300 border-blue-600`} />
                <div className="absolute -z-10 bottom-0 left-1/2 -translate-x-1/2 bg-blue-400 w-2 h-1/2"></div>
              </div>
                
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-gray-900 truncate">{selectedBus?.NameA}</div>
                </div>
              </div>
            </div>
            {selectedBusRouteInfo?.busStops?.map((stop, idx) => (
              <BusStopItem
                key={stop.stopId}
                stop={stop}
                etaText={displayTimes[idx + 1] ?? ''}
                reached={reachedStopIds.has(stop.stopId)}
              />
            ))}
            <div className="grid grid-cols-[25%_15%_60%] h-15">
              <div className="m-auto text-xl">{displayTimes[selectedBusRouteInfo.busStops.length + 1] ?? ''}</div>
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <div className={`w-5 h-5 rounded-full border-2 bg-blue-300 border-blue-600`} />
                <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 bg-blue-400 w-2 h-1/2"></div>
              </div>
                
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-gray-900 truncate">{selectedBus?.NameB}</div>
                </div>
              </div>
            </div>
            </>
            }
        </>
    )
}