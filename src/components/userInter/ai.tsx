import { ArrowUp, Bus, X } from "lucide-react";
import { useState } from "react";
import BottomDrawer from "../drawer";

interface Message {
  role: "user" | "system";
  content: string;
}

interface props {
    openAi: boolean
    setOpenAi: React.Dispatch<React.SetStateAction<boolean>>
}

export const Ai = ({setOpenAi, openAi}:props) => {
  const [userInput, setUserInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "Hi! I m Geox. Ask me about bus locations, stops, or travel times." },
    ]);

  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

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

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: data.reply },
        ]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className={`fixed bottom-5 left-5 p-2 transition-all duration-200 ${openAi?'translate-y-0 opacity-100':'translate-y-100 opacity-0'} bg-white w-full max-w-[340px] max-h-[500px] h-full text-lg drop-shadow-2xl rounded-2xl max-md:hidden flex flex-col gap-2`}>
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
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-300 text-white"
                  : "bg-blue-100 text-blue-500"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-blue-400 flex flex-row items-center gap-1">
            <div className="animate-bounce w-1.5 h-1.5 bg-blue-400 rounded-full" style={{animationDelay:'100ms'}}/>
            <div className="animate-bounce w-1.5 h-1.5 bg-blue-400 rounded-full" style={{animationDelay:'200ms'}}/>
            <div className="animate-bounce w-1.5 h-1.5 bg-blue-400 rounded-full" style={{animationDelay:'300ms'}}/>
            <Bus/>
          </div>
        )}
      </div>

      <div className="bg-blue-100 rounded-xl p-1">
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
    {openAi && 
    <BottomDrawer>
        <div className={`bg-white w-full h-full pb-4 text-lg px-2 rounded-2xl flex flex-col gap-2`}>
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
                    className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === "user"
                        ? "bg-blue-300 text-white"
                        : "bg-blue-100 text-blue-500"
                    }`}
                    >
                    {message.content}
                    </div>
                </div>
                ))}
                {loading && (
                <div className="text-blue-400 flex flex-row items-center gap-1">
                    <div className="animate-bounce w-1.5 h-1.5 bg-blue-400 rounded-full" style={{animationDelay:'100ms'}}/>
                    <div className="animate-bounce w-1.5 h-1.5 bg-blue-400 rounded-full" style={{animationDelay:'200ms'}}/>
                    <div className="animate-bounce w-1.5 h-1.5 bg-blue-400 rounded-full" style={{animationDelay:'300ms'}}/>
                    <Bus/>
                </div>
                )}
            </div>

            <div className="bg-blue-100 rounded-xl p-1">
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
    </BottomDrawer>}
    </>
  );
};
