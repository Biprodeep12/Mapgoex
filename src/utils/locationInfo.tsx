import { useMapContext } from "@/context/MapContext";
import axios from "axios";
import { LoaderCircle, MapPin, X, AlertCircle } from "lucide-react";
import { useEffect, useState, useCallback, memo } from "react";
import { GeocodingResult } from "@/types/bus";

export const LocationInfo = memo(() => {
    const { anonLocation, setAnonLocation } = useMapContext();
    const [locationLoad, setLocationLoad] = useState(false);
    const [locateAddress, setLocateAddress] = useState<GeocodingResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchLocInfo = useCallback(async () => {
        if (!anonLocation) return;
        
        setLocateAddress(null);
        setError(null);
        setLocationLoad(true);
        
        try {
            const res = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?lat=${anonLocation[1]}&lon=${anonLocation[0]}&format=json&zoom=18&addressdetails=1`
            );
            setLocateAddress(res.data);
        } catch (error) {
            console.error("Error fetching location info:", error);
            setError("Failed to fetch location information");
        } finally {
            setLocationLoad(false);
        }
    }, [anonLocation]);

    useEffect(() => {
        if (!anonLocation) return;
        fetchLocInfo();
    }, [anonLocation, fetchLocInfo]);

    const handleClose = useCallback(() => {
        setAnonLocation(null);
        setLocateAddress(null);
        setError(null);
    }, [setAnonLocation]);

    if (!anonLocation) return null;

    return (
        <div className="bg-white w-full max-w-md text-lg drop-shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">Location Details</h3>
                </div>
                <button 
                    onClick={handleClose}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors group"
                    aria-label="Close location info"
                >
                    <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
                {locationLoad && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <LoaderCircle className="w-12 h-12 animate-spin text-blue-500 mb-3" />
                        <p className="text-gray-600 text-center">Fetching location information...</p>
                    </div>
                )}
                
                {error && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                        <p className="text-red-600 text-center font-medium">{error}</p>
                        <button 
                            onClick={fetchLocInfo}
                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                )}
                
                {locateAddress && !locationLoad && (
                    <div className="space-y-4">
                        {/* Primary location */}
                        {locateAddress.address.suburb && locateAddress.address.city && (
                            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="text-2xl font-bold text-blue-900 mb-1">
                                    {locateAddress.address.suburb}
                                </div>
                                <div className="text-lg text-blue-700">
                                    {locateAddress.address.city}
                                </div>
                            </div>
                        )}
                        
                        {/* Secondary location info */}
                        <div className="space-y-3">
                            {locateAddress.address.state && locateAddress.address.country && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="text-gray-700">
                                        {locateAddress.address.state}, {locateAddress.address.country}
                                    </div>
                                </div>
                            )}
                            
                            {locateAddress.address.postcode && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="text-gray-700">
                                        <span className="font-medium">Postcode:</span> {locateAddress.address.postcode}
                                    </div>
                                </div>
                            )}
                            
                            {locateAddress.address.county && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="text-gray-700">
                                        <span className="font-medium">County:</span> {locateAddress.address.county}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Coordinates */}
                        <div className="text-center p-3 bg-gray-100 rounded-lg">
                            <div className="text-sm text-gray-600 mb-1">Coordinates</div>
                            <div className="font-mono text-sm text-gray-800">
                                {anonLocation[1].toFixed(6)}, {anonLocation[0].toFixed(6)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

LocationInfo.displayName = 'LocationInfo';