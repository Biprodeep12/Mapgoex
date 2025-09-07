import { useMapContext } from "@/context/MapContext";
import { Loader2, LocateFixed, Search, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { BusRouteInfo } from "./busRouteInfo";
import AuthPage, { Dropdown } from "../Auth";
import { useAuth } from "@/context/userContext";
import Image from "next/image";
import Langhuh from "../Langhuh";
import { Ai } from "./ai";

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
  id: string;
  A: [number,number],
  B: [number,number],
  NameA: string,
  NameB: string,
  forward: boolean,
}

const UserInter = () => {
  const { 
    setUserLocation, 
    userLocation, 
    setMapCenter, 
    fetchRoute,
    fetchBusInfo,
    setSelectedBus,
    setActiveLiveBus
  } = useMapContext();

  const { user } = useAuth();

  const [searchInput, setSearchInput] = useState('')
  const [searchData, setSearchData] = useState<SearchData[]>([])
  const [busSearchResults, setBusSearchResults] = useState<busDataType[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [authOpen,setAuthOpen] = useState(false)
  const [langTheme,setLangTheme] = useState(false)
  const [openDropUser, setOpenDropUser] = useState(false);
  const [openAi, setOpenAi] = useState(false)

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
    setBusSearchResults([
      {
        id: 'A15',
        A: [88.377639, 22.465722],
        B: [88.366083, 22.542861],
        NameA: 'Garia More',
        NameB: 'Park Circus 7 Point',
        forward: true,
      }
    ]);
    getCoordsFromLocationORS();
  };

  const handleBusClick = async (bus: busDataType) => {
    setSelectedBus(bus);
    setLoadingRoute(true);
    
    try {
      await fetchRoute(bus.A, bus.B);
      await fetchBusInfo(bus.id);
      setActiveLiveBus(true);
      const centerLng = (bus.A[0] + bus.B[0]) / 2;
      const centerLat = (bus.A[1] + bus.B[1]) / 2;
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

  useEffect(() => {
      const huh = localStorage.getItem('lang')
      if(!huh){
          setLangTheme(true)
      }
  },[])

  return (
    <>
      <div className="fixed top-5 left-5 max-[500px]:left-1/2 max-[500px]:-translate-x-1/2 max-[500px]:w-[90%] flex flex-col items-center gap-3">
        <div className="flex flex-row gap-2.5 items-center justify-between w-full">
          <div className="rounded-4xl px-4 py-2 bg-white drop-shadow-2xl flex flex-row gap-3 items-center min-w-0">
            {loadingSearch? <Loader2 className="w-10 h-10 animate-spin p-2 text-blue-500 shrink-0"/> : <Search onClick={handleSearch} className="w-10 h-10 text-gray-400 p-2 cursor-pointer rounded-full hover:bg-gray-100"/>}
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
                className="flex-1 outline-none text-lg min-w-0" />
              <button onClick={()=>setOpenAi(!openAi)} className="group hover:bg-blue-50 shrink-0 p-2 cursor-pointer w-10 h-10 rounded-full">
                <Sparkles className="text-blue-600 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"/>
              </button>
          </div>
          <div onClick={()=> {setOpenDropUser(!openDropUser)}} className="rounded-full max-[500px]:flex border-[3px] border-blue-500 w-12 h-12 shrink-0 hidden items-center justify-center">
            {!user?.photoURL? 
            <User className="bg-white w-9.5 h-9.5 rounded-full p-1"/>
            :
            <Image
              src={user?.photoURL||''}
              width={38}
              height={38}
              alt="profile"
              className="rounded-full"
            />} 
            {openDropUser && <Dropdown setLangTheme={setLangTheme} setAuthOpen={setAuthOpen} setOpenDropUser={setOpenDropUser}/>}
          </div>
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
              <div className="font-bold text-blue-700 text-xl">{bus.id}</div>
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">From:</span> {bus.NameA}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">To:</span> {bus.NameB}
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
        
      </div>

      <Ai setOpenAi={setOpenAi} openAi={openAi}/>

      <div className="fixed max-[500px]:hidden top-5 right-5">
          <div onClick={()=> {setOpenDropUser(!openDropUser)}} className="rounded-full max-[500px]:hidden border-[3px] border-blue-500 w-12 h-12 shrink-0 flex items-center justify-center">
            {!user?.photoURL? 
            <User className="bg-white w-9.5 h-9.5 rounded-full p-1"/>
            :
            <Image
              src={user?.photoURL||''}
              width={38}
              height={38}
              alt="profile"
              className="rounded-full"
            />}
          </div>
          {openDropUser && <Dropdown setLangTheme={setLangTheme} setAuthOpen={setAuthOpen} setOpenDropUser={setOpenDropUser}/>}
      </div>

      {authOpen && <AuthPage setAuthOpen={setAuthOpen}/>}
      <Langhuh setLangTheme={setLangTheme} langTheme={langTheme}/>

      <div className="fixed right-2 bottom-40">
          <button
              onClick={handleGetLocation}
              className="rounded-full cursor-pointer p-2 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
          >
              <LocateFixed className="w-5 h-5"/>
          </button>
      </div>
      <BusRouteInfo/>
    </>
  );
};

export default UserInter;
