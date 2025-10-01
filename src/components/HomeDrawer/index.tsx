import { useMapContext } from "@/context/MapContext";
import BottomDrawer from "../drawer";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Bus, Car, Leaf, Sparkles, TrendingDown } from "lucide-react";

const HomeDrawer = () => {
  const { anonRouteGeoJSON, routeGeoJSON } = useMapContext();
  const [screenHeight, setScreenHeight] = useState<number | null>(null);

  useEffect(() => {
    setScreenHeight(window.innerHeight);

    const handleResize = () => setScreenHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (anonRouteGeoJSON || routeGeoJSON) return null;

  if (screenHeight === null) return null;

  return (
    <BottomDrawer
      minHeight={screenHeight * (3 / 5)}
      maxHeight={screenHeight - 10}
    >
      <div className="flex flex-col w-full px-4 pb-4 gap-5">
        <div className="flex flex-col items-center">
            <div className="text-4xl font-bold tracking-wider text-blue-500 flex flex-row items-center gap-2">
                <Image
                 src='/logo.svg'
                 alt="logo"
                 width={40}
                 height={40}
                />
                MapGeox
            </div>
        </div>
      <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 rounded-xl bg-green-400 shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold">Eco Impact</div>
            <div className="text-base">Per 10km comparison</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Bus className="w-5 h-5 text-green-600" />
                <div>Public Transport</div>
              </div>
              <div className="flex items-center gap-1 text-base px-2.5 py-1 bg-green-200 text-green rounded-full font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-green-600"/>
                <div>Best Choice</div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-green-600">0.4kg</div>
              <div className="text-base">CO₂ per 10km</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Car className="w-5 h-5 text-red-600" />
              <div>Private Car/Cab</div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-red-600">2.4kg</div>
              <div className="text-base">CO₂ per 10km</div>
            </div>
          </div>

-          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-100 border border-green-300">
            <TrendingDown className="w-5 h-5 text-green-600" />
            <div className="text-sm font-semibold">
              83% less emissions with public transport
            </div>
          </div>
        </div>
      </div>
      </div>
    </BottomDrawer>
  );
};

export default HomeDrawer;
