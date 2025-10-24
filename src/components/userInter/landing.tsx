import { Leaf, TrendingDown, Users } from "lucide-react"

export function CarbonEmissionCard() {
  return (
    <div className="fixed right-13 left-0 bottom-5 pl-5">
      <div className="bg-white rounded-lg ml-auto max-w-[340px] w-full shadow-lg overflow-hidden border border-blue-200">
        <div className="bg-blue-500 px-4 py-3">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-400 p-1.5 rounded-lg">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-white font-bold text-base">Environmental Impact</h3>
            </div>
          </div>
          <p className="text-blue-100 text-xs font-medium mt-1">Your sustainable choice matters</p>
        </div>

        <div className="px-4 py-3 space-y-2">
          <div className="bg-green-50 rounded-lg p-2.5 border-l-4 border-green-500">
            <p className="text-green-800 text-xs leading-snug">
              <span className="font-bold text-green-600">75% less CO₂</span>
              <span className="text-green-700"> with public transport</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-300">
              <div className="flex items-start gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg flex-shrink-0">
                  <TrendingDown className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-blue-700 font-bold text-lg leading-tight">75%</p>
                  <p className="text-blue-600 text-xs font-medium">CO₂ Cut</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-300">
              <div className="flex items-start gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg flex-shrink-0">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-blue-700 font-bold text-lg leading-tight">40x</p>
                  <p className="text-blue-600 text-xs font-medium">Efficient</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-2 border border-green-300">
            <p className="text-green-700 text-xs font-semibold">✓ 2.3 kg CO₂ saved per trip</p>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <p className="text-gray-600 text-xs text-center leading-snug font-medium">
              Every journey builds a greener future
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
