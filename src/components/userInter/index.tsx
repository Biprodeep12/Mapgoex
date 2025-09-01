import { useMapContext } from "@/context/MapContext";
import { LocationInfo } from "@/utils/locationInfo";
import { Loader2, LocateFixed, Search, Waypoints } from "lucide-react";
import { useEffect, useState } from "react";
import { BusRouteInfo } from "./busRouteInfo";

interface SearchData {
  coords: [number, number],
  label: string
}

interface Feature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    label: string;
  };
}

type busDataType = {
  label: string,
  Point1: [number,number],
  Point2: [number,number],
  Point1Name: string,
  Point2Name: string,
}

const UserInter = () => {
  const { 
    setUserLocation, 
    userLocation, 
    setMapCenter, 
    searchBuses, 
    fetchRoute, 
    setSelectedBus, 
  } = useMapContext();

  const [searchInput, setSearchInput] = useState('')
  const [searchData, setSearchData] = useState<SearchData[]>([])
  const [busSearchResults, setBusSearchResults] = useState<busDataType[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const handleGetLocation = () => {
    if(userLocation){
        setMapCenter({center: [userLocation[0],userLocation[1]],zoom: 15})
        return;
    }
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        setMapCenter({center: [pos.coords.longitude,pos.coords.latitude],zoom: 15})
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          alert("Location permission denied. Please enable it in your browser.");
        } else {
          console.error("Geolocation error:", err);
        }
      }
    )
  };

  const getCoordsFromLocationORS = async () => {
    if (!searchInput.trim()) return;
    
    try{
      setLoadingSearch(true);
      const url = `https://api.openrouteservice.org/geocode/search?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjczZGM4NTFmMDVkOTRiOTRhNzFmNTBlMmRhODI0OThhIiwiaCI6Im11cm11cjY0In0=&text=${encodeURIComponent(searchInput)}&size=5`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const results: SearchData[] = (data.features as Feature[]).map((feature: Feature) => ({
          coords: feature.geometry.coordinates,
          label: feature.properties.label,
        }));      
        setSearchData(results);
      }
    } catch(err) {
      console.log(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    
    const buses = searchBuses(searchInput);
    setBusSearchResults(buses);
    
    getCoordsFromLocationORS();
  };

  const handleBusClick = async (bus: busDataType) => {
    setSelectedBus(bus);
    setLoadingRoute(true);
    
    try {
      await fetchRoute(bus.Point1, bus.Point2);
      const centerLng = (bus.Point1[0] + bus.Point2[0]) / 2;
      const centerLat = (bus.Point1[1] + bus.Point2[1]) / 2;
      setMapCenter({ center: [centerLng, centerLat], zoom: 12 });
      setSearchInput('');
      setBusSearchResults([]);
      setSearchData([]);
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setLoadingRoute(false);
    }
  };

  useEffect(() => {
    if (searchInput.trim().length === 0) {
      setSearchData([]);
      setBusSearchResults([]);
    }
  }, [searchInput]);  

  return (
    <>
      <div className="fixed top-5 left-5 max-[500px]:left-1/2 max-[500px]:-translate-x-1/2 max-[500px]:w-[90%] flex flex-col items-center gap-3">
        <div className="rounded-4xl px-4 py-2 bg-white drop-shadow-2xl flex flex-row gap-3 items-center max-[500px]:w-full">
          {loadingSearch? <Loader2 className="w-10 h-10 animate-spin p-2 text-blue-500"/> : <Search onClick={handleSearch} className="w-10 h-10 text-gray-400 p-2 cursor-pointer rounded-full hover:bg-gray-100"/>}
          <input
            type="search" 
            placeholder="Search your destinations"
            value={searchInput}
            onChange={(e)=> setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if(e.key=='Enter'){
                handleSearch();
              }
            }}
            className="flex-1 outline-none text-lg" />
            <Waypoints className="w-10 h-10 text-blue-600 p-2 cursor-pointer rounded-full hover:bg-gray-100"/>
        </div>
        
        {searchInput && busSearchResults.length > 0 &&
        <div className="bg-white w-full text-lg drop-shadow-2xl rounded-2xl p-3 flex flex-col gap-2">
          <div className="font-semibold text-blue-600 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Bus Routes ({busSearchResults.length})
          </div>
          {busSearchResults.map((bus,indx)=>(
            <button 
              key={indx} 
              onClick={() => handleBusClick(bus)}
              disabled={loadingRoute}
              className="text-left cursor-pointer py-3 px-4 hover:bg-blue-50 rounded-lg border-l-4 border-blue-500 pl-4 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="font-bold text-blue-700 text-xl">{bus.label}</div>
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">From:</span> {bus.Point1Name}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">To:</span> {bus.Point2Name}
              </div>
              {loadingRoute && (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-xs text-blue-500">Loading route...</span>
                </div>
              )}
            </button>
          ))}
        </div>}

        {searchInput && busSearchResults.length === 0 &&
        <div className="bg-white w-full text-lg drop-shadow-2xl rounded-2xl p-3">
          <div className="text-gray-500 text-center py-2">
            No bus routes found for &quot;{searchInput}&quot;
          </div>
        </div>}

        {searchInput && searchData.length > 0 &&
        <div className="bg-white w-full text-lg drop-shadow-2xl rounded-2xl p-3 flex flex-col gap-2">
            <div className="font-semibold text-gray-400">Destinations</div>
            {searchData.map((search,indx)=>(
                <button key={indx} className="text-left cursor-pointer py-1 px-2 hover:bg-gray-100 rounded-lg">{search.label}</button>
            ))}
        </div>
        }
        
        <LocationInfo/>
      </div>

      <div className="fixed right-2 bottom-40">
          <button
              onClick={handleGetLocation}
              className="rounded-full cursor-pointer p-2 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
          >
              <LocateFixed className="w-7 h-7"/>
          </button>
      </div>
      <BusRouteInfo/>
    </>
  );
};

export default UserInter;
