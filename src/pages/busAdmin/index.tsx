import { useBusSimulator } from "@/context/BusSimulatorContext"
import { Bus, Play } from "lucide-react"

const buses = [{ id: "A15" }, { id: "B22" }]

const BusAdmin = () => {
  const { startSimulation } = useBusSimulator()

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">Bus Fleet Control</div>
          </div>
          <div className="text-gray-600 text-sm">Select a bus to start simulation and monitor real-time operations</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {buses.map((bus) => (
            <button
              key={bus.id}
              onClick={() => startSimulation(bus.id)}
              className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Bus className="w-6 h-6 text-blue-600 transition-colors" />
              </div>

              <div className="text-2xl font-bold text-gray-900 mb-4 font-mono">{bus.id}</div>

              <div className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2.5 px-4 group-hover:bg-blue-700 transition-colors">
                <Play className="w-4 h-4" />
                <div className="text-sm font-medium">Start Simulation</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BusAdmin
