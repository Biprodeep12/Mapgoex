import { useMapContext } from "@/context/MapContext";
import BottomDrawer from "../drawer";
import { useEffect, useState } from "react";
import { ArrowRight, Bus, Loader2, X } from "lucide-react";
import { allBusData, busDataType } from "../userInter";

interface Props {
  handleBusClick: (bus: busDataType) => void;
  loadingRoute: boolean;
  setOpenAvailableBuses: React.Dispatch<React.SetStateAction<boolean>>;
}

const HomeDrawer = ({handleBusClick ,loadingRoute, setOpenAvailableBuses}:Props) => {
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
      minHeight={450}
      maxHeight={screenHeight * (3 / 4)}
    >
      <div className="flex flex-col px-4 gap-4">
        <div className="text-2xl text-blue-500 font-bold flex flex-row justify-between items-center">
          <div>
            <Bus className="inline w-8 h-8 mr-2 mb-1"/>
            Available Bus Routes
          </div>
          <button onClick={()=>setOpenAvailableBuses(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors group bg-gray-100">
            <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>
        <div className="flex flex-col gap-5">
            {allBusData.map((bus,indx)=>(
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
        <button onClick={() => window.open("/busAdmin", "_blank")} className="cursor-pointer py-2 px-3 text-white bg-blue-400 rounded-lg text-lg flex flex-row gap-2 justify-center items-center">
          Go To Bus Fleet Control
          <ArrowRight className="w-5 h-5"/>
        </button>
      </div>
    </BottomDrawer>
  );
};

export default HomeDrawer;
