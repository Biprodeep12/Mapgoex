import MainMap from "@/components/map";
import UserInter from "@/components/userInter";
import Head from "next/head";

export default function Home() {
  
  return (
    <>
    <Head>
      <title>MapGeox | Smart Bus & Route Mapping Platform</title>
      <meta 
        name="description" 
        content="Explore bus routes, stops, and live locations with MapGeox — your intelligent transport and mapping assistant powered by OpenStreetMap, MapLibre, and OpenRouteService." 
      />
      <meta 
        name="keywords" 
        content="MapGeox, bus routes, live tracking, transport map, OpenStreetMap, MapLibre, route planner, travel directions, real-time navigation, mapping app" 
      />
      <meta 
        name="author" 
        content="MapGeox Team" 
      />
      <meta 
        property="og:title" 
        content="MapGeox | Smart Bus & Route Mapping Platform" 
      />
      <meta 
        property="og:description" 
        content="Plan routes, track buses, and navigate the city smarter with MapGeox — your all-in-one transport mapping solution." 
      />
      <meta 
        property="og:image" 
        content="/logo.svg" 
      />
      <meta 
        property="og:url" 
        content="https://mapgeox.vercel.app/" 
      />
      <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    </Head>
    <div>
      <MainMap/>
      <UserInter/>
    </div>
    </>
  );
}
