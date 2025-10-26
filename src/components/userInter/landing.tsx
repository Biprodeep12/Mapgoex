import { useMapContext } from "@/context/MapContext";
import { BadgeInfo, Component } from "lucide-react";
import Image from "next/image";

interface props {
  input: string;
  openAvailableBuses: boolean;
  setOpenAvailableBuses: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CarbonEmissionCard({input, openAvailableBuses, setOpenAvailableBuses}:props) {
  const { anonRouteGeoJSON, routeGeoJSON, userLocation, anonLocation } = useMapContext();

  if (anonRouteGeoJSON || routeGeoJSON) return null;
  
  return (
    <div className={`fixed ${(input.length>0) || openAvailableBuses || userLocation || anonLocation?'translate-y-200 opacity-0':'translate-y-0 opacity-100'} transition-all duration-300 z-3 max-[500px]:bottom-0 bottom-5 min-[500px]:left-5 w-full min-[500px]:max-w-[340px]`}>

      <div className="grid grid-cols-3 items-end place-items-center-safe w-full **:transition-all **:duration-300 **:ease-in-out">
        <button className="group landingsecond cursor-pointer bg-white border-4 border-blue-500 hover:bg-blue-100 rounded-full h-20 w-20 shrink my-3 drop-shadow-2xl flex items-center justify-center">
          <BadgeInfo className="w-10 h-10 text-blue-500 group-hover:scale-105"/>
        </button>
        <button onClick={()=>setOpenAvailableBuses(true)} className="group landingfirst cursor-pointer bg-white border-4 border-blue-500 hover:bg-blue-100 rounded-full h-25 w-25 shrink my-5 drop-shadow-2xl flex items-center justify-center">
          <Image
            src='/logo.svg'
            width={60}
            height={60}
            alt="Bus"
            className="group-hover:scale-105"
          />
        </button>
        <button onClick={() => window.open("/busAdmin", "_blank")} className="group landingsecond cursor-pointer bg-white border-4 border-blue-500 hover:bg-blue-100 rounded-full h-20 w-20 shrink my-3 drop-shadow-2xl flex items-center justify-center">
          <Component className="w-10 h-10 text-blue-500 group-hover:scale-105"/>
        </button>
      </div>

      <div className="bg-white landingEntry min-[500px]:rounded-lg rounded-t-[50px] w-full drop-shadow-2xl border border-gray-200">

        <div className="px-5 py-4 border-b border-gray-200">
          <div className="font-bold text-3xl text-center">
            <span className="text-white tracking-widest"   style={{
              textShadow: `
                3px 3px 0 #3b82f6,
                -3px 3px 0 #3b82f6,
                3px -3px 0 #3b82f6,
                -3px -3px 0 #3b82f6,
                0 3px 0 #3b82f6,
                3px 0 0 #3b82f6,
                0 -3px 0 #3b82f6,
                -3px 0 0 #3b82f6
              `
            }}>Map</span>
            <span className="text-blue-500">Geox</span>
          </div>
        </div>

        <div className="px-5 py-3 space-y-3">
          <div className="text-center">
            <p className="text-gray-600 font-bold text-lg mb-2">PUBLIC TRANSPORT IMPACT</p>
            <div className="flex items-center py-2 justify-center rounded-lg bg-blue-50">
              <div className="text-xl text-gray-600">CO₂ Reduction <span className="text-blue-600 font-bold">75%</span></div>
            </div>
          </div>

          <p className="text-gray-700 text-lg text-center leading-relaxed">
            One bus replaces <span className="font-semibold text-blue-600">40 cars</span> on the road
          </p>

          <div className="h-px bg-gray-200"></div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-lg">PM2.5 Reduction</span>
              <span className="text-gray-900 font-semibold text-lg">68%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-lg">NO₂ Reduction</span>
              <span className="text-gray-900 font-semibold text-lg">82%</span>
            </div>
            {/* <div className="flex justify-between items-center">
              <span className="text-gray-600 text-lg">Air Quality Index</span>
              <span className="text-green-600 font-semibold text-lg">Good</span>
            </div> */}
          </div>

          <div className="h-px bg-gray-200"></div>

          <p className="text-gray-700 text-lg text-center leading-relaxed">
            <span className="font-semibold">2.5M</span> people breathing cleaner air daily
          </p>
        </div>
      </div>
    </div>
  )
}
