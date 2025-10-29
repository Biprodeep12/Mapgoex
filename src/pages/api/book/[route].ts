import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/utils/mongodb";
import ticketInfo from "@/models/ticketInfo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  const { route } = req.query;

  if (!route || typeof route !== "string") {
    return res.status(400).json({ error: "Missing uuid parameter" });
  }

  if (req.method === "GET") {
    try {
      const ticketBook = await ticketInfo.findOne({ uuid: route });
      return res.status(200).json(ticketBook?.tickets || []);
    } catch (err) {
      return res.status(500).json({ error: "Error fetching tickets", err });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
