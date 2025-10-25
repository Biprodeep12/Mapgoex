import { ArrowUp, Bus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown"
import getKeyboardHeight from "./keyboardheight";
import { BusData } from "@/types/bus";
import { useMapContext } from "@/context/MapContext";
import { destinationType } from ".";

interface Message {
  role: "user" | "system" | "assistant";
  content: string;
  data? : BusData|null;
}

interface props {
    openAi: boolean
    setOpenAi: React.Dispatch<React.SetStateAction<boolean>>
    setDestinationData: React.Dispatch<React.SetStateAction<destinationType>>
}

export const Ai = ({setOpenAi, openAi, setDestinationData}:props) => {
  const { setAnonLocation, setMapCenter } = useMapContext();
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Geox. Ask me about bus locations, stops, or travel times." },
  ]);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight,setKeyboardHeight] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    if (loading) return;
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userInput },
    ];
    setMessages(newMessages);
    setUserInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("API Error:", data);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error || "Something went wrong"}`, data: null },
        ]);
        return;
      }

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, data: data.busData || null },
        ]);
      } else {
        console.error("No reply in response:", data);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't generate a response.", data: null },
        ]);
      }

    } catch (err) {
      console.error("Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error connecting to the server.", data: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedDestinationClick = (dest:string,coords:[number,number]) => {
    setDestinationData((prev) => ({
      ...prev,
      finish: dest,
      B: coords,
      startActive: true,
      finishActive: true,
    }));
  }

	useEffect(() => {
		const unsubscribe = getKeyboardHeight((height) => {
			setKeyboardHeight(height);
		});

		return () => {
			unsubscribe();
		};
	}, []);

  useEffect(() => {
    if (openAi) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, Math.abs(scrollY));
      };
    }
  }, [openAi])

  return (
    <>
    {openAi&&<div className="bg-white/20 md:hidden fixed z-[21] inset-0 backdrop-blur-sm"></div>}
    <div className={`fixed md:bottom-5 max-md:top-1/2 md:left-5 left-1/2 max-md:-translate-1/2 p-2 transition-all duration-300 z-[22] ${openAi?'translate-y-0 opacity-100 flex':'translate-y-100 opacity-0 hidden'} bg-white md:w-full w-[95%] max-w-[340px] max-h-[95%] md:max-h-[500px] h-full text-lg drop-shadow-2xl rounded-2xl flex-col gap-2`}>
      <div className="flex flex-row items-center justify-between rounded-xl text-xl bg-blue-100 py-1 px-2">
        <div className="font-semibold text-blue-600">Geox</div>
        <X onClick={()=>setOpenAi(false)} className="p-[1px] rounded-full text-blue-600 hover:bg-blue-50 cursor-pointer" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-lg ${
                message.role === "user"
                  ? "bg-blue-300 text-white max-w-[80%] p-3"
                  : "text-blue-500 w-full"
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
               {message?.data &&
               <>
                 <div className="text-lg font-bold text-blue-600 mb-1">Bus Stops:</div>
                 <div className="grid grid-cols-2 w-full gap-2 mt-3">
                  {message?.data?.busStops?.map((bus,indx)=>
                    <button 
                      onClick={()=>{setAnonLocation(bus.coords);setMapCenter({center: bus.coords,zoom: 15});selectedDestinationClick(bus.name,bus.coords)}} 
                      className="cursor-pointer flex items-center p-3 rounded-xl bg-blue-50 border hover:border-blue-500 border-blue-200" 
                    key={indx}>
                      <span className="text-gray-800 text-sm font-medium truncate">{bus.name}</span>
                    </button>
                  )}
               </div>
               </>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start">
            <div className="text-blue-400 flex flex-row items-center gap-1">
              <div className="animate-bounce w-1.5 h-1.5 bg-blue-400 rounded-full" style={{animationDelay:'100ms'}}/>
              <div className="animate-bounce w-1.5 h-1.5 bg-blue-400 rounded-full" style={{animationDelay:'200ms'}}/>
              <div className="animate-bounce w-1.5 h-1.5 bg-blue-400 rounded-full" style={{animationDelay:'300ms'}}/>
              <Bus/>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-blue-100 rounded-xl p-1" style={{ marginBottom: `${keyboardHeight}px` }}>
        <div className="bg-white w-full rounded-lg flex flex-row items-center p-1">
          <input
            type="text"
            placeholder="Type Something"
            className="text-lg px-1 h-10 w-full outline-none"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="hover:bg-blue-50 bg-blue-100 cursor-pointer w-10 h-10 shrink-0 rounded-full flex items-center justify-center"
          >
            <ArrowUp className="text-blue-600" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
