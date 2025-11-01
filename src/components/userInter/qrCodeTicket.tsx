import { X } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { Suspense, useEffect, useState } from "react";

interface qr {
    user: string,
    source: string,
    route: string,
    destination: string,
    booked: string,
}

interface Props {
    qrText: qr[];
    setQrText: React.Dispatch<React.SetStateAction<qr[]|null>>
}

export const QrCodeTicket = ({qrText,setQrText}:Props) => {
    const [qrUrl, setQrUrl] = useState("");

    useEffect(() => {
        if(qrText.length>0){
            QRCode.toDataURL(JSON.stringify(qrText[0])).then(setQrUrl);
        }
    }, [qrText]);

    return(
        <div className="fixed inset-0 z-600 bg-black/20 backdrop-blur-[2px] px-4 flex items-center justify-center">
            <div className="bg-white rounded-lg aspect-square max-w-[500px] p-4 w-full flex flex-col items-center">
                <div className="flex flex-row justify-between w-full">
                    <span className="text-xl font-bold">QR</span>
                    <button onClick={()=>setQrText([])} className="rounded-full p-1 hover:bg-gray-100 cursor-pointer">
                        <X className="w-9 h-9"/>
                    </button>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                    {qrUrl && <Image src={qrUrl} alt="QR code" width={400} height={400} className="border rounded" />}
                </Suspense>
            </div>
        </div>
    )
}