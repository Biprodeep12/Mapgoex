import { MapProvider } from "@/context/MapContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MapProvider>
      <Component {...pageProps} />
    </MapProvider>
  );
}
