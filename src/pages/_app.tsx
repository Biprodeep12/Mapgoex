import { MapProvider } from "@/context/MapContext";
import { AuthProvider } from "@/context/userContext";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";

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
      <MapProvider>
        <Component {...pageProps} />
      </MapProvider>
    </AuthProvider>
  );
}
