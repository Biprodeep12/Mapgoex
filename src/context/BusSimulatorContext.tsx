import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import io, { Socket } from "socket.io-client";

interface StopETA {
  stopId: string;
  eta: string | null;
  etaSeconds: number | null;
  reached: boolean;
}

interface BusLocation {
  busId: string;
  speedKmh: number;
  coords: [number, number];
}

interface TrackingBusStop {
  busStopID: number|null;
  active: boolean
}

interface BusSimulatorContextType {
  routeId: string;
  setRouteId: (id: string) => void;
  logs: string[];
  subscribe: () => void;
  unsubscribe: () => void;
  startSimulation: () => void;
  busPos: BusLocation[] | null;
  setBusPos: React.Dispatch<React.SetStateAction<BusLocation[] | null>>;
  busStopsETA: StopETA[] | null;
  setBusStopsETA: React.Dispatch<React.SetStateAction<StopETA[] | null>>;
  isConnected: boolean;
  trackingBusStop: TrackingBusStop;
  setTrackingBusStop: React.Dispatch<React.SetStateAction<TrackingBusStop>>;
}

const BusSimulatorContext = createContext<BusSimulatorContextType | null>(null);

export const useBusSimulator = () => {
  const ctx = useContext(BusSimulatorContext);
  if (!ctx) throw new Error("useBusSimulator must be used inside BusSimulatorProvider");
  return ctx;
};

export const BusSimulatorProvider = ({ children }: { children: ReactNode }) => {
  const [routeId, setRouteId] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [busPos, setBusPos] = useState<BusLocation[] | null>(null);
  const [busStopsETA, setBusStopsETA] = useState<StopETA[] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [trackingBusStop, setTrackingBusStop] = useState<TrackingBusStop>({
    busStopID: null,
    active: false
  });

  const socketRef = useRef<Socket | null>(null);

  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  useEffect(() => {
    const socket = io("http://43.204.147.37/");
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      log("✅ Connected to server");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      log("❌ Disconnected from server");
    });

    socket.on("simulationStarted", (data: { routeId: string }) => {
      log(`▶️ Simulation started for route ${data.routeId}`);
    });

    socket.on("simulationFinished", (data: { routeId: string }) => {
      log(`🏁 Simulation finished for route ${data.routeId}`);
    });

    socket.on("error", (err: { message: string }) => {
      log("⚠️ Error: " + err.message);
    });

    socket.on("locationUpdate", (data: BusLocation) => {
      const [lng, lat] = data.coords;
      if (!isNaN(lng) && !isNaN(lat)) {
        setBusPos([
          { busId: data.busId, speedKmh: data.speedKmh, coords: [lng, lat] },
        ]);
      }
    });

    socket.on("busStopInfo", (data: { stops: StopETA[] }) => {
      setBusStopsETA(data.stops);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (routeId && isConnected) {
      socketRef.current?.emit("subscribe", routeId);
      log("📡 Auto-subscribed to route " + routeId);
    }
  }, [routeId, isConnected]);

  const subscribe = () => {
    if (!routeId) {
      log("⚠️ Cannot subscribe: no routeId set");
      return;
    }
    if (!isConnected) {
      log("⚠️ Cannot subscribe: socket not connected yet");
      return;
    }
    socketRef.current?.emit("subscribe", routeId);
    log("📡 Subscribed to route " + routeId);
  };

  const unsubscribe = () => {
    if (!routeId || !isConnected) return;
    socketRef.current?.emit("unsubscribe", routeId);
    log("❌ Unsubscribed from route " + routeId);
  };

  const startSimulation = () => {
    if (!routeId || !isConnected) return;
    socketRef.current?.emit("startSimulation", {routeId});
    log("▶️ Requested simulation start for " + routeId);
  };

  return (
    <BusSimulatorContext.Provider
      value={{
        routeId,
        setRouteId,
        logs,
        subscribe,
        unsubscribe,
        startSimulation,
        busPos,
        setBusPos,
        busStopsETA,
        setBusStopsETA,
        isConnected,
        trackingBusStop,
        setTrackingBusStop
      }}
    >
      {children}
    </BusSimulatorContext.Provider>
  );
};
