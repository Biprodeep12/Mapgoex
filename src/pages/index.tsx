import MainMap from "@/components/map";
import UserInter from "@/components/userInter";
import Head from "next/head";

export default function Home() {
  
  return (
    <>
    <Head>
      <title>MapGeox</title>
      <meta 
        name="description" 
        content="Hackathon Project Mapping" 
      />
      <link rel="icon" type="image/png" href="/logo.svg" />
    </Head>
    <div>
      <MainMap/>
      <UserInter/>
    </div>
    </>
  );
}
