import { ArrowLeft, BusFront } from "lucide-react"

export const TicketSideBar = () => {
    return(
        <>
            <div className="fixed hidden max-[500px]:flex inset-0 bg-white z-1000 p-4 flex-col gap-4">
                <div className="flex flex-row gap-4 items-center">
                    <ArrowLeft className="w-7 h-7"/>
                    <span className="text-2xl font-bold">Book Ticket</span>
                </div>
                <div className="grid grid-rows-2 gap-3 text-lg">
                    <div className="flex flex-row gap-2 items-center py-3 px-4 rounded-xl text-black bg-blue-50">
                        <BusFront className="w-6 h-6 text-blue-500"/>
                        Source Stop
                    </div>
                    <div className="flex flex-row gap-2 items-center py-3 px-4 rounded-xl text-black bg-blue-50">
                        <BusFront className="w-6 h-6 text-blue-500"/>
                        Destination Stop
                    </div>                
                </div>
            </div>
        </>
    )
}