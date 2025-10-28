import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/utils/mongodb";
import ticketInfo from "@/models/ticketInfo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { uuid, ticket } = req.body;

    if (!uuid || !ticket) {
      return res.status(400).json({ error: "Missing uuid or ticket" });
    }

    const existinguuid = await ticketInfo.findOne({ uuid });

    if (existinguuid) {
      existinguuid.tickets.push(ticket);
      await existinguuid.save();
    } else {
      await ticketInfo.create({ uuid, tickets: [ticket] });
    }

    return res.status(201).json({ message: "ticket added successfully" });
  } catch (err) {
    console.error("Error adding ticket:", err);
    return res.status(500).json({ error: "Error adding ticket" });
  }
}
