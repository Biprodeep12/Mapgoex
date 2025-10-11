import { useMapContext } from "@/context/MapContext";
import axios from "axios";
import { CarFront, Footprints, Loader2 } from "lucide-react";
import { SetStateAction, useCallback, useEffect, useRef, useState } from "react";

const ROUTE_PROFILES = [
  { id: "foot-walking", label: "Walking", icon: Footprints },
  { id: "driving-car", label: "Driving", icon: CarFront },
];

interface props {
  openAi: boolean
  setOpenAi: React.Dispatch<React.SetStateAction<boolean>>
}

const GetRoute = ({openAi, setOpenAi}:props) => {
  const { userLocation, setAnonRouteGeoJSON, anonRouteGeoJSON, anonLocation, setMapCenter } = useMapContext();
  const [loading, setLoading] = useState(false);
  const [activeProfile, setActiveProfile] = useState<string>("");
  const ContentRef = useRef<{ userLocation: [number, number]; anonLocation: [number, number];profile: string } | null>(null)

  const fetchRoute = useCallback(
    async (profile: string) => {
      if (!userLocation || !anonLocation) return;
      if(JSON.stringify(ContentRef.current) === JSON.stringify({userLocation,anonLocation,profile})) return;

      ContentRef.current = {userLocation,anonLocation,profile};

      setLoading(true);
      setActiveProfile(profile);

      try {
        const res = await axios.post(
          `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
          { coordinates: [userLocation, anonLocation] },
          {
            headers: {
              Authorization:
                "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjczZGM4NTFmMDVkOTRiOTRhNzFmNTBlMmRhODI0OThhIiwiaCI6Im11cm11cjY0In0=",
              "Content-Type": "application/json",
            },
          }
        );

        setAnonRouteGeoJSON(res.data);        

        const centerLng = (userLocation[0] + anonLocation[0]) / 2;
        const centerLat = (userLocation[1] + anonLocation[1]) / 2;

        setMapCenter({
          center: [centerLng, centerLat],
          zoom: 14,
        });
      } catch (err) {
        console.error("Error fetching route:", err);
      } finally {
        setLoading(false);
      }
    },
    [userLocation, anonLocation]
  );

  useEffect(() => {
    if(openAi && anonRouteGeoJSON) {
      setOpenAi(false);
    }
  },[anonRouteGeoJSON,openAi,setOpenAi])

  useEffect(()=>{
    if(!anonRouteGeoJSON){
      setActiveProfile('')
    }
  },[anonRouteGeoJSON])

  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {ROUTE_PROFILES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          disabled={loading}
          onClick={() => fetchRoute(id)}
          className={`cursor-pointer py-2 px-3 border border-blue-400 rounded-lg text-lg flex flex-row gap-2 justify-center items-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          ${
            activeProfile === id
              ? "bg-blue-400 text-white"
              : "bg-white text-blue-400"
          }`}
        >
          {!loading || activeProfile !== id ? (
            <>
              <Icon className="w-6 h-6" />
              {label}
            </>
          ) : (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Loading
            </>
          )}
        </button>
      ))}
    </div>
  );
};

export default GetRoute;