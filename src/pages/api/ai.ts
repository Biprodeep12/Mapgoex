import type { NextApiRequest, NextApiResponse } from "next";
import { BusData } from "@/types/bus";

// ============================================================================
// Types
// ============================================================================

type UserMessage = {
  role: "user";
  content: string;
};

type SystemMessage = {
  role: "system";
  content: string;
};

type AssistantTextMessage = {
  role: "assistant";
  content: string;
};

type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type AssistantToolMessage = {
  role: "assistant";
  content: string | null;
  tool_calls: ToolCall[];
};

type ToolResultMessage = {
  role: "tool";
  tool_call_id: string;
  content: string;
};

type ConversationMessage = UserMessage | SystemMessage | AssistantTextMessage;
type OpenRouterMessage = ConversationMessage | AssistantToolMessage | ToolResultMessage;

type AIResponse = {
  reply: string;
  busData?: BusData | null;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: AssistantTextMessage | AssistantToolMessage;
  }>;
};

type Tool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: {
        [key: string]: {
          type: string;
          description: string;
          pattern?: string;
        };
      };
      required: string[];
    };
  };
};

// ============================================================================
// Configuration
// ============================================================================

const SYSTEM_PROMPT: SystemMessage = {
  role: "system",
  content: `You are Geox, a friendly bus transportation assistant.

IMPORTANT INSTRUCTIONS:
1. When users ask about specific bus routes (e.g., A15, B22), use the getBusData tool to fetch real-time information
2. After receiving the data, provide a helpful summary focusing on:
   - Route overview and key areas served
   - Frequency and travel time
   - Operating hours
3. NEVER list individual bus stops - the UI displays these separately
4. Be concise, friendly, and helpful

Example: "The A15 route connects Downtown to the University campus in about 30-40 minutes. It runs every 15 minutes during peak hours and serves the City Center and Medical District."`
};

const TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "getBusData",
      description: "Retrieves comprehensive bus route information including stops, schedule, and route details for a specific bus route ID.",
      parameters: {
        type: "object",
        properties: {
          busId: {
            type: "string",
            description: "Bus route identifier in format A## or B## (e.g., A15, B22)",
            pattern: "^[AB]\\d+$",
          },
        },
        required: ["busId"],
      },
    },
  },
];

const BUS_ID_REGEX = /^[AB]\d+$/i;
const MAX_MESSAGES = 20;
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";

// ============================================================================
// Validation Functions
// ============================================================================

function isValidBusId(busId: string | null | undefined): busId is string {
  return !!busId && BUS_ID_REGEX.test(busId);
}

function validateRequestBody(body: unknown): body is { messages: unknown[] } {
  if (!body || typeof body !== "object") return false;
  const request = body as Record<string, unknown>;
  return Array.isArray(request.messages);
}

function sanitizeMessage(msg: Record<string, unknown>): ConversationMessage | null {
  const role = String(msg.role || "user");
  const content = String(msg.content || "").trim();
  
  if (!content) return null;
  
  if (role === "user") {
    return { role: "user", content };
  }
  
  if (role === "assistant") {
    return { role: "assistant", content };
  }
  
  return null;
}

// ============================================================================
// API Communication
// ============================================================================

async function callOpenRouter(
  messages: OpenRouterMessage[],
  includeTools: boolean = false
): Promise<OpenRouterResponse> {
  const payload: Record<string, unknown> = {
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: false, // Disable streaming (required for tool use)
  };

  if (includeTools) {
    payload.tools = TOOLS;
    payload.tool_choice = "auto";
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Bus Assistant",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", response.status);
    console.error("Error response:", errorText);
    
    // Parse error for better user messages
    try {
      const errorData = JSON.parse(errorText);
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    } catch (e) {
      if (e instanceof Error && e.message === "Rate limit exceeded. Please try again later.") {
        throw e;
      }
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
  }

  return (await response.json()) as OpenRouterResponse;
}

async function fetchBusData(busId: string, origin: string): Promise<BusData> {
  const response = await fetch(`${origin}/api/bus/${busId}`);
  
  if (!response.ok) {
    throw new Error(`Bus API returned status ${response.status}`);
  }
  
  return (await response.json()) as BusData;
}

// ============================================================================
// Business Logic
// ============================================================================

function extractBusIdFromToolCall(toolCall: ToolCall): string | null {
  try {
    const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
    const busId = args.busId;
    return typeof busId === "string" ? busId.toUpperCase() : null;
  } catch {
    return null;
  }
}

async function handleToolCall(
  toolCall: ToolCall,
  messages: ConversationMessage[],
  origin: string
): Promise<{ reply: string; busData: BusData | null }> {
  if (toolCall.function.name !== "getBusData") {
    throw new Error(`Unknown tool: ${toolCall.function.name}`);
  }

  const busId = extractBusIdFromToolCall(toolCall);
  
  if (!isValidBusId(busId)) {
    return {
      reply: "Sorry, I need a valid bus route ID (e.g., A15 or B22) to help you.",
      busData: null,
    };
  }

  try {
    const busData = await fetchBusData(busId, origin);

    const toolMessage: ToolResultMessage = {
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(busData),
    };

    const assistantToolMsg: AssistantToolMessage = {
      role: "assistant",
      content: null,
      tool_calls: [toolCall],
    };

    // Get AI's response after receiving tool data
    const followUpResponse = await callOpenRouter([
      SYSTEM_PROMPT,
      ...messages,
      assistantToolMsg,
      toolMessage,
    ]);

    const finalMessage = followUpResponse.choices?.[0]?.message;
    const finalReply = finalMessage?.content || `I've retrieved information for route ${busId}.`;

    return { reply: finalReply, busData };

  } catch (error) {
    console.error(`Error fetching bus data for ${busId}:`, error);
    return {
      reply: `Sorry, I couldn't retrieve information for route ${busId}. Please try again later.`,
      busData: null,
    };
  }
}

// ============================================================================
// Main Handler
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIResponse | { error: string; detail?: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Missing OPENROUTER_API_KEY environment variable");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    if (!validateRequestBody(req.body)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const messages = req.body.messages
      .map((msg) => sanitizeMessage(msg as Record<string, unknown>))
      .filter((msg): msg is ConversationMessage => msg !== null)
      .slice(-MAX_MESSAGES);

    if (messages.length === 0) {
      return res.status(400).json({ error: "No valid messages provided" });
    }

    const initialResponse = await callOpenRouter(
      [SYSTEM_PROMPT, ...messages],
      true
    );

    const assistantMessage = initialResponse.choices?.[0]?.message;
    
    if (!assistantMessage) {
      console.error("No assistant message in response");
      return res.status(500).json({ error: "Invalid response from AI service" });
    }

    // Check if it's a tool call message
    if ("tool_calls" in assistantMessage && assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const origin = req.headers.origin || `http://localhost:3000`;
      const result = await handleToolCall(
        assistantMessage.tool_calls[0],
        messages,
        origin
      );
      
      return res.status(200).json(result);
    }

    // Regular text response
    const reply = assistantMessage.content?.trim() || "I'm here to help! What would you like to know about bus routes?";
    
    return res.status(200).json({ reply, busData: null });

  } catch (error) {
    console.error("API handler error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return res.status(500).json({
      error: errorMessage === "Rate limit exceeded. Please try again later." 
        ? errorMessage 
        : "Internal server error",
      detail: process.env.NODE_ENV === "development" ? errorMessage : undefined,
    });
  }
}