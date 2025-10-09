import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/utils/mongodb';
import BusRouteInfoModel from '@/models/busRouteInfo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectToDatabase();

  const { route } = req.query;

  try {
    if (typeof route === 'string') {
      const busInfo = await BusRouteInfoModel.findOne({ Route: route }).lean();
      if (busInfo) {
        return res.status(200).json(busInfo);
      } else {
        return res.status(404).json({ error: 'Route not found' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid route parameter' });
    }
  } catch (error) {
    return res.status(500).json({ error: `Internal server error: ${error}` });
  }
}
