import { useMapContext } from "@/context/MapContext";
import { LoaderCircle } from "lucide-react";
import { useBusSimulator } from "@/context/BusSimulatorContext";

export const BusStops = () => {
    const {
        selectedBusRouteInfo,
        setMapCenter
    } = useMapContext();
    const { busStopsETA, setTrackingBusStop } = useBusSimulator()

    if(!selectedBusRouteInfo) return <div>Loading Bus Stops...</div>

    return(
        <>
            {selectedBusRouteInfo?.busStops?.map((stop, idx) => { 
              const onClickStop = () => {
                setMapCenter({center: stop.coords,zoom: 15})
                setTrackingBusStop({busStopID: idx, active: true})
              }
              return (
              <div key={stop.stopId} className="grid grid-cols-[25%_15%_60%] h-15">
                <div className={`m-auto text-xl ${busStopsETA?.[idx].reached||false?'text-gray-500':'text-gray-900'}`}>{busStopsETA?.[idx].eta?busStopsETA?.[idx].eta:<LoaderCircle className="shrink-0 text-blue-400 animate-spin"/>}</div>
                <div className="relative flex-shrink-0 flex items-center justify-center">
                  {stop.stopId==='START'|| stop.stopId==='END'?
                    <div onClick={onClickStop} className="w-5 h-5 cursor-pointer rounded-full border-2 bg-blue-300 border-blue-600"/>
                    :
                    <div onClick={onClickStop} className={`w-4 h-4 cursor-pointer rounded-full border-2 ${busStopsETA?.[idx].reached||false ? 'bg-white' : 'bg-blue-600'} border-blue-600`}/>
                  }
                  <div className={`absolute -z-10 ${stop.stopId==='START'?'bottom-0 -translate-x-1/2 h-1/2':stop.stopId==='END'?'top-0 -translate-1/2 h-full':'top-1/2 -translate-1/2 h-full'} left-1/2 bg-blue-400 w-2`}></div>
                </div>
                  
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`font-semibold ${busStopsETA?.[idx].reached||false?'text-gray-500':'text-gray-900'}`}>{stop.name}</div>
                  </div>
                </div>
              </div>
            )})}
        </>
    )
}