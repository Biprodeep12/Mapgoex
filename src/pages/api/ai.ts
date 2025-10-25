import type { NextApiRequest, NextApiResponse } from "next";
import { BusData } from "@/types/bus";

interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface AssistantMessage extends Message {
  role: "assistant";
  tool_calls?: ToolCall[];
  text?: string;
  message?: string;
  response?: string;
}

interface ToolMessage {
  role: "tool";
  tool_call_id: string;
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

    if (sanitizedMessages.length === 0) {
      return res.status(400).json({ error: "No valid messages provided" });
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "getBusData",
          description:
            "Get detailed bus stop information for a specific route. ONLY use this when users explicitly ask for bus stops, route details, or stop information for a particular bus route (like 'A15 stops', 'B22 route details', 'show me A15 bus stops'). Do NOT use for general bus questions.",
          parameters: {
            type: "object",
            properties: {
              busId: {
                type: "string",
                description:
                  "The bus route ID (e.g., 'A15', 'B22', 'A1', 'B5'). Extract this from user queries specifically asking for bus stops or route details.",
                pattern: "^[AB]\\d+$",
              },
            },
            required: ["busId"],
          },
        },
      },
    ];

    const systemPrompt: Message = {
      role: "system",
      content:
        "You are Geox, a helpful AI assistant for bus transportation. Your role is to:\n\n1. Help users with general bus information, routes, and travel guidance\n2. Provide clear, concise responses in bullet points\n3. ONLY use the getBusData tool when users specifically ask for bus stops, route details, or stop information for a particular route (like 'A15 stops', 'B22 route details', 'show me A15 bus stops')\n4. For general questions about bus routes, schedules, or transportation, respond directly without using tools\n5. Be friendly, helpful, and keep responses brief",
    };

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
    }

    const lastMessage = sanitizedMessages.at(-1);
    const messageContent = lastMessage?.content?.toLowerCase() || "";

    const busStopRequestPatterns = [
      /\b(A|B)\d+\s+(stops?|route|details?|info|information)\b/,
      /\b(stops?|stop)\s+(for|of|on)\s+(A|B)\d+\b/,
      /\bshow\s+(me\s+)?(A|B)\d+\s+(stops?|route)\b/,
      /\b(A|B)\d+\s+(schedule|times?|timings?)\b/,
    ];

    const hasExplicitBusRequest = busStopRequestPatterns.some((p) =>
      p.test(messageContent)
    );

    const busMention = messageContent.match(/\b([AB]\d+)\b/i);
    const busId = busMention ? busMention[1].toUpperCase() : null;

    const needsToolCall = hasExplicitBusRequest && busId;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [systemPrompt, ...sanitizedMessages],
        ...(needsToolCall ? { tools, tool_choice: "auto" } : {}),
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);
      return res
        .status(response.status)
        .json({ error: "Failed to get AI response", detail: errorText });
    }

    const data = await response.json();
    const choice = data?.choices?.[0];
    const assistantMessage = choice?.message as AssistantMessage | undefined;

    if (!assistantMessage) {
      return res.status(500).json({ error: "Invalid AI response" });
    }

    if (assistantMessage.tool_calls?.length) {
      const toolCall = assistantMessage.tool_calls[0];
      if (toolCall.function.name !== "getBusData") {
        return res.status(400).json({ error: "Unknown tool call" });
      }

      let parsedBusId: string | null = null;
      try {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        parsedBusId = args.busId?.toUpperCase?.() || null;
      } catch (err) {
        console.error("Tool call parse error:", err);
      }

      const finalBusId = parsedBusId || busId;
      if (!finalBusId || !/^[AB]\d+$/i.test(finalBusId)) {
        return res.status(400).json({
          error:
            "Invalid or missing bus route ID. Please specify like A15 or B22.",
        });
      }

      try {
        const origin = req.headers.origin || "http://localhost:3000";
        const busRes = await fetch(`${origin}/api/bus/${finalBusId}`);
        if (!busRes.ok) {
          return res.status(200).json({
            reply: `Sorry, I couldn't find route ${finalBusId}.`,
            busData: null,
          });
        }

        const busData = await busRes.json();

        const toolMessage: ToolMessage = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(busData),
        };

        const followUpRes = await fetch(
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
                assistantMessage,
                toolMessage,
              ],
              temperature: 0.7,
              max_tokens: 1000,
            }),
          }
        );

        const followUpData = await followUpRes.json();
        const finalReply =
          followUpData?.choices?.[0]?.message?.content ||
          `Here are the route details for ${finalBusId}.`;

        return res.status(200).json({
          reply: finalReply,
          busData,
        });
      } catch (err) {
        console.error("Error fetching route info:", err);
        return res.status(200).json({
          reply: `Sorry, I couldn’t fetch data for route ${finalBusId}.`,
          busData: null,
        });
      }
    }

    const reply =
      assistantMessage.content ||
      assistantMessage.text ||
      assistantMessage.message ||
      assistantMessage.response ||
      "Sorry, I couldn’t generate a response.";

    return res.status(200).json({ reply, busData: null });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
