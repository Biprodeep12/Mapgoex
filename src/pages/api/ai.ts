import { BusStop } from "@/types/bus";
import type { NextApiRequest, NextApiResponse } from "next";

interface Message {
  role: "user" | "system";
  content: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages } = req.body as { messages: Message[] };
    const userMessage = messages[messages.length - 1]?.content.toLowerCase() || "";

    const busMatch = userMessage.match(/\b([ab]\d{1,3})\b/i);

    let systemPromptContent =
      "You are Geox, an AI assistant that helps users with bus locations, nearby bus stops, estimated arrival times, and related travel information. Always respond clearly, briefly, and completely. Keep answers short but useful.";

    if (busMatch) {
      const busId = busMatch[1].toUpperCase(); // e.g., "A15", "B34"

      const origin = req.headers.origin || "http://localhost:3000";
      const busRes = await fetch(`${origin}/api/bus/${busId}`);

      if (busRes.ok) {
        const busData = await busRes.json();

        systemPromptContent += `\n\nBus Info:\nRoute: ${busData.Route}\nFrom "${busData.startPoint.name}" to "${busData.endPoint.name}".\nStops: ${busData.busStops
          .map((stop: BusStop) => stop.name)
          .join(", ")}.`;

      } else {
        console.warn(`Bus API returned status ${busRes.status} for ${busId}`);
      }
    }

    const systemPrompt = {
      role: "system",
      content: systemPromptContent,
    };

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3.1:free",
          messages: [systemPrompt, ...messages],
          max_tokens: 200,
        }),
      }
    );

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a response.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
