import { NextApiRequest, NextApiResponse } from "next";
import data from "@/data/pod.json";
import { BusData } from "@/types/bus";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { busId } = req.query;
  const bus = (data as unknown as Record<string,BusData>)[busId as string];

  if (!bus) {
    return res.status(404).json({ error: "Bus not found" });
  }

  res.status(200).json(bus);
}
