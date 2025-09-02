import { useMapContext } from "@/context/MapContext"

export const BusRouteInfo = () => {
    const { selectedBus, routeGeoJSON, setSelectedBus, setRouteGeoJSON, selectedBusRouteInfo } = useMapContext();

    
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
                  <div><span className="font-medium">From:</span> {selectedBus.NameA}</div>
                  <div><span className="font-medium">To:</span> {selectedBus.NameB}</div>
                  <div><span className="font-medium">Stops:</span> 9</div>
                </div>

                {selectedBusRouteInfo &&
                <div className="flex flex-col gap-5 w-full overflow-y-auto max-h-[300px]">
                    {selectedBusRouteInfo?.busStops?.map((stop)=>(
                        <div key={stop.stopId} className="grid grid-cols-[20%_80%] min-h-25">
                            <div></div>
                            <div className="flex flex-col rounded-lg border-[1px] p-2 justify-center">
                                <div className="text-xl font-bold">{stop.name}</div>
                                <div className="text-xl">Est Time: ????</div>
                            </div>
                        </div>
                    ))}
                </div>}
                
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