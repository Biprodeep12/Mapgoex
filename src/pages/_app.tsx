import { BusSimulatorProvider } from "@/context/BusSimulatorContext";
import { MapProvider } from "@/context/MapContext";
import { AuthProvider } from "@/context/userContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
// import dynamic from "next/dynamic";

// const BusClientOnlyComponent = dynamic(() => import("@/components/ClientSide/busSimulation"), {
//   ssr: false,
// });

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: GoogleTranslateElementConstructor;
      };
    };
  }

  interface GoogleTranslateElementConstructor {
    new (
      options: {
        pageLanguage: string;
        includedLanguages?: string;
        layout?: GoogleTranslateInlineLayout;
      },
      elementId: string
    ): void;

    InlineLayout: GoogleTranslateInlineLayoutMap;
  }

  interface GoogleTranslateInlineLayoutMap {
    SIMPLE: GoogleTranslateInlineLayout;
    [key: string]: GoogleTranslateInlineLayout;
  }

  type GoogleTranslateInlineLayout = unknown;
}

export default function App({ Component, pageProps }: AppProps) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(reg => console.log('Service Worker Registered', reg))
        .catch(err => console.error('Service Worker registration failed', err));
    }
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    window.googleTranslateElementInit = () => {
      if (window.google?.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,bn,pa,ta,te,gu,ml,kn,mr,or",
          },
          "google_translate_element"
        );
      }
    };
  }, []);

  return (
    <AuthProvider>
      <BusSimulatorProvider>
        <MapProvider>
          {/* <BusClientOnlyComponent/> */}
          <Component {...pageProps} />
        </MapProvider>
      </BusSimulatorProvider>
    </AuthProvider>
  );
}
