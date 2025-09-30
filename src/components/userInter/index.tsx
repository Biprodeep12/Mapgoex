import { useMapContext } from "@/context/MapContext";
import { Loader2, LocateFixed, MapPin, MapPinned, Search, Sparkles, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BusRouteInfo } from "./busRouteInfo";
import AuthPage, { Dropdown } from "../Auth";
import { useAuth } from "@/context/userContext";
import Image from "next/image";
import Langhuh from "../Langhuh";
import { Ai } from "./ai";
import { useBusSimulator } from "@/context/BusSimulatorContext";
import GetRoute from "./getRoute";
import { DrawerDest } from "./getRoute/drawerDest";

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
  busStops: string[],
  forward: boolean,
}

export type destinationType = {
  start: string,
  A: [number,number]|null,
  startActive: boolean,
  finish: string,
  B: [number,number]|null,
  finishActive: boolean
}

const allBusData:busDataType[] = [
  {
    id: 'A15',
    A: [88.377639, 22.465722],
    B: [88.366083, 22.542861],
    NameA: 'Garia More',
    NameB: 'Park Circus 7 Point',
    busStops: [
    "Garia More",
    "Dinabandhu Andrews College",
    "Ramgarh More",
    "Ganguly Bagan",
    "Bagha Jatin",
    "Annapurna",
    "Sulekha",
    "KPC Hospital",
    "8B, Bus Stop",
    "Jadavpur University Gate No.4",
    "Jadavpur",
    "Jodhpur Park",
    "Dhakuria",
    "Panchanan Tala",
    "Golpark",
    "Gariahat More",
    "Ballygunge Shiksha Sadan",
    "Gariahat Road - ITI",
    "Ballygunge Phari",
    "Ballygunge Park",
    "Syed Amir Ali Avenue",
    "Quest Mall",
    "Zeeshan",
    "Park Circus 7 Point"],
    forward: true,
  },
  {
    id: 'B22',
    A: [88.377227, 22.465693],
    B: [88.345291,22.493469],
    NameA: 'Garia No.6',
    NameB: 'Tollygunge Tram Depot',
    busStops: [
    "Garia No.6",
    "Laxmi Narayan Colony",
    "Rathtala",
    "Gitanjali Metro Station",
    "Naktala youth Club",
    "Naktala",
    "Bansdroni",
    "Surya Nagar",
    "Gachtala More",
    "Netaji Nagar",
    "Ranikuthi",
    "Regent Park",
    "Malancha",
    "Maa Saraswati Library",
    "Ashok Nagar Park",
    "Ashok Nagar Bazar",
    "NIIT Tollygunge",
    "Tollygunge Tram Depot"
  ],
    forward: true,
  }
];

const UserInter = () => {
  const { 
    setUserLocation, 
    userLocation, 
    setMapCenter, 
    fetchRoute,
    fetchBusInfo,
    setSelectedBus,
    selectedBus,
    setActiveLiveBus,
    selectedBusRouteInfo,
    setAnonRouteGeoJSON,
    setAnonLocation,
    anonLocation
  } = useMapContext();
  const { subscribe, setRouteId, isConnected, busStopsETA, trackingBusStop, setTrackingBusStop } = useBusSimulator();
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
  const [openLocation, setOpenLocation] = useState(false)
  const [destinationData, setDestinationData] = useState<destinationType>({
    start: '',
    A: null, 
    startActive: false,
    finish: '',
    B: null,
    finishActive: false
  })

  const getBusStopMinutes = (BusStopCount: number|null) => {
    if (BusStopCount == null) return 0;
      const minutes = Math.ceil(BusStopCount / 60);
      return `${minutes} min${minutes > 1 ? "s" : ""}`;
  }

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
    setOpenLocation(false)
  };

  const handleCloseDest = () =>{
    setDestinationData({start:'',A:null,startActive:false,finish:'',B:null,finishActive:false});
    setAnonRouteGeoJSON(null);
    setUserLocation(null);
    setAnonLocation(null);
  }

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
    const query = searchInput.trim().toLowerCase();
    if (!query) return;

    const filteredResults = allBusData.filter(bus =>
      bus.id.toLowerCase().includes(query) ||
      bus.NameA.toLowerCase().includes(query) ||
      bus.NameB.toLowerCase().includes(query) ||
      bus.busStops.some(element => element.toLowerCase().includes(query)))

    setBusSearchResults(filteredResults);

    getCoordsFromLocationORS();
  };

  const handleBusClick = async (bus: busDataType) => {
    setSelectedBus(bus);
    setLoadingRoute(true);
    setRouteId(bus.id)
    
    try {
      await fetchRoute(bus.A, bus.B);
      await fetchBusInfo(bus.id);
      subscribe();
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
        <div className={`${destinationData.finishActive||destinationData.startActive?'hidden':'flex'} flex-row gap-2.5 items-center justify-between w-full`}>
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

        {(destinationData.finishActive || destinationData.startActive) &&
          <>
            <div className="bg-white text-lg w-full rounded-2xl drop-shadow-2xl p-3 flex flex-col items-center gap-2">
              <div className="flex flex-row items-center w-full gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  {destinationData.finishActive &&
                    <div className="flex flex-row gap-2 items-center">
                      <LocateFixed className="text-blue-600 w-6 h-6"/>
                      <input 
                        value={destinationData.start}
                        onChange={(e)=>setDestinationData(prev=> ({...prev,start:e.target.value}))}
                        onFocus={()=>setDestinationData(prev=> ({...prev,startActive:false,finishActive:true}))}
                        placeholder="Choose start location" 
                        className="flex-1 border-2 border-[#ccc] h-10 outline-none rounded-lg py-1 px-2"/>
                    </div>
                  }
                  {destinationData.startActive &&
                    <div className="flex flex-row gap-2 items-center">
                      <MapPin className="text-red-400 w-6 h-6"/>
                      <input
                        value={destinationData.finish}
                        onChange={(e)=>setDestinationData(prev=> ({...prev,finish:e.target.value}))}
                        onFocus={()=>setDestinationData(prev=> ({...prev,finishActive:false,startActive:true}))} 
                        placeholder="Choose destination" 
                        className="flex-1 border-2 border-[#ccc] h-10 outline-none rounded-lg py-1 px-2"/>
                    </div>
                  }
                </div>
                <div onClick={handleCloseDest} className="flex items-center justify-center">
                  <X className="h-6 w-6 shrink-0 text-gray-600"/>
                </div>
              </div>
              {destinationData.start!=='' && destinationData.finish!==''&& userLocation && anonLocation &&
                <GetRoute/>
              }
            </div>
            {((destinationData.finishActive&&!destinationData.startActive)||(destinationData.startActive&&!destinationData.finishActive)) &&
            <button onClick={()=>{
              if(userLocation==null){
                setOpenLocation(true);
                setDestinationData(prev=> ({...prev,start:'Your Location',startActive:true,finishActive:true}));
              } else {
                handleGetLocation();
                setDestinationData(prev=> ({...prev,start:'Your Location',startActive:true,finishActive:true}));
              }
              }} className="bg-white text-xl gap-2 cursor-pointer flex items-center drop-shadow-2xl w-full rounded-2xl pl-4 py-3">
              <MapPinned className="text-blue-500 w-5 h-5"/>
              Your Location
            </button>
            }
          </>
        }
        
        {searchInput && busSearchResults.length > 0 &&
          <div className="bg-white w-full text-lg drop-shadow-2xl rounded-2xl p-3 flex flex-col gap-2 min-[500px]:max-w-[340px]">
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
          </div>
        }

        {searchInput && busSearchResults.length === 0 &&
          <div className="bg-white w-full text-lg drop-shadow-2xl rounded-2xl p-3">
            <div className="text-gray-500 text-center py-2">
              No bus routes found for &quot;{searchInput}&quot;
            </div>
          </div>
        }

        {searchInput && searchData.length > 0 &&
          <div className="bg-white w-full text-lg drop-shadow-2xl min-[500px]:max-w-[340px] rounded-2xl p-3 flex flex-col gap-2">
              <div className="font-semibold text-gray-400">Destinations</div>
              {searchData.map((search,indx)=>(
                  <button 
                    key={indx} 
                    onClick={()=>{
                      setUserLocation(search.coords);
                      setMapCenter({center: search.coords,zoom: 15})
                      setSearchInput('');
                    }}
                      className="text-left cursor-pointer py-1 px-2 hover:bg-gray-100 rounded-lg"
                  >
                    {search.label}
                  </button>
              ))}
          </div>
        }
        {selectedBus && busStopsETA && trackingBusStop.active && trackingBusStop.busStopID!==null &&
          <div 
            onClick={()=>{
              const busStopID = trackingBusStop.busStopID!;
              setAnonLocation(selectedBusRouteInfo?.busStops[busStopID].coords??null);
              setDestinationData((prev)=>({
                ...prev,
                finish: selectedBusRouteInfo?.busStops[busStopID].name ?? '',
                B:selectedBusRouteInfo?.busStops[busStopID].coords??null,
                startActive: true,
                finishActive: true
              }))}}
              className="bg-white w-full rounded-2xl drop-shadow-2xl p-3 flex flex-row">
            <div className="flex-1 text-left cursor-pointer py-3 px-4 hover:bg-blue-50 rounded-lg border-l-4 border-blue-500 pl-4 transition-colors duration-200 flex flex-col">
              <div className="font-bold text-xl">{selectedBusRouteInfo?.busStops[trackingBusStop.busStopID].name}</div>
              <div className="flex flex-col">
                <div className={`text-2xl font-bold ${busStopsETA[trackingBusStop.busStopID]?.reached?'text-gray-400':'text-blue-600'}`}>
                  {busStopsETA[trackingBusStop.busStopID]?.eta||'--:--'}
                </div>
                {!busStopsETA[trackingBusStop.busStopID]?.reached?
                  <div className="text-lg text-gray-500">
                    Reaching in Less than{" "}
                    <span className="font-medium text-gray-700">
                      {getBusStopMinutes(busStopsETA[trackingBusStop.busStopID]?.etaSeconds)}
                    </span>
                  </div>
                  :
                  <div className="text-sm text-gray-500">Reached</div>
                }
              </div>
            </div>
            <div onClick={()=>setTrackingBusStop({busStopID: null,active: false})} className="flex items-center justify-center">
              <X className="h-6 w-6 shrink-0 text-gray-600"/>
            </div>
          </div>
        }

      </div>

      <DrawerDest destinationData={destinationData} setDestinationData={setDestinationData}/>

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

      <div className="group fixed right-2 bottom-70 rounded-full p-2 bg-white min-w-9 h-9 flex flex-row gap-2 items-center justify-center">
        {isConnected ?
          <>
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"/>
            <div className="group-hover:block hidden">Server is Connected</div>
          </>
          :
          <>
            <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"/>
            <div className="group-hover:block hidden">Server is disconnected</div>
          </>
        }
      </div>

      <div className="fixed right-2 bottom-55">
          <button
              onClick={()=>{
                if(userLocation==null){
                  setOpenLocation(true)
                } else {
                  handleGetLocation();
                }}}
              className="rounded-full cursor-pointer p-2 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
          >
              <LocateFixed className="w-5 h-5"/>
          </button>
      </div>
      {openLocation &&
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
          <div className="flex flex-col gap-2 max-w-[355px] w-[90%] bg-white shadow-2xl rounded-2xl p-4 border-2 border-blue-200">
            <div className="flex flex-row items-center justify-between">
              <div className="text-lg font-semibold text-gray-800 flex flex-row items-center gap-2">
                <LocateFixed className='text-blue-600 w-5 h-5'/>
                Live Location
              </div>
              <button
                  onClick={() => setOpenLocation(false)}
                  className="p-1 cursor-pointer rounded-full hover:bg-gray-200 transition"
              >
                  <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="text-lg text-gray-800">To continue, your device will need to use Location Accuracy</div>
              <div className="text-base text-gray-800">The following settings should be on:</div>
              <div className="flex flex-row items-center gap-1 pl-2">
                <MapPin className="text-blue-600 w-5 h-5 shrink-0"/>
                Device location
              </div>
              <div className="flex flex-row items-center gap-1 pl-2">
                <LocateFixed className="text-blue-600 w-5 h-5 shrink-0"/>
                Location Accuracy
              </div>          
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={()=>setOpenLocation(false)} 
                className="rounded-lg border-2 border-blue-500 py-2 cursor-pointer text-blue-500 font-semibold">
                No Thanks
              </button>
              <button 
                onClick={handleGetLocation} 
                className="rounded-lg border-2 border-blue-500 py-2 cursor-pointer bg-blue-500 text-white font-semibold">
                Turn On
              </button>
            </div>
          </div>
        </div>
      }
      <BusRouteInfo/>
    </>
  );
};

export default UserInter;
