import { useMapContext } from "@/context/MapContext";
import axios from "axios";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

type Address = {
    suburb?: string;
    city?: string;
    county?: string;
    state_district?: string;
    state?: string;
    "ISO3166-2-lvl4"?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
};

type locateAdd = {
    lat: string;
    lon: string;
    address: Address;
}  

export const LocationInfo = () => {
    const { anonLocation, setAnonLocation } = useMapContext();
    const [locationLoad, setLocationLoad] = useState(false);
    const [locateAddress, setLocateAddress] = useState<locateAdd | null>(null);

    const fetchLocInfo = async () => {        
        setLocateAddress(null);
        setLocationLoad(true);
        try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?lat=${anonLocation?.[1]}&lon=${anonLocation?.[0]}&format=json`
            );
            setLocateAddress(res.data);
        } catch (error) {
            console.error("Error fetching location info:", error);
        } finally {
            setLocationLoad(false)
        }
    }

    useEffect(() => {
        if(!anonLocation) return;
        fetchLocInfo();
    },[anonLocation])

    const ClosePop = () => {
        setAnonLocation(null)
    }

    if (!anonLocation) return null;

    return(
        <div className="bg-white w-full text-lg drop-shadow-2xl rounded-2xl p-3 transform transition-all duration-200 opacity-100 translate-x-0">
            <div className="flex justify-between items-start mb-2">
                <div className="font-semibold text-gray-800">Location Details</div>
                <button 
                    onClick={ClosePop}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close location info"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>
            
            {locateAddress && !locationLoad && (
                <div className="flex flex-col gap-2">
                    {locateAddress?.address?.suburb && (
                        <div className="text-gray-500 text-xl font-bold">
                           {locateAddress.address.suburb}, {locateAddress.address.city}
                        </div>
                    )}
                    {locateAddress?.address?.state && (
                        <div className="text-gray-700">
                            {locateAddress.address.state}, {locateAddress.address.country}
                        </div>
                    )}
                    {locateAddress?.address?.postcode && (
                        <div className="text-gray-700">
                            <span className="font-medium">Postcode:</span> {locateAddress.address.postcode}
                        </div>
                    )}
                </div>
            )}
            {locationLoad && 
            <div className="w-full flex justify-center py-4">
                <LoaderCircle className="w-10 h-10 p-2 animate-spin text-blue-500"/>
            </div>}
            {!locationLoad && !locateAddress &&
            <div className="text-red-400 text-xl font-bold">
              Not Found or Server Error
            </div>
            }
        </div>
    )
};