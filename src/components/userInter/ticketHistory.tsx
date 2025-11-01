import { useAuth } from "@/context/userContext";
import { convertUTCtoIST, has24HoursPassed } from "@/utils/time";
import { ArrowRight, Loader2, QrCode, X } from "lucide-react";
import { QrCodeTicket } from "./qrCodeTicket";
import { useState } from "react";

interface qr {
    user: string,
    source: string,
    route: string,
    destination: string,
    booked: string,
}

export const TicketHistory = () => {
    const { ticketHistory, books, setTicketHistory, liveTickets , user } = useAuth();
    const [qrText, setQrText] = useState<qr[]|null>([])

    if(!user) return;
    
    return(
        <>
        {qrText && qrText?.length>0 && <QrCodeTicket qrText={qrText} setQrText={setQrText}/>}
        {ticketHistory && <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-501" />}
        <div className={`fixed z-502 p-3 left-1/2 -translate-x-1/2 flex flex-col bottom-0 w-full max-w-[640px] h-1/2 ${ticketHistory?'translate-y-0':'translate-y-200'} transition-all duration-200 rounded-t-3xl bg-white`}>
            <button
            onClick={()=>setTicketHistory(false)}
            className="absolute p-3 rounded-full bg-white cursor-pointer hover:bg-gray-100 -top-17 left-1/2 -translate-x-1/2"
            >
            <X className="w-7 h-7" />
            </button>
            <div className="text-2xl font-bold mx-auto mb-5">Ticket History</div>
            <div className="flex-1 overflow-y-auto space-y-2">
            {books.length>0 ? 
                (books?.map((tick,indx)=>{
                    const isExpired = has24HoursPassed(tick.time.toString());
                    return(
                    <div key={indx} className={`rounded-lg border-2 border-blue-500 ${isExpired && 'opacity-50'} flex flex-col gap-4 p-4`}>
                        <div className="flex flex-row justify-between">
                            <div className="flex flex-row items-center gap-1">
                                <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                                    {tick.route}
                                </div>
                                x
                                <div className="flex items-center justify-center h-8 rounded-lg py-1 px-2 font-bold bg-blue-200">
                                {tick.count} Ticket{tick.count>1?'s':''}
                                </div>
                            </div>
                            <div 
                                className="flex items-center justify-center h-8 bg-green-400 text-white rounded-lg font-bold py-1 px-2">
                                ₹{tick.payment}
                            </div>
                        </div>
                        <div className="grid grid-cols-[40%_20%_40%] rounded-lg bg-blue-50 p-1 items-center justify-center text-center text-wrap text-lg">
                            <span>{tick.source}</span> 
                            <ArrowRight className="w-6 h-6 text-blue-500 justify-self-center-safe"/>
                            <span>{tick.destination}</span>
                        </div>
                        <div className="flex flex-row items-center justify-between">
                            <div className="flex flex-row items-center gap-1">
                            <span className="font-bold">Booked on:</span>
                            {convertUTCtoIST(tick.time.toString())}
                            </div>
                            {isExpired ? 
                                <div className="py-1 px-2 rounded-lg bg-gray-300 font-bold">Expired</div>
                                :
                                <button onClick={()=>setQrText([{
                                    user: user?.displayName || 'Not Found',
                                    route: tick.route,
                                    source: tick.source,
                                    destination: tick.destination,
                                    booked: convertUTCtoIST(tick.time.toString())
                                }])} className="p-2 gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer font-bold">
                                    <QrCode/>
                                </button>
                            }
                        </div>
                    </div>
                    )
                }))
            :
            (liveTickets ? 
                <div className="h-full flex items-center justify-center">
                    <Loader2 className="text-black h-8 w-8 animate-spin"/>
                </div>  
                    : 
                <div className="flex items-center justify-center h-full text-xl ">
                    {user?'No Tickets to be Seen':'Login to See your Tickets'}
                </div>
            )
            }
            </div>
        </div>
        </>
    )
}