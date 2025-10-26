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
  max_tokens: number;
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

function detectBusRequest(messageContent: string): { needsToolCall: boolean; busId: string | null } {
  const content = messageContent.toLowerCase();
  
  // More flexible patterns to catch various ways users might ask for bus information
  const busRequestPatterns = [
    // Pattern 1: Direct requests for stops/info
    /\b(A|B)\d+\s+(stops?|route|details?|info|information|schedule|times?|timings?)\b/,
    /\b(stops?|stop|route|details?|info|information)\s+(for|of|on|about)\s+(the\s+)?(A|B)\d+\b/,
    /\bshow\s+(me\s+)?(the\s+)?(A|B)\d+\s+(stops?|route|details?|info)\b/,
    
    // Pattern 2: "Tell me about bus A15" type queries
    /\b(tell me about|information about|details about|what about|how about)\s+(the\s+)?(bus\s+)?(A|B)\d+\b/,
    /\b(bus\s+)?(A|B)\d+\s+(information|details|stops|route|schedule)\b/,
    
    // Pattern 3: General queries mentioning specific bus routes
    /\b(A|B)\d+\b.*\b(stops?|route|details?|info|information|schedule|where|when|how)\b/,
    /\b(stops?|route|details?|info).*\b(A|B)\d+\b/,
  ];

  const hasBusRequest = busRequestPatterns.some(p => p.test(content));
  const busMention = content.match(/\b([AB]\d+)\b/i);
  const busId = busMention ? busMention[1].toUpperCase() : null;

  return {
    needsToolCall: hasBusRequest && !!busId,
    busId
  };
}

const tools: Tool[] = [
  {
    type: "function",
    function: {
      name: "getBusData",
      description: "Get detailed bus stop information for a specific route. Use this when users ask about bus stops, route details, schedule, or information for a particular bus route (like 'A15 stops', 'B22 route details', 'show me A15 bus stops', 'tell me about bus A15', 'information about B22'). IMPORTANT: The bus stops data will be displayed separately in the UI - do not list individual stops in your response.",
      parameters: {
        type: "object",
        properties: {
          busId: {
            type: "string",
            description: "The bus route ID (e.g., 'A15', 'B22', 'A1', 'B5'). Extract this from user queries asking for bus information.",
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
  content: `You are Geox, a bus transportation assistant. CRITICAL RULES:

1. When users ask about specific bus routes (A15, B22, etc.), use getBusData tool
2. AFTER receiving bus data, provide route overview but NEVER list bus stops
3. Bus stops are displayed separately in UI - your response should complement this
4. Focus on:
   - Route duration and frequency
   - Main areas served
   - Travel tips
   - Service hours
   - General route characteristics
5. Example responses:
   ✅ "Route A15 takes about 45 minutes end-to-end, running every 15 minutes during peak hours..."
   ✅ "The B22 serves the downtown area connecting the university to the business district..."
   ❌ "Stops: Main St, Oak Ave, Park Rd, University Campus..." (NEVER DO THIS)

Remember: Bus stops display is handled by UI. Provide insights, not lists.`
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

    // Always try to detect bus requests, but let the AI decide when to use the tool
    const { busId: detectedBusId } = detectBusRequest(lastMessage.content);
    const hasBusMention = !!detectedBusId;

    // For bus-related queries, include tools and let AI decide
    const shouldIncludeTools = hasBusMention;

    const openRouterData = await callOpenRouter(
      [systemPrompt, ...sanitizedMessages],
      shouldIncludeTools ? tools : undefined,
      shouldIncludeTools ? "auto" : undefined
    );

    const assistantMessage = openRouterData.choices?.[0]?.message;
    
    if (!assistantMessage) {
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    // Handle tool calls if the AI decided to use them
    if (assistantMessage.tool_calls?.length) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.function.name !== "getBusData") {
        return res.status(400).json({ error: "Unknown tool call requested" });
      }

      const parsedArgs = parseToolArguments(toolCall.function.arguments);
      const parsedBusId = parsedArgs.busId?.toUpperCase() || null;
      const finalBusId = parsedBusId || detectedBusId;
      
      if (!isValidBusId(finalBusId)) {
        return res.status(400).json({
          error: "Invalid or missing bus route ID. Please specify like A15 or B22.",
        });
      }

      try {
        const origin = req.headers.origin || "http://localhost:3000";
        const busData = await fetchBusData(finalBusId, origin);

        const toolMessage: ToolMessage = {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(busData),
        };

        const followUpData = await callOpenRouter([
          systemPrompt,
          ...sanitizedMessages,
          assistantMessage,
          toolMessage,
        ]);

        const finalReply = followUpData.choices?.[0]?.message?.content || 
          `Here are the route details for ${finalBusId}.`;

        return res.status(200).json({
          reply: finalReply,
          busData,
        });

      } catch (error) {
        console.error("Error processing bus request:", error);
        return res.status(200).json({
          reply: `Sorry, I couldn't fetch data for route ${finalBusId}. Please check if the route exists.`,
          busData: null,
        });
      }
    }

    // No tool call was made - return regular response
    const reply = assistantMessage.content || "Sorry, I couldn't generate a response.";

    // Even if no tool was called, check if we detected a bus ID and try to fetch data
    if (detectedBusId && isValidBusId(detectedBusId)) {
      try {
        const origin = req.headers.origin || "http://localhost:3000";
        const busData = await fetchBusData(detectedBusId, origin);
        return res.status(200).json({ 
          reply, 
          busData 
        });
      } catch (error) {
        console.error("Error fetching bus data:", error);
        // Still return the AI response even if bus data fetch fails
      }
    }

    return res.status(200).json({ 
      reply, 
      busData: null 
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