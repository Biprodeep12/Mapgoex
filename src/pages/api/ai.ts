import type { NextApiRequest, NextApiResponse } from "next";
import { BusData } from "@/types/bus";

interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AIResponse {
  reply: string;
  busData?: BusData | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIResponse | { error: string; detail?: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages } = req.body as {
      messages: Array<Partial<Message> & Record<string, unknown>>;
    };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const sanitizedMessages: Message[] = messages
      .map((m) => ({
        role: String(m.role || "user") as Message["role"],
        content: String(m.content || ""),
      }))
      .filter((m) => m.content.trim().length > 0)
      .slice(-20);

    const systemPrompt: Message = {
      role: "system",
      content: `You are Geox, a helpful AI assistant for bus transportation.
    Respond clearly and concisely in bullet points.

    If the user asks for a bus route or stops (like "A15 stops" or "B22 route"),
    respond briefly with an overview — such as the route direction, number of stops, starting and ending points,
    and any additional context that helps the user understand the route.

    IMPORTANT:
    - Do NOT include or list any actual bus stop names in your response.
    - The UI will display bus stops separately.
    - Only summarize or describe the route in general terms (e.g., "This route starts at X and ends at Y with around N stops").`,
    };

    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    const messageContent = lastMessage?.content?.toLowerCase() || "";

    const busMatch = messageContent.match(/\b([AB]\d+)\b/i);
    const hasBusIntent =
      /\b(stops|stop|route|details|info|information|schedule|timing|times)\b/.test(
        messageContent
      ) && !!busMatch;

    if (hasBusIntent && busMatch) {
      const busId = busMatch[1].toUpperCase();
      console.log("Detected bus intent for:", busId);

      const origin = req.headers.origin || "http://localhost:3000";
      const busRes = await fetch(`${origin}/api/bus/${busId}`);

      if (!busRes.ok) {
        return res.status(200).json({
          reply: `Sorry, I couldn't find bus route ${busId}.`,
          busData: null,
        });
      }

      const busData: BusData = await busRes.json();

      const summaryResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.3-8b-instruct:free",
            messages: [
              systemPrompt,
              ...sanitizedMessages,
              {
                role: "system",
                content: `Here is the bus route data for ${busId}: ${JSON.stringify(
                  busData
                )}. Summarize it for the user in bullet points.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        }
      );

      const summaryData = await summaryResponse.json();
      const reply =
        summaryData?.choices?.[0]?.message?.content ||
        `Here are the stops for route ${busId}:` ||
        "Sorry, something went wrong.";

      return res.status(200).json({ reply, busData });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [systemPrompt, ...sanitizedMessages],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply, busData: null });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
