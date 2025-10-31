import { useMapContext } from "@/context/MapContext";
import { useAuth } from "@/context/userContext";
import { ITicketItem } from "@/models/ticketInfo";
import axios from "axios";
import { ArrowLeft, ArrowRight, BusFront, CircleCheckBig, CircleX, Loader2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  openTicket: boolean;
  setOpenTicket: React.Dispatch<React.SetStateAction<boolean>>;
}

interface TicketSideBarState {
  sourceStop: string;
  sourceActive: boolean;
  destStop: string;
  destActive: boolean;
}

function convertUTCtoIST(utcString: string): string {
  const d = new Date(utcString);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function has24HoursPassed(timestamp: string | number): boolean {
  const past = typeof timestamp === "number" ? timestamp : Date.parse(String(timestamp));
  if (Number.isNaN(past)) return false;
  return Date.now() - past >= 24 * 60 * 60 * 1000;
}

export const TicketSideBar = ({ openTicket, setOpenTicket }: Props) => {
    const { 
      selectedBusRouteInfo, 
      anonLocation,
      setAnonLocation, 
      sourceLocation, 
      setSourceLocation, 
      setAnonRouteGeoJSON, 
      anonRouteGeoJSON, 
      setMapCenter 
    } = useMapContext();
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState("");
    const [ticketCount, setTicketCount] = useState(1);
    const [loadingRouteMap, setLoadingRouteMap] = useState(false);
    const [checkout, setCheckout] = useState({active: false,error:false});
    const [payLoading, setPayLoading] = useState(false);
    const [books, setBooks] = useState<ITicketItem[]>([]);
    const [ticketHistory, setTicketHistory] = useState(false);
    const [impMessages, setImpMessages] = useState("");
    const [liveTickets, setLiveTickets] = useState(false)

    const ContentRef = useRef<string | null>(null)

    const [stops, setStops] = useState<TicketSideBarState>({
        sourceStop: "",
        sourceActive: false,
        destStop: "",
        destActive: false,
    });

    const fetchRoute = useCallback(
        async () => {
            if (!sourceLocation || !anonLocation) return;
            const key = `${sourceLocation[0]},${sourceLocation[1]}|${anonLocation[0]},${anonLocation[1]}`;
            if (ContentRef.current === key) {
              setOpenTicket(false)
              return;
            }

            ContentRef.current = key;

            setLoadingRouteMap(true);

            try {
                const res = await axios.post(
                `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
                { coordinates: [sourceLocation, anonLocation] },
                {
                    headers: {
                    Authorization:
                        "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjczZGM4NTFmMDVkOTRiOTRhNzFmNTBlMmRhODI0OThhIiwiaCI6Im11cm11cjY0In0=",
                    "Content-Type": "application/json",
                    },
                }
                );

                setAnonRouteGeoJSON(res.data);        

                const centerLng = (sourceLocation[0] + anonLocation[0]) / 2;
                const centerLat = (sourceLocation[1] + anonLocation[1]) / 2;

                setMapCenter({
                center: [centerLng, centerLat],
                zoom: 14,
                });
                setOpenTicket(false);
            } catch (err) {
                console.error("Error fetching route:", err);
            } finally {
                setLoadingRouteMap(false);
            }
        },
        [sourceLocation, anonLocation]
    );

    const totalPrice = useMemo(() => {
        const { sourceStop, destStop } = stops;
        const stopsList = selectedBusRouteInfo?.busStops || [];

        if (!sourceStop || !destStop || stopsList.length === 0) return 0;

        const sourceIndex = stopsList.findIndex((s) => s.name === sourceStop);
        const destIndex = stopsList.findIndex((s) => s.name === destStop);

        if (sourceIndex < 0 || destIndex < 0 || sourceIndex === destIndex) return 0;

        const distance = Math.abs(destIndex - sourceIndex);
        const blockSize = 3;
        const baseFare = 10;
        const incrementPerBlock = 2;

        const blocks = Math.ceil(distance / blockSize);
        const farePerTicket = baseFare + (blocks - 1) * incrementPerBlock;

        return farePerTicket * ticketCount;
    }, [stops, ticketCount, selectedBusRouteInfo]);

  const isStopActive = stops.sourceActive || stops.destActive;

  const setActive = useCallback((type: "source" | "dest", value: boolean) =>
    setStops((prev) => ({
      ...prev,
      sourceActive: type === "source" ? value : false,
      destActive: type === "dest" ? value : false,
    })), []);

  const closeStops = () => setActive("source", false);
  const openSource = () => setActive("source", true);
  const openDest = () => setActive("dest", true);

  const activeStopName = useMemo(() => (
    stops.sourceActive ? stops.sourceStop : stops.destActive ? stops.destStop : ""
  ), [stops.sourceActive, stops.destActive, stops.sourceStop, stops.destStop]);

  const handleSelectStop = useCallback((stopName: string, coords: [number, number]) => {
    setImpMessages("")
    if (stops.sourceActive && stops.destStop === stopName) return;
    setStops(prev => ({
      ...prev,
      sourceStop: prev.sourceActive ? stopName : prev.sourceStop,
      destStop: prev.destActive ? stopName : prev.destStop,
      sourceActive: false,
      destActive: false,
    }));

    if (stops.sourceActive) setSourceLocation(coords);
    else if (stops.destActive) setAnonLocation(coords);
  }, [stops, setSourceLocation, setAnonLocation]);

  const clearActiveStop = useCallback(() => {
    setImpMessages("")
    setStops((prev) => ({
      ...prev,
      sourceStop: prev.sourceActive ? "" : prev.sourceStop,
      destStop: prev.destActive ? "" : prev.destStop,
    }));
  }, []);

  const CancelTicket = useCallback(() => {
    setImpMessages("");
    setStops((prev) => ({ ...prev, destStop: "", sourceStop: "" }));
    setTicketCount(1);
    setAnonRouteGeoJSON(null);
    setOpenTicket(true);
    setAnonLocation(null);
    setSourceLocation(null);
  }, [setAnonRouteGeoJSON, setAnonLocation, setOpenTicket, setSourceLocation]);

  const filteredStops = useMemo(() => 
    (selectedBusRouteInfo?.busStops || []).filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [selectedBusRouteInfo?.busStops, searchQuery]);

  const CheckOut = async () => {
    setImpMessages("")
    if (!user) {
      setImpMessages("Please log in to book a ticket.");
      return;
    }

    const uuid = user.uid;
    const Ticket = {
      route: selectedBusRouteInfo?.Route,
      count: ticketCount,
      source: stops.sourceStop,
      destination: stops.destStop,
      payment: totalPrice,
      time: new Date(),
    };

    try {
      setPayLoading(true);

      const res = await fetch("/api/book/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, ticket: Ticket }),
      });
      if(res.ok){
        setCheckout({active:true ,error:false})
      } else {
        setCheckout({active:true, error: true});
      }
    } catch (err) {
      setImpMessages(`Something Went Wrong: (${err})`)
    } finally {
      setPayLoading(false);
      setTimeout(() => {
        setCheckout({active:false, error:false});
        CancelTicket();
      }, 2000);
    }
  };

  const TicketHistoryCheck = async() =>{
    setImpMessages("")
    if(!user?.uid){
      setImpMessages("Please log in to book a ticket.");
      return;
    }
    
    if(books.length == 0){
      setLiveTickets(true);
      try {
        const res = await fetch(`/api/book/${user?.uid}`);
        const data = await res.json();
        setBooks(data.reverse())
      } catch {
        setBooks([])
      } finally {
        setLiveTickets(false)
      }
    }
  }

  useEffect(()=>{
    if(!openTicket && (stops.destStop.length==0 || stops.sourceStop.length==0)){
      setAnonRouteGeoJSON(null);
      setSourceLocation(null);
      setAnonLocation(null);
    }
  },[openTicket, stops.destStop.length, stops.sourceStop.length])

  return (
    <>
      {anonRouteGeoJSON && stops.sourceStop && stops.destStop && (
        <button onClick={()=>{
          setAnonRouteGeoJSON(null);
          setOpenTicket(true);
          setAnonLocation(null);
          setSourceLocation(null);
        }} className="fixed right-0 top-1/2 -translate-y-1/2 bg-white rounded-l-lg p-2">
          <X className="w-7 h-7 "/>
        </button>
      )}
      {(isStopActive || ticketHistory) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-501" />
      )}

      <div className={`fixed z-502 p-3 left-1/2 -translate-x-1/2 flex flex-col bottom-0 w-full max-w-[640px] h-1/2 ${ticketHistory?'translate-y-0':'translate-y-200'} transition-all duration-200 rounded-t-3xl bg-white`}>
        <button
          onClick={()=>setTicketHistory(false)}
          className="absolute p-3 rounded-full bg-white cursor-pointer hover:bg-gray-100 -top-17 left-1/2 -translate-x-1/2"
        >
          <X className="w-7 h-7" />
        </button>
        <div className="text-2xl font-bold mx-auto mb-5">Ticket History</div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {books.length>0 ? 
            (books?.map((tick,indx)=>{
              const isExpired = has24HoursPassed(tick.time.toString());
              return(
              <div key={indx} className={`rounded-lg border-2 border-blue-500 ${isExpired && 'opacity-50'} flex flex-col gap-4 p-4`}>
                  <div className="flex flex-row justify-between">
                      <div className="flex flex-row items-center gap-1">
                        <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                            {tick.route}
                        </div>
                        x
                        <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                          {tick.count} Ticket{tick.count>1?'s':''}
                        </div>
                      </div>
                      <div 
                          className="flex items-center justify-center h-8 bg-green-400 text-white rounded-lg font-bold py-1 px-2">
                          ₹{tick.payment}
                      </div>
                  </div>
                  <div className="grid grid-cols-[40%_20%_40%] rounded-lg bg-blue-50 p-1 items-center justify-center text-center text-wrap text-lg">
                      <span>{tick.source}</span> 
                      <ArrowRight className="w-6 h-6 text-blue-500 justify-self-center-safe"/>
                      <span>{tick.destination}</span>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center gap-1">
                      <span className="font-bold">Booked on:</span>
                      {convertUTCtoIST(tick.time.toString())}
                    </div>
                    {isExpired && <div className="py-1 px-2 rounded-lg bg-gray-300 font-bold">Expired</div>}
                  </div>
              </div>
            )}))
          :<div className="flex items-center justify-center h-full text-xl ">No Tickets to be Seen</div>}
        </div>
      </div>

      <div className={`fixed inset-0 bg-white z-502 flex items-center justify-center transition-all duration-200 ${checkout.active?'translate-y-0':'-translate-y-300'}`}>
        <div className={checkout.active ? "paySpin":''}>
          {checkout.error ? <CircleX fill="lightred" className='text-red-400 w-10 h-10'/>:<CircleCheckBig fill="lightgreen" className='text-green-400 w-10 h-10'/>}
        </div>
        <span className={`text-nowrap translate-y-10 absolute top-1/2 left-1/2 -translate-1/2 ${checkout.error?'text-red-500':'text-green-500'} font-bold text-3xl`}>{checkout.error?'Something went Wrong':`Payed ₹${totalPrice}`}</span>
      </div>

      <div
        className={`fixed top-0 w-full rounded-b-2xl max-w-[700px] left-1/2 -translate-x-1/2 h-3/4 px-2 py-3 bg-white transition-all duration-200 flex flex-col gap-3 z-502 ${
          isStopActive ? "translate-y-0" : "-translate-y-200"
        }`}
      >
        <div className="relative">
          <Search className="w-6 h-6 absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              stops.sourceActive
                ? "Search Source Stop"
                : "Search Destination Stop"
            }
            className="w-full text-xl py-3 pl-14 pr-4 border-2 border-gray-300 focus:outline-none focus:border-blue-500 rounded-lg"
          />
        </div>

        {activeStopName && (
          <div className="flex flex-row justify-between h-11.5 bg-emerald-200 w-full rounded-lg border border-gray-300 gap-2 py-2 px-3 items-center">
            <div className="flex flex-row items-center gap-3">
              <BusFront className="w-5 h-5 text-blue-500" />
              <span className="truncate text-xl">{activeStopName}</span>
            </div>
            <button
              className="rounded-full p-1 bg-white cursor-pointer hover:bg-gray-100"
              onClick={clearActiveStop}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 py-1 space-y-2">
          {filteredStops.map((stop, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectStop(stop.name,stop.coords)}
              className="flex flex-row h-11.5 w-full rounded-lg hover:bg-gray-100 cursor-pointer border border-gray-300 gap-3 py-2 px-3 items-center"
            >
              <BusFront className="w-5 h-5 text-blue-500" />
              <span className="truncate text-xl">{stop.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={closeStops}
          className="absolute cursor-pointer hover:bg-gray-100 p-2 rounded-full bg-white -bottom-15 left-1/2 -translate-x-1/2"
        >
          <X className="w-7 h-7" />
        </button>
      </div>

      <div
        className={`fixed inset-0 bg-white p-4 flex-col hidden max-[500px]:flex gap-4 z-500 transition-all duration-300 ${
          openTicket ? "translate-x-0" : "translate-x-200"
        }`}
      >
        <div className="flex flex-row gap-4 items-center">
          <button onClick={() => setOpenTicket(false)}>
            <ArrowLeft className="w-7 h-7" />
          </button>
          <span className="text-2xl font-bold">Book Ticket</span>
        </div>

        <div className="grid grid-rows-2 gap-3 text-lg">
          {[
            { label: "Source", stop: stops.sourceStop, onClick: openSource },
            { label: "Destination", stop: stops.destStop, onClick: openDest },
          ].map(({ label, stop, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-row gap-3 text-left items-center h-13 px-4 rounded-xl text-black bg-blue-50"
            >
              <BusFront className="w-6 h-6 text-blue-500" />
              {stop ? (
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{label} Stop</span>
                  <span className="text-lg">{stop}</span>
                </div>
              ) : (
                <span className="text-lg">{label} Stop</span>
              )}
            </button>
          ))}
        </div>

        <div className="w-full bg-gray-300 h-[1px]"/>

        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-10">
          {impMessages && <span className="text-lg font-bold text-center text-red-500">{impMessages}</span>}
          {checkout.error && <span className="text-lg font-bold text-center text-red-500">Something went Wrong</span>}
            {(stops.destStop.length>0 && stops.sourceStop.length>0) ?
              (stops.destStop == stops.sourceStop ?
                <span className="text-lg font-bold text-center text-red-500">
                  You have selected Same stops, Select different source and destination stops
                </span>
              :
              <>
                <span className="text-lg font-bold text-center">Selected Route</span>
                <div className="flex flex-col">
                    <div className="rounded-lg border-2 border-blue-500 flex flex-col gap-4 p-4">
                        <div className="flex flex-row justify-between">
                            <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                                {selectedBusRouteInfo?.Route}
                            </div>
                            <button 
                                onClick={CancelTicket} 
                                className="h-8 bg-red-200 rounded-lg font-bold px-2">
                                Cancel
                            </button>
                        </div>
                        <div className="grid grid-cols-[40%_20%_40%] rounded-lg bg-blue-50 p-1 items-center justify-center text-center text-wrap text-lg">
                            <span>{stops.sourceStop}</span> 
                            <ArrowRight className="w-6 h-6 text-blue-500 justify-self-center-safe"/>
                            <span>{stops.destStop}</span>
                        </div>
                        <div className="flex flex-row items-center justify-between">
                            <span className="text-lg">No of Tickets:</span>
                            <div className="flex flex-row items-center">
                                <button               
                                    onClick={() =>
                                        setTicketCount((prev) => Math.max(1, prev - 1))
                                    } 
                                    className="bg-blue-50 border border-blue-400 rounded-full w-8 text-xl">-</button>
                                <span className="mx-4 text-lg">{ticketCount}</span>
                                <button
                                    onClick={() => setTicketCount((prev) => prev + 1)}
                                    className="bg-blue-50 border border-blue-400 rounded-full w-8 text-xl">+</button>
                            </div>
                        </div>
                        <div className="flex flex-row items-center justify-center gap-2 text-lg font-bold">
                            <span>Total Price:</span>
                            <span className="text-green-500">₹{totalPrice}</span>
                        </div>
                    </div>
                </div>
                <button onClick={fetchRoute} className="h-10 bg-blue-400 text-lg rounded-lg font-bold text-white">
                    {loadingRouteMap ?
                    <Loader2 className="w-6 h-6 animate-spin mx-auto"/> 
                    :
                    'See Route On Map'}
                </button>
                <div className="mx-auto text-lg font-bold my-2 text-red-400">This Ticket will be valid for 24 hours</div>
                <div className="fixed bottom-0 left-0 right-0 grid grid-cols-2 border-t border-gray-300 text-lg font-bold">
                    <button onClick={CancelTicket} className="h-12">Cancel</button>
                    <button onClick={CheckOut} className="h-12 bg-blue-400 text-white">
                      {payLoading ?<Loader2 className="w-5 h-5 animate-spin mx-auto"/>:`Pay ₹${totalPrice}`}
                    </button>
                </div>
              </>)
            :
            <>
              <span className="text-lg font-bold text-center">
                  Select both source and destination stops to view the route information.
              </span>
              {user && books.length == 0 && 
              <button onClick={TicketHistoryCheck} className="rounded-lg border-2 h-12 border-gray-300 text-xl flex items-center justify-center bg-gray-50 font-bold hover:bg-gray-100 cursor-pointer">
               {!liveTickets?
                ' Get your Live Tickets'
                :
                <Loader2 className="text-black h-5 w-5 animate-spin"/>}
              </button>}
              {books.length>0 &&
                (books?.filter(prev => !has24HoursPassed(prev.time.toString())).map((tick,indx)=>{
                  return(
                  <div key={indx} className={`rounded-lg border-2 border-blue-500 flex flex-col gap-4 p-4`}>
                      <div className="flex flex-row justify-between">
                          <div className="flex flex-row items-center gap-1">
                            <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                                {tick.route}
                            </div>
                            x
                            <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                              {tick.count} Ticket{tick.count>1?'s':''}
                            </div>
                          </div>
                          <div 
                              className="flex items-center justify-center h-8 bg-green-400 text-white rounded-lg font-bold py-1 px-2">
                              ₹{tick.payment}
                          </div>
                      </div>
                      <div className="grid grid-cols-[40%_20%_40%] rounded-lg bg-blue-50 p-1 items-center justify-center text-center text-wrap text-lg">
                          <span>{tick.source}</span> 
                          <ArrowRight className="w-6 h-6 text-blue-500 justify-self-center-safe"/>
                          <span>{tick.destination}</span>
                      </div>
                      <div className="flex flex-row items-center justify-between">
                        <div className="flex flex-row items-center gap-1">
                          <span className="font-bold">Booked on:</span>
                          {convertUTCtoIST(tick.time.toString())}
                        </div>
                        {has24HoursPassed(tick.time.toString()) && <div className="py-1 px-2 rounded-lg bg-gray-300 font-bold">Expired</div>}
                      </div>
                  </div>
                )}))}
              <button onClick={()=>{setTicketHistory(true);TicketHistoryCheck()}} className="fixed bottom-0 left-0 right-0 bg-white h-12 border-t border-gray-300 text-lg font-bold">
                Ticket History
              </button>
            </>
            }
        </div>

      </div>

    <div className={`fixed ${openTicket? 'max-[500px]:hidden flex':'hidden'} inset-0 bg-black/20 backdrop-blur-[2px] z-499 items-center justify-center`}>
      <div className="h-[70%] flex bg-white w-full max-w-[640px] rounded-lg p-4 flex-col gap-4 z-500">
        <div className="flex flex-row gap-4 items-center justify-between">
          <span className="text-2xl font-bold">Book Ticket</span>
          <button onClick={() => setOpenTicket(false)} className="cursor-pointer rounded-full hover:bg-gray-100">
            <X className="w-7 h-7" />
          </button>
        </div>

        <div className="grid grid-rows-2 gap-3 text-lg">
          {[
            { label: "Source", stop: stops.sourceStop, onClick: openSource },
            { label: "Destination", stop: stops.destStop, onClick: openDest },
          ].map(({ label, stop, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-row gap-3 cursor-pointer text-left items-center h-13 px-4 rounded-xl text-black bg-blue-50 hover:bg-blue-100"
            >
              <BusFront className="w-6 h-6 text-blue-500" />
              {stop ? (
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{label} Stop</span>
                  <span className="text-lg">{stop}</span>
                </div>
              ) : (
                <span className="text-lg">{label} Stop</span>
              )}
            </button>
          ))}
        </div>

        <div className="w-full bg-gray-300 h-[1px]"/>

        <div className="flex-1 flex flex-col gap-3 overflow-y-auto relative">
          {impMessages && <span className="text-lg font-bold text-center text-red-500">{impMessages}</span>}
          {checkout.error && <span className="text-lg font-bold text-center text-red-500">Something went Wrong</span>}
            {(stops.destStop.length>0 && stops.sourceStop.length>0) ?
              (stops.destStop == stops.sourceStop ?
                <span className="text-lg font-bold text-center text-red-500">
                  You have selected Same stops, Select different source and destination stops
                </span>
              :
              <>
                <span className="text-lg font-bold text-center">Selected Route</span>
                <div className="flex flex-col">
                    <div className="rounded-lg border-2 border-blue-500 flex flex-col gap-4 p-4">
                        <div className="flex flex-row justify-between">
                            <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                                {selectedBusRouteInfo?.Route}
                            </div>
                            <button 
                                onClick={CancelTicket} 
                                className="h-8 bg-red-200 rounded-lg font-bold px-2 cursor-pointer hover:bg-red-300">
                                Cancel
                            </button>
                        </div>
                        <div className="grid grid-cols-[40%_20%_40%] rounded-lg bg-blue-50 p-1 items-center justify-center text-center text-wrap text-lg">
                            <span>{stops.sourceStop}</span> 
                            <ArrowRight className="w-6 h-6 text-blue-500 justify-self-center-safe"/>
                            <span>{stops.destStop}</span>
                        </div>
                        <div className="flex flex-row items-center justify-between">
                            <span className="text-lg">No of Tickets:</span>
                            <div className="flex flex-row items-center">
                                <button               
                                    onClick={() =>
                                        setTicketCount((prev) => Math.max(1, prev - 1))
                                    } 
                                    className="bg-blue-50 border border-blue-400 rounded-full w-8 text-xl">-</button>
                                <span className="mx-4 text-lg">{ticketCount}</span>
                                <button
                                    onClick={() => setTicketCount((prev) => prev + 1)}
                                    className="bg-blue-50 border border-blue-400 rounded-full w-8 text-xl">+</button>
                            </div>
                        </div>
                        <div className="flex flex-row items-center justify-center gap-2 text-lg font-bold">
                            <span>Total Price:</span>
                            <span className="text-green-500">₹{totalPrice}</span>
                        </div>
                    </div>
                </div>
                <button onClick={fetchRoute} className="h-10 bg-blue-400 cursor-pointer hover:bg-blue-500 shrink-0 text-lg rounded-lg font-bold text-white">
                    {loadingRouteMap ?
                    <Loader2 className="w-6 h-6 animate-spin mx-auto"/> 
                    :
                    'See Route On Map'}
                </button>
                <div className="mx-auto text-lg font-bold my-2 text-red-400">This Ticket will be valid for 24 hours</div>
                <div className="fixed rounded-lg gap-2 bottom-5 left-1/2 -translate-x-1/2 max-w-[640px] w-full bg-white p-2 grid grid-cols-2 text-lg font-bold">
                    <button onClick={CancelTicket} className="h-12 hover:bg-gray-100 rounded-lg cursor-pointer">Cancel</button>
                    <button onClick={CheckOut} className="h-12 bg-blue-400 hover:bg-blue-500 rounded-lg cursor-pointer text-white">
                      {payLoading ?<Loader2 className="w-5 h-5 animate-spin mx-auto"/>:`Pay ₹${totalPrice}`}
                    </button>
                </div>
              </>)
            :
            <>
              <span className="text-lg font-bold text-center">
                  Select both source and destination stops to view the route information.
              </span>
              {user && books.length == 0 && 
              <button onClick={TicketHistoryCheck} className="rounded-lg border-2 h-12 border-gray-300 text-xl flex items-center justify-center bg-gray-50 font-bold hover:bg-gray-100 cursor-pointer">
               {!liveTickets?
                ' Get your Live Tickets'
                :
                <Loader2 className="text-black h-5 w-5 animate-spin"/>}
              </button>}
              {books.length>0 &&
                (books?.filter(prev => !has24HoursPassed(prev.time.toString())).map((tick,indx)=>{
                  const isExpired = has24HoursPassed(tick.time.toString());
                  return(
                  <div key={indx} className={`rounded-lg border-2 border-blue-500 flex flex-col gap-4 p-4`}>
                      <div className="flex flex-row justify-between">
                          <div className="flex flex-row items-center gap-1">
                            <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                                {tick.route}
                            </div>
                            x
                            <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                              {tick.count} Ticket{tick.count>1?'s':''}
                            </div>
                          </div>
                          <div 
                              className="flex items-center justify-center h-8 bg-green-400 text-white rounded-lg font-bold py-1 px-2">
                              ₹{tick.payment}
                          </div>
                      </div>
                      <div className="grid grid-cols-[40%_20%_40%] rounded-lg bg-blue-50 p-1 items-center justify-center text-center text-wrap text-lg">
                          <span>{tick.source}</span> 
                          <ArrowRight className="w-6 h-6 text-blue-500 justify-self-center-safe"/>
                          <span>{tick.destination}</span>
                      </div>
                      <div className="flex flex-row items-center justify-between">
                        <div className="flex flex-row items-center gap-1">
                          <span className="font-bold">Booked on:</span>
                          {convertUTCtoIST(tick.time.toString())}
                        </div>
                        {isExpired && <div className="py-1 px-2 rounded-lg bg-gray-300 font-bold">Expired</div>}
                      </div>
                  </div>
                )}))}
              <button onClick={()=>{setTicketHistory(true);TicketHistoryCheck()}} className="mt-auto fixed max-w-[640px] w-full bg-white bottom-5 left-1/2 -translate-x-1/2 cursor-pointer h-12 border border-gray-300 hover:bg-gray-100 rounded-lg text-lg font-bold">
                Ticket History
              </button>
            </>
            }
        </div>
      </div>
    </div>
    </>
  );
};
