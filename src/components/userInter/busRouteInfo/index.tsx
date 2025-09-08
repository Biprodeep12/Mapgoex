import { useMapContext } from "@/context/MapContext";
import { X, Bus, LoaderCircle } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { BusStops } from "./busStops";
import BottomDrawer from "@/components/drawer";
import WeatherIcon from "@/utils/weather";

interface WeatherData {
  name: string;
  country: string;
  main: string;
  description: string;
}

const API_KEY = "f0a3263ad56623877e07814bc905e67c";

export const BusRouteInfo = memo(() => {
  const { 
    selectedBus, 
    routeGeoJSON, 
    selectedBusRouteInfo,
    clearRoute,
    mapCenter
  } = useMapContext();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoadingWeather(true);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const data = await res.json();

      const weatherInfo: WeatherData = {
        name: data.name,
        country: data.sys.country,
        main: data.weather[0].main,
        description: data.weather[0].description,
      };

      setWeather(weatherInfo);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(()=>{
    fetchWeather(mapCenter.center[1],mapCenter.center[0]);
  },[mapCenter])

  const totalStops = selectedBusRouteInfo?.busStops?.length || 0;
  const distance = (routeGeoJSON?.features[0]?.properties?.summary?.distance) / 1000

  if (!selectedBus || !routeGeoJSON) return null;

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

    {weather && (
      <div className="fixed top-20 p-2 right-5 drop-shadow-2xl bg-blue-200 rounded-lg min-h-[150px] min-w-[200px] hidden md:flex flex-col">
        {/* <div>
          Weather in {weather.name}, {weather.country}
        </div> */}
        {loadingWeather &&
          <LoaderCircle className="animate-spin m-auto text-white"/>
        }
        <div className="grid grid-cols-2">
          {weather?.main && <WeatherIcon weatherMain={weather?.main}/>}
          <div className="text-xl font-bold text-gray-500 self-center">{weather.main}</div>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-1 capitalize text-gray-500 font-semibold">{weather.description}</div>
        {weather?.main==='Rain'||weather?.main==='Fog'||weather?.main==='Drizzle'?
          <div className="font-semibold text-red-500">
          Delay of +(2-5mins) Expected
          </div>
        :
          <div className="font-semibold text-green-500">No Delay Expected</div>
        }
      </div>
    )}

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

            <div>
              {weather && (
                <div className="bg-blue-200 rounded-lg min-h-[100px] w-[95%] m-auto flex flex-row items-center justify-evenly mt-2">
                  {/* <div>
                    Weather in {weather.name}, {weather.country}
                  </div> */}
                  {loadingWeather &&
                    <LoaderCircle className="animate-spin m-auto text-white"/>
                  }
                  {weather?.main && <WeatherIcon weatherMain={weather?.main}/>}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-2 flex-wrap">
                      <div className="text-xl font-bold text-gray-500 self-center">{weather.main}</div>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg px-1 capitalize text-gray-500 font-semibold text-nowrap">{weather.description}</div>
                    </div>
                    {weather?.main==='Rain'||weather?.main==='Fog'||weather?.main==='Drizzle'?
                      <div className="font-semibold text-red-500 text-lg">
                      Delay of +(2-5mins) Expected
                      </div>
                    :
                      <div className="font-semibold text-green-500 text-lg">No Delay Expected</div>
                    }
                  </div>
                </div>
              )}
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