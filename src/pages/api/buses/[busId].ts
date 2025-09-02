import { NextApiRequest, NextApiResponse } from "next";
import data from "@/data/pod.json";
import { BusRoutes, BusData } from "@/types/bus";

const busData: BusRoutes = data as unknown as BusRoutes;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<BusData | { error: string }>
) {
  const { busId } = req.query;

  if (typeof busId !== "string") {
    return res.status(400).json({ error: "Invalid bus ID" });
  }

  const bus = busData[busId];

  if (!bus) {
    return res.status(404).json({ error: "Bus not found" });
  }

  res.status(200).json(bus);
}
