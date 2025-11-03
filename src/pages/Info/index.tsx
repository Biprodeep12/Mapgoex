import Langhuh from "@/components/Langhuh"
import { MapPin, Zap, Ticket, Star, Lightbulb, Globe, Github, Linkedin, Instagram, Languages, ArrowRight } from "lucide-react"
import Head from "next/head"
import Image from "next/image"
import { useState } from "react"

const AboutPage = () => {
  const [langTheme, setLangTheme] = useState(false);
  const features = [
    {
      icon: MapPin,
      title: "Interactive Map & Routing",
      description:
        "Explore bus routes, search locations, and get step-by-step directions using OpenStreetMap and MapLibre technology.",
      image: "/route.jpg",
    },
    {
      icon: Zap,
      title: "Real-Time Bus Tracking",
      description:
        "Monitor live bus positions, check estimated arrival times (ETA), and stay informed every step of your journey.",
      image: "/real1.png",
    },
    {
      icon: Ticket,
      title: "Ticketing System",
      description:
        "Book tickets directly from our platform with dynamic fare calculation and easy access to your booking history.",
      image: "/ticket.png",
    },
    {
      icon: Star,
      title: "Ratings & Reviews",
      description:
        "Share your experience and rate buses to help improve service reliability and build a transparent community.",
      image: "/ratings.jpg",
    },
    {
      icon: Lightbulb,
      title: "AI Assistant – Geox",
      description:
        "Get intelligent answers about routes, stops, and journey planning in multiple languages with our AI-powered assistant.",
      image: "/ai.png",
    },
    {
      icon: Globe,
      title: "Multilingual Support",
      description:
        "Access our platform in multiple languages, ensuring everyone can navigate and use MapGoex comfortably.",
      image: "/lang.png",
    },
  ]

  return (
    <>
    <Head>
      <title>MapGeox | About</title>

      {features.map((f, i) => (
        <link key={i} rel="preload" as="image" href={f.image} />
      ))}

      <link rel="preload" as="image" href="/huh.png" />

      <meta 
        name="description" 
        content="Learn more about MapGeox — a smart bus and route mapping platform built with Next.js, MapLibre, and OpenStreetMap. Discover our mission to simplify public transport navigation with real-time tracking and intelligent routing." 
      />
      <meta 
        name="keywords" 
        content="MapGeox, about MapGeox, transport mapping, bus routes, real-time bus tracking, route planning, OpenStreetMap, MapLibre, OpenRouteService" 
      />
      <meta 
        name="author" 
        content="MapGeox Team" 
      />

      <meta 
        property="og:title" 
        content="About MapGeox | Smart Bus & Route Mapping Platform" 
      />
      <meta 
        property="og:description" 
        content="Discover how MapGeox helps you explore bus routes, track live locations, and plan your journey efficiently." 
      />
      <meta 
        property="og:image" 
        content="/logo.svg" 
      />
      <meta 
        property="og:url" 
        content="https://mapgeox.vercel.app/Info" 
      />
      <meta 
        property="og:type" 
        content="website" 
      />

      <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    </Head>
    <main className="min-h-screen bg-white text-gray-900">
      <Langhuh setLangTheme={setLangTheme} langTheme={langTheme}/>
      
      <button onClick={()=>setLangTheme(true)} className="absolute cursor-pointer top-5 right-5 rounded-full p-2 bg-blue-500 hover:bg-blue-600">
        <Languages className="text-white"/>
      </button>

      <section className="w-full py-20 px-4 sm:py-32 bg-blue-400 text-white">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-balance text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">About MapGoex</h1>
          <div className="text-lg sm:text-xl max-w-2xl leading-relaxed flex flex-row items-center gap-2">
            Smart Bus Tracking & Routing Platform
            <button onClick={()=>window.location.href="/"} className="rounded-full p-2 shadow-2xl hover:bg-blue-500 cursor-pointer">
              <ArrowRight/>
            </button>
          </div>
        </div>
      </section>

      <section className="w-full py-16 px-4 sm:py-20 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-5 leading-relaxed text-lg">
                MapGoex is dedicated to revolutionizing public transportation by providing real-time bus tracking,
                intelligent routing, and seamless ticketing solutions. We make commuting easier, safer, and more
                transparent for everyone.
              </p>
              <p className="text-gray-600 leading-relaxed text-lg">
                Our platform empowers users with accurate information and AI-assisted journey planning, ensuring every
                trip is optimized and enjoyable.
              </p>
            </div>
            <div className="bg-white rounded-lg aspect-square flex items-center justify-center relative">
              <Image src="/huh.png" alt="Mission illustration" priority fill className="object-contain" />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full pt-16 px-4 sm:pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-center">Core Features</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="flex flex-col">
                  <div className="bg-gray-100 rounded-lg h-65 mb-5 flex items-center justify-center overflow-hidden relative">
                    <Image
                      src={feature.image || "/placeholder.svg"}
                      alt={feature.title}
                      priority
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex gap-3 mb-3">
                    <Icon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
        <Image
          src="/tenor.gif"
          alt="gif"
          width={300}
          height={300}
          className="max-[640px]:mx-auto"
        />
      </section>

      <section className="w-full py-16 px-4 sm:py-20 bg-blue-50 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12">Our Technology</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Frontend</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 mt-0.5">•</span>
                  <span>Next.js with React & TypeScript</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 mt-0.5">•</span>
                  <span>Tailwind CSS for styling</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Backend</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 mt-0.5">•</span>
                  <span>Node.js & Express.js</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 mt-0.5">•</span>
                  <span>Next.js API Routes</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Mapping & Data</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 mt-0.5">•</span>
                  <span>OpenStreetMap & MapLibre GL</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 mt-0.5">•</span>
                  <span>OpenRouteService</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 mt-0.5">•</span>
                  <span>MongoDB Database</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">AI & Integration</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 mt-0.5">•</span>
                  <span>OpenRouter API</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-900 mt-0.5">•</span>
                  <span>Geox AI Assistant</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 px-4 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Transform Your Commute?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of commuters who are already using MapGoex for smarter, faster journeys.
          </p>
          <button onClick={()=>window.location.href="/"} className="bg-blue-500 cursor-pointer text-white px-8 py-3 rounded font-semibold hover:bg-blue-600 transition-colors">
            Get Started Today
          </button>
        </div>
      </section>
      <footer className="w-full py-2 px-2 flex justify-center">
        <div className="rounded-2xl py-2 px-4 flex flex-row items-center flex-wrap text-wrap justify-center text-lg gap-4 bg-blue-100">
          Made by
          <span className="font-bold">@Biprodeep Bose</span>
          <div className="flex flex-row items-center gap-3 max-[400px]:justify-evenly max-[400px]:w-full">
            <a href="https://github.com/Biprodeep12">
              <Github className="hover:text-blue-500"/>
            </a>
            <a href="https://www.linkedin.com/in/biprodeep-bose-3b47862ba/">
              <Linkedin className="hover:text-blue-500"/>
            </a>
            <a href="https://www.instagram.com/bosebd/">
              <Instagram className="hover:text-blue-500"/>
            </a>
          </div>
        </div>
      </footer>
    </main>
    </>
  )
}
export default AboutPage;