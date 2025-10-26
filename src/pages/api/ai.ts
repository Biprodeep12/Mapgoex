import type { NextApiRequest, NextApiResponse } from "next";
import { BusData } from "@/types/bus";

interface Message {
  role: "user" | "system" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
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

interface OpenRouterResponse {
  choices?: Array<{
    message?: AssistantMessage & {
      content?: string;
    };
  }>;
}

interface BusRequest {
  messages: Array<Partial<Message> & Record<string, unknown>>;
}

interface ToolFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: {
      busId: {
        type: "string";
        description: string;
        pattern: string;
      };
    };
    required: string[];
  };
}

interface Tool {
  type: "function";
  function: ToolFunction;
}

interface OpenRouterPayload {
  model: string;
  messages: Message[];
  temperature: number;
  max_tokens: 1000;
  tools?: Tool[];
  tool_choice?: "auto" | "none";
}

interface ToolCallArguments {
  busId?: string;
}

// Validation functions
function isValidBusRequest(body: unknown): body is BusRequest {
  if (!body || typeof body !== "object") {
    return false;
  }

  const request = body as Record<string, unknown>;
  
  if (!Array.isArray(request.messages)) {
    return false;
  }

  return request.messages.every((m: unknown) => {
    if (!m || typeof m !== 'object') return false;
    
    const message = m as Record<string, unknown>;
    const role = message.role;
    const content = message.content;
    
    if (role !== undefined && typeof role !== 'string') return false;
    if (content !== undefined && typeof content !== 'string') return false;
    
    return true;
  });
}

function isValidBusId(busId: string | null): busId is string {
  return !!busId && /^[AB]\d+$/i.test(busId);
}

function isValidMessageRole(role: string): role is Message["role"] {
  return ["user", "system", "assistant"].includes(role);
}

function sanitizeMessage(m: Partial<Message> & Record<string, unknown>): Message | null {
  const role = String(m.role || "user");
  const content = String(m.content || "").trim();
  
  if (!content || !isValidMessageRole(role)) {
    return null;
  }
  
  return { role, content };
}

function parseToolArguments(argsString: string): ToolCallArguments {
  try {
    const args = JSON.parse(argsString) as unknown;
    
    if (args && typeof args === 'object' && 'busId' in args) {
      const busId = (args as { busId?: unknown }).busId;
      return {
        busId: typeof busId === 'string' ? busId : undefined
      };
    }
    
    return {};
  } catch {
    return {};
  }
}

// API functions
async function callOpenRouter(
  messages: Message[], 
  tools?: Tool[], 
  tool_choice?: "auto"
): Promise<OpenRouterResponse> {
  const payload: OpenRouterPayload = {
    model: "meta-llama/llama-3.3-8b-instruct:free",
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  };

  if (tools && tool_choice) {
    payload.tools = tools;
    payload.tool_choice = tool_choice;
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Bus Assistant",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  return await response.json() as OpenRouterResponse;
}

async function fetchBusData(busId: string, origin: string): Promise<BusData> {
  const busRes = await fetch(`${origin}/api/bus/${busId}`);
  
  if (!busRes.ok) {
    throw new Error(`Bus API returned ${busRes.status}`);
  }
  
  return await busRes.json() as BusData;
}

function detectBusRequest(messageContent: string): { busId: string | null } {
  const content = messageContent.toLowerCase();
  const busMention = content.match(/\b([AB]\d+)\b/i);
  const busId = busMention ? busMention[1].toUpperCase() : null;

  return { busId };
}

const tools: Tool[] = [
  {
    type: "function",
    function: {
      name: "getBusData",
      description: "Get bus route information including stops, schedule, and route details. Use this when users ask about specific bus routes.",
      parameters: {
        type: "object",
        properties: {
          busId: {
            type: "string",
            description: "The bus route ID like A15 or B22",
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
  content: `You are Geox, a bus transportation assistant.

IMPORTANT INSTRUCTIONS:
1. When users ask about specific bus routes (A15, B22, etc.), use the getBusData tool
2. After the tool returns data, provide a helpful summary of the route
3. NEVER list individual bus stops - they are displayed separately in the UI
4. Focus on overall route information, frequency, travel time, and key areas served
5. Be friendly and helpful

Example good response: "The A15 route runs from Downtown to the University campus, taking approximately 30-40 minutes. It operates every 15 minutes during peak hours and serves major areas like the City Center and Medical District."`
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIResponse | { error: string; detail?: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
  }

  try {
    if (!isValidBusRequest(req.body)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const sanitizedMessages = req.body.messages
      .map(sanitizeMessage)
      .filter((m): m is Message => m !== null)
      .slice(-20);

    if (sanitizedMessages.length === 0) {
      return res.status(400).json({ error: "No valid messages provided" });
    }

    const lastMessage = sanitizedMessages.at(-1);
    if (!lastMessage) {
      return res.status(400).json({ error: "No valid messages provided" });
    }

    const { busId: detectedBusId } = detectBusRequest(lastMessage.content);
    const hasBusMention = !!detectedBusId;

    // First API call - let AI decide if it wants to use tools
    const openRouterData = await callOpenRouter(
      [systemPrompt, ...sanitizedMessages],
      hasBusMention ? tools : undefined,
      hasBusMention ? "auto" : undefined
    );

    const assistantMessage = openRouterData.choices?.[0]?.message;
    
    if (!assistantMessage) {
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    // Check if AI wants to call a tool
    if (assistantMessage.tool_calls?.length) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.function.name !== "getBusData") {
        return res.status(400).json({ error: "Unknown tool call requested" });
      }

      // Parse the tool arguments
      const parsedArgs = parseToolArguments(toolCall.function.arguments);
      const parsedBusId = parsedArgs.busId?.toUpperCase() || null;
      const finalBusId = parsedBusId || detectedBusId;
      
      if (!isValidBusId(finalBusId)) {
        return res.status(400).json({
          error: "Invalid or missing bus route ID",
        });
      }

      try {
        // Execute the tool call - fetch actual bus data
        const origin = req.headers.origin || "http://localhost:3000";
        const busData = await fetchBusData(finalBusId, origin);

        // Create tool message with the actual bus data
        const toolMessage: ToolMessage = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(busData),
        };

        // Second API call - send the tool result back to AI for final response
        const followUpData = await callOpenRouter([
          systemPrompt,
          ...sanitizedMessages,
          assistantMessage, // This contains the tool call
          toolMessage,      // This contains the tool result
        ]);

        const finalReply = followUpData.choices?.[0]?.message?.content || 
          `I've retrieved the route information for ${finalBusId}.`;

        return res.status(200).json({
          reply: finalReply,
          busData,
        });

      } catch (error) {
        console.error("Error processing bus request:", error);
        return res.status(200).json({
          reply: `Sorry, I couldn't fetch data for route ${finalBusId}.`,
          busData: null,
        });
      }
    }

    // No tool call was made - check if we should still fetch bus data
    let busData: BusData | null = null;
    if (detectedBusId && isValidBusId(detectedBusId)) {
      try {
        const origin = req.headers.origin || "http://localhost:3000";
        busData = await fetchBusData(detectedBusId, origin);
      } catch (error) {
        console.error("Error fetching bus data:", error);
      }
    }

    const reply = assistantMessage.content || "Sorry, I couldn't generate a response.";

    return res.status(200).json({ 
      reply, 
      busData 
    });

  } catch (error) {
    console.error("API handler error:", error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: "Internal server error",
        detail: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
    
    return res.status(500).json({ error: "Internal server error" });
  }
}