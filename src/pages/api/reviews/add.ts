import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/utils/mongodb";
import ReviewRoute from "@/models/reviewRoute";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { routeName, review } = req.body;

    if (!routeName || !review) {
      return res.status(400).json({ error: "Missing routeName or review" });
    }

    const existingRoute = await ReviewRoute.findOne({ routeName });

    if (existingRoute) {
      existingRoute.reviews.push(review);
      await existingRoute.save();
    } else {
      await ReviewRoute.create({ routeName, reviews: [review] });
    }

    return res.status(201).json({ message: "Review added successfully" });
  } catch (err) {
    console.error("Error adding review:", err);
    return res.status(500).json({ error: "Error adding review" });
  }
}
