import type { NextApiRequest, NextApiResponse } from "next";

interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages } = req.body as {
      messages: Array<Partial<Message> & Record<string, unknown>>;
    };

    const sanitizedMessages: Message[] = (messages || [])
      .map((m) => ({
        role: String(m.role || "user") as Message["role"],
        content: String(m.content || ""),
      }))
      .filter((m) => m.content.trim().length > 0)
      .slice(-20);

    const systemPrompt: Message = {
      role: "system",
      content: `
You are Geox, an AI assistant that helps users with bus locations, nearby stops, and estimated arrival times.
Always respond briefly, clearly, and in points.

When the user asks for general bus information:
- Focus on explaining the route purpose, area coverage, and travel hints.
- Do NOT list individual bus stop names — those will be displayed separately in the UI.

When you call the "getBusData" tool:
- Respond ONLY with route start point, end point,
  number of major stops (not listing them),
  and frequency (like every 10 mins, hourly, etc.).
      `.trim(),
    };

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "getBusData",
          description: "Get bus route, stops and related data for a busId",
          parameters: {
            type: "object",
            properties: {
              busId: { type: "string", description: "Bus ID like A15, B22" },
            },
            required: ["busId"],
          },
        },
      },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [systemPrompt, ...sanitizedMessages],
        tools,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: "Upstream error", detail: err });
    }

    const data = await response.json();
    
    let reply = "Sorry, I couldn’t generate a response.";
    let busData = null;
    const choice = data?.choices?.[0];

    const toolCall = choice?.message?.tool_calls?.[0];
    if (toolCall?.function?.name === "getBusData") {
      let busId: string | undefined;
      try {
        const args =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
        busId = args?.busId;
      } catch (error) {
        console.warn('Something went wrong',error);
      }

      if (busId) {
        const origin = req.headers.origin || "http://localhost:3000";
        const busRes = await fetch(`${origin}/api/bus/${busId}`);

        if (busRes.ok) {
          busData = await busRes.json();

          const followUp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
                  role: "assistant",
                  content: choice.message?.content || "",
                  tool_calls: choice.message?.tool_calls || [],
                },
                {
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify(busData),
                },
              ],
            }),
          });

          if (followUp.ok) {
            const followUpData = await followUp.json();
            reply =
              followUpData?.choices?.[0]?.message?.content ||
              "I fetched the bus data but couldn’t generate a final answer.";
          } else {
            reply = "Fetched bus data but failed to generate final answer.";
          }
        } else {
          reply = `Couldn't fetch data for bus ${busId}.`;
        }
      } else {
        reply = "I couldn't read the bus ID.";
      }
    } else {
      reply = choice?.message?.content || reply;
    }

    return res.status(200).json({ reply, busData });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
