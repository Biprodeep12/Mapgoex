import BottomDrawer from "@/components/drawer"
import { useMapContext } from "@/context/MapContext"
import { LocateFixed, MapPin, Share2, X } from "lucide-react"
import { destinationType } from ".."
import React, { useEffect, useState } from "react"

interface Props {
    destinationData: destinationType
    setDestinationData: React.Dispatch<React.SetStateAction<destinationType>>;
}

type step = {
    distance: number;
    duration: number;
    instruction: string;
}

export const DrawerDest = ({destinationData,setDestinationData}:Props) => {
    const { anonRouteGeoJSON,setAnonRouteGeoJSON, setUserLocation, setAnonLocation } = useMapContext()
    const [screenHeight, setScreenHeight] = useState<number | null>(null);

    const steps = anonRouteGeoJSON?.features[0]?.properties?.segments[0]?.steps

    const dis = Number(anonRouteGeoJSON?.features[0]?.properties?.summary?.distance)
    const time = Number(((anonRouteGeoJSON?.features[0]?.properties?.summary?.duration)/60).toFixed(0))
    const JsonProfile = anonRouteGeoJSON?.metadata?.query?.profile

    const ForamtedDistance = (distance:number) => {
        if(distance>1000){
            return `${Number((distance/1000).toFixed(1))} km`
        } else {
            return `${distance.toFixed(0)} m`
        }
    }

    const handleCloseDest = () =>{
        setDestinationData({start:'',A:null,startActive:false,finish:'',B:null,finishActive:false});
        setAnonRouteGeoJSON(null);
        setUserLocation(null);
        setAnonLocation(null);
    }

    useEffect(() => {
        setScreenHeight(window.innerHeight);

        const handleResize = () => setScreenHeight(window.innerHeight);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if(!anonRouteGeoJSON || !(destinationData.finishActive||destinationData.startActive)) return;

    return(
        <>
        <div className="fixed md:flex hidden flex-col md:top-5 md:left-5 md:bottom-5 max-md:bottom-0 md:max-w-[400px] w-full bg-white max-md:rounded-t-3xl md:rounded-xl drop-shadow-2xl border border-gray-100">
            <button
                onClick={handleCloseDest} 
                className="cursor-pointer w-10 h-11 absolute top-18 -right-10 hover:bg-gray-100 rounded-tr-lg rounded-br-lg bg-white flex items-center justify-center"
                aria-label="Close route info"
            >
                <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            </button>
            <div className="flex flex-col overflow-hidden">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                            <div className="text-[22px] font-bold text-gray-900">{JsonProfile=='foot-walking'?'Walk':'Drive'}</div>
                        </div>
                        <div className="flex flex-row gap-4 items-center">
                            <button 
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors group bg-gray-100"
                                aria-label="Close route info"
                            >
                                <Share2 className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-row text-xl font-semibold">
                        {destinationData?.start} - {destinationData?.finish}
                    </div>
                </div>
                <div className="border-t border-gray-200 flex flex-col overflow-y-hidden">
                    <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
                        <div className="flex flex-row text-lg font-medium items-center">
                            <div>{time} min ({ForamtedDistance(dis)})</div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
                    <div className="text-xl font-bold">Steps</div>
                    <div className="flex flex-col gap-3 text-xl">
                        <div className="flex flex-row items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg py-2 px-3">
                            <LocateFixed className="text-blue-600 w-6 h-6"/>
                            {destinationData?.start}
                        </div>
                        {steps.map((step: step, index: number) => (
                            <React.Fragment key={index}>
                                <div className="flex flex-row items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg py-2 px-3">
                                    <div className="w-4.5 h-4.5 border-4 border-blue-500 bg-white rounded-full shrink-0"></div>
                                    {step?.instruction}
                                </div>
                                <div className="flex flex-row gap-2 items-center text-sm text-gray-400">
                                    {ForamtedDistance(step?.distance)}
                                    <div className="flex-1 bg-gray-100 h-[2px]"></div>
                                </div>
                            </React.Fragment>
                        ))}
                        <div className="flex flex-row items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg py-2 px-3">
                            <MapPin className="text-red-400 w-6 h-6"/>
                            {destinationData?.finish}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <BottomDrawer maxHeight={screenHeight? screenHeight : 700}>
            <div className="flex flex-col pb-10">
                <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                            <div className="text-[22px] font-bold text-gray-900">{JsonProfile=='foot-walking'?'Walk':'Drive'}</div>
                        </div>
                        <div className="flex flex-row gap-4 items-center">
                            <button 
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors group bg-gray-100"
                                aria-label="Close route info"
                            >
                                <Share2 className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                            </button>
                            <button 
                                onClick={handleCloseDest}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors group bg-gray-100"
                                aria-label="Close route info"
                            >
                                <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-row text-xl font-semibold">
                        {destinationData?.start} - {destinationData?.finish}
                    </div>
                </div>
                <div className="border-t border-gray-200 flex-1 flex flex-col overflow-y-hidden">
                    <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
                        <div className="flex flex-row text-lg font-medium items-center">
                            <div>{time} min ({ForamtedDistance(dis)})</div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-4 p-4">
                    <div className="text-xl font-bold">Steps</div>
                    <div className="flex flex-col gap-3 text-xl">
                        <div className="flex flex-row items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg py-2 px-3">
                            <LocateFixed className="text-blue-600 w-6 h-6"/>
                            {destinationData?.start}
                        </div>
                        {steps.map((step: step, index: number) => (
                            <React.Fragment key={index}>
                                <div className="flex flex-row items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg py-2 px-3">
                                    <div className="w-4.5 h-4.5 border-4 border-blue-500 bg-white rounded-full shrink-0"></div>
                                    {step?.instruction}
                                </div>
                                <div className="flex flex-row gap-2 items-center text-sm text-gray-400">
                                    {ForamtedDistance(step?.distance)}
                                    <div className="flex-1 bg-gray-100 h-[2px]"></div>
                                </div>
                            </React.Fragment>
                        ))}
                        <div className="flex flex-row items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg py-2 px-3">
                            <MapPin className="text-red-400 w-6 h-6"/>
                            {destinationData?.finish}
                        </div>
                    </div>
                </div>
            </div>
        </BottomDrawer>
        </>
    )
}