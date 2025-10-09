import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/utils/mongodb";
import BusStopInfo from "@/models/busStopInfo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { id } = req.query;
  const stopId = Array.isArray(id) ? id[0] : id;

  if (!stopId || typeof stopId !== "string") {
    return res.status(400).json({ error: "Invalid or missing stop id" });
  }

  try {
    await connectToDatabase();

    const results = await BusStopInfo.find(
      { "stops.stopId": stopId },
      { routeId: 1, busId: 1, "stops.$": 1 }
    ).lean();

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "No routes found for this stop" });
    }

    const formattedData = results.map((doc) => ({
      routeId: doc.routeId,
      busId: doc.busId,
      stop: doc.stops?.[0],
    }));

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching stop data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
