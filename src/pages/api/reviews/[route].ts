import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/utils/mongodb";
import ReviewRoute from "@/models/reviewRoute";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  const { route } = req.query;

  if (!route || typeof route !== "string") {
    return res.status(400).json({ error: "Missing route parameter" });
  }

  if (req.method === "GET") {
    try {
      const routeData = await ReviewRoute.findOne({ routeName: route });
      return res.status(200).json(routeData?.reviews || []);
    } catch (err) {
      return res.status(500).json({ error: "Error fetching reviews",err });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
