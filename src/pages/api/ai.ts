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

export default async function handler(req: NextApiRequest, res: NextApiResponse<AIResponse | { error: string; detail?: string }>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages } = req.body as { messages: Array<Partial<Message> & Record<string, unknown>> };

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const sanitizedMessages: Message[] = messages
      .map((m) => ({ 
        role: String(m.role || "user") as Message["role"], 
        content: String(m.content || "") 
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
          description: "Get detailed bus stop information for a specific route. ONLY use this when users explicitly ask for bus stops, route details, or stop information for a particular bus route (like 'A15 stops', 'B22 route details', 'show me A15 bus stops'). Do NOT use for general bus questions.",
          parameters: {
            type: "object",
            properties: {
              busId: { 
                type: "string", 
                description: "The bus route ID (e.g., 'A15', 'B22', 'A1', 'B5'). Extract this from user queries specifically asking for bus stops or route details.",
                pattern: "^[AB]\\d+$"
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
        "You are Geox, a helpful AI assistant for bus transportation. Your role is to:\n\n1. Help users with general bus information, routes, and travel guidance\n2. Provide clear, concise responses in bullet points\n3. ONLY use the getBusData tool when users specifically ask for bus stops, route details, or stop information for a particular route (like 'A15 stops', 'B22 route details', 'show me A15 bus stops')\n4. For general questions about bus routes, schedules, or transportation, respond directly without using tools\n5. Be friendly, helpful, and keep responses brief\n\nIMPORTANT: Only use the getBusData tool when users explicitly ask for stop information or route details for a specific bus route.",
    };

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
    }

    // Enhanced tool calling detection - only for specific bus stop/route detail requests
    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    const messageContent = lastMessage?.content?.toLowerCase() || "";
    
    // Patterns that specifically indicate user wants bus stops or route details
    const busStopRequestPatterns = [
      // Direct route + stops patterns
      /\b(A|B)\d+\s+(stops|stop)\b/,  // "A15 stops", "B22 stop"
      /\b(stops|stop)\s+(for|of|on)\s+(A|B)\d+\b/,  // "stops for A15", "stop of B22"
      /\bshow\s+(me\s+)?(A|B)\d+\s+(stops|stop)\b/,  // "show A15 stops", "show me B22 stops"
      /\b(A|B)\d+\s+(route\s+)?(details|information|info)\b/,  // "A15 details", "B22 route info"
      /\bget\s+(A|B)\d+\s+(stops|stop|details)\b/,  // "get A15 stops"
      /\b(A|B)\d+\s+(bus\s+)?(stops|stop|route)\b/,  // "A15 bus stops", "B22 route"
      /\bwhere\s+(are\s+)?(the\s+)?(stops|stop)\s+(for|of)\s+(A|B)\d+\b/,  // "where are the stops for A15"
      /\b(A|B)\d+\s+(schedule|times|timings)\b/,  // "A15 schedule", "B22 times"
      
      // More flexible patterns
      /\b(A|B)\d+\b.*\b(stops|stop|route|details|info|information)\b/,  // "A15" + any of these words
      /\b(stops|stop|route|details|info|information)\b.*\b(A|B)\d+\b/,  // any of these words + "A15"
      /\b(A|B)\d+\b.*\b(show|get|find|tell)\b/,  // "A15" + action words
      /\b(show|get|find|tell)\b.*\b(A|B)\d+\b/,  // action words + "A15"
      
      // Simple route mentions that might need data
      /\b(A|B)\d+\b/,  // Just "A15" or "B22" - fallback for specific requests
    ];
    
    // Check for specific patterns first
    const specificPatterns = busStopRequestPatterns.slice(0, -1); // All except the last broad pattern
    const hasSpecificPattern = specificPatterns.some(pattern => pattern.test(messageContent));
    
    // Check for general route mention with question words
    const hasRouteMention = /\b(A|B)\d+\b/.test(messageContent);
    const hasQuestionWords = /\b(what|where|how|when|which|tell|show|get|find|give)\b/.test(messageContent);
    const hasDataWords = /\b(stops|stop|route|details|info|information|schedule|times|timings|bus)\b/.test(messageContent);
    
    const needsToolCall = hasSpecificPattern || (hasRouteMention && (hasQuestionWords || hasDataWords));
    
    console.log("Last message:", lastMessage?.content);
    console.log("Has specific pattern:", hasSpecificPattern);
    console.log("Has route mention:", hasRouteMention);
    console.log("Has question words:", hasQuestionWords);
    console.log("Has data words:", hasDataWords);
    console.log("Needs tool call:", needsToolCall);
    console.log("Matched specific patterns:", specificPatterns.filter(pattern => pattern.test(messageContent)));

    // First API call to get initial response
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [systemPrompt, ...sanitizedMessages],
        ...(needsToolCall ? { 
          tools, 
          tool_choice: hasRouteMention && hasDataWords ? "required" : "auto"
        } : {}),
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);
      return res.status(response.status).json({ 
        error: "Failed to get AI response", 
        detail: errorText 
      });
    }

    const data = await response.json();
    console.log("AI Response data:", JSON.stringify(data, null, 2));
    
    const choice = data?.choices?.[0];

    if (!choice?.message) {
      console.error("No message in AI response:", data);
      return res.status(500).json({ error: "Invalid response from AI service" });
    }

    const assistantMessage = choice.message as AssistantMessage;
    console.log("Assistant message:", JSON.stringify(assistantMessage, null, 2));

    // Handle tool calls
    if (assistantMessage.tool_calls?.length) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.function.name === "getBusData") {
        let busId: string | undefined;
        try {
          const args = JSON.parse(toolCall.function.arguments);
          busId = args?.busId;
          console.log("Tool call arguments:", args);
          console.log("Extracted busId:", busId);
        } catch (error) {
          console.error("Failed to parse tool call arguments:", error);
          return res.status(400).json({ error: "Invalid tool call arguments" });
        }

        // Validate busId format
        if (!busId || !/^[AB]\d+$/i.test(busId)) {
          console.error("Invalid busId format:", busId);
          return res.status(400).json({ 
            error: "Invalid bus route format. Please provide a valid route like A15 or B22." 
          });
        }

        // Normalize busId (ensure uppercase)
        busId = busId.toUpperCase();
        console.log("Normalized busId:", busId);

        try {
          // Fetch bus data with timeout
          const origin = req.headers.origin || "http://localhost:3000";
          console.log("Fetching bus data for:", busId, "from:", `${origin}/api/bus/${busId}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const busRes = await fetch(`${origin}/api/bus/${busId}`, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            }
          });
          
          clearTimeout(timeoutId);

          if (!busRes.ok) {
            const errorText = await busRes.text();
            console.error("Bus API error:", busRes.status, errorText);
            
            if (busRes.status === 404) {
              return res.status(200).json({ 
                reply: `Sorry, I couldn't find bus route ${busId}. This route might not exist in our database.`,
                busData: null 
              });
            } else {
              return res.status(200).json({ 
                reply: `Sorry, I encountered an error while fetching information for bus route ${busId}. Please try again later.`,
                busData: null 
              });
            }
          }

          const busData = await busRes.json();
          console.log("Bus data received:", busData);

          // Create tool message
          const toolMessage: ToolMessage = {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(busData),
          };

          // Follow-up API call with tool result
          const followUpResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          });

          if (!followUpResponse.ok) {
            const errorText = await followUpResponse.text();
            console.error("Follow-up API error:", followUpResponse.status, errorText);
            return res.status(200).json({ 
              reply: `I found information for bus route ${busId}, but couldn't generate a detailed response. The route data is available below.`,
              busData 
            });
          }

          const followUpData = await followUpResponse.json();
          console.log("Follow-up response:", followUpData);
          
          const finalReply = followUpData?.choices?.[0]?.message?.content;
          
          if (!finalReply) {
            console.error("No content in follow-up response:", followUpData);
            return res.status(200).json({ 
              reply: `I found information for bus route ${busId}, but couldn't generate a detailed response. The route data is available below.`,
              busData 
            });
          }

          console.log("Final reply generated:", finalReply);
          return res.status(200).json({ 
            reply: finalReply, 
            busData 
          });

        } catch (error) {
          console.error("Error fetching bus data:", error);
          
          if (error instanceof Error && error.name === 'AbortError') {
            return res.status(200).json({ 
              reply: `Sorry, the request for bus route ${busId} timed out. Please try again.`,
              busData: null 
            });
          }
          
          return res.status(200).json({ 
            reply: `Sorry, I encountered an error while fetching information for bus route ${busId}. Please try again later.`,
            busData: null 
          });
        }
      } else {
        return res.status(400).json({ error: "Unknown tool call" });
      }
    } else {
      // Check if we should have used a tool but didn't (fallback mechanism)
      if (needsToolCall && hasRouteMention) {
        console.log("Fallback: Should have used tool but didn't, attempting manual extraction");
        
        // Try to extract busId from the message
        const busIdMatch = messageContent.match(/\b([AB]\d+)\b/i);
        if (busIdMatch) {
          const busId = busIdMatch[1].toUpperCase();
          console.log("Fallback: Extracted busId:", busId);
          
          try {
            // Manually fetch bus data
            const origin = req.headers.origin || "http://localhost:3000";
            const busRes = await fetch(`${origin}/api/bus/${busId}`);
            
            if (busRes.ok) {
              const busData = await busRes.json();
              console.log("Fallback: Successfully fetched bus data");
              
              return res.status(200).json({ 
                reply: `Here's the information for bus route ${busId}:`,
                busData 
              });
            }
          } catch (error) {
            console.error("Fallback: Error fetching bus data:", error);
          }
        }
      }
      
      // Handle normal response (no tool calls)
      console.log("Handling normal response, content:", assistantMessage.content);
      console.log("Full assistant message:", assistantMessage);
      
      // Try different possible content fields
      let reply = assistantMessage.content;
      if (!reply && assistantMessage.text) {
        reply = assistantMessage.text;
      }
      if (!reply && assistantMessage.message) {
        reply = assistantMessage.message;
      }
      if (!reply && assistantMessage.response) {
        reply = assistantMessage.response;
      }
      
      // If still no content, try to extract from the raw response
      if (!reply) {
        console.log("No content found, checking raw data:", data);
        reply = data?.choices?.[0]?.text || data?.choices?.[0]?.message?.text || "Sorry, I couldn't generate a response.";
      }
      
      console.log("Final reply:", reply);
      console.log("Returning normal response with busData: null");
      return res.status(200).json({ reply, busData: null });
    }

  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
