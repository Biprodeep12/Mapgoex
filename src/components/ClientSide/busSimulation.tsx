// import { useBusSimulator } from "@/context/BusSimulatorContext";
// import { useMapContext } from "@/context/MapContext";
import { useEffect, useState } from "react";

// import * as turf from "@turf/turf";

const BusSimul = () => {
  // const { routeGeoJSON } = useMapContext()
  // const { routeId, setBusPos } = useBusSimulator();
  const [isOnline, setIsOnline] = useState(true);
  // const [distanceAlongKm, setDistanceAlongKm] = useState(0) 

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // const totalLengthKm = (routeGeoJSON?.features[0]?.properties?.summary?.distance) / 1000;
  // const TICK_MS = 1000
  // const speedKmh = 40;
  // const speedKmPerSec = speedKmh / 3600;
  // const tickSeconds = TICK_MS / 1000;
  // const stepKm = speedKmPerSec * tickSeconds;
  // const busId = routeId;

  // useEffect(() =>{
  // const line =
  //   routeGeoJSON?.features[0]?.geometry?.type === "LineString"
  //     ? turf.lineString(routeGeoJSON.features[0].geometry.coordinates)
  //     : null;

  // const intervalId = setInterval(async () => {
  //   setDistanceAlongKm(distanceAlongKm + stepKm);
  //   if (distanceAlongKm > totalLengthKm) setDistanceAlongKm(totalLengthKm);

  //   if (line) {
  //     const currentPoint = turf.along(line, distanceAlongKm, { units: "kilometers" });
  //     const coords = currentPoint.geometry.coordinates;

  //   }}, TICK_MS)
  // },[distanceAlongKm])

  return (
    <div className="fixed">
      Status: {isOnline ? "🟢 Online" : "🔴 Offline"}
    </div>
  );
}

export default BusSimul;