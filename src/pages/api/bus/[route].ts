import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/utils/mongodb';
import BusRouteInfoModel from '@/models/busRouteInfo';
import { client } from '@/utils/db';

const CACHE_TTL = 3600;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectToDatabase();

  const { route } = req.query;

  try {
    if (typeof route === 'string') {
      const cacheKey = `bus:${route}`;

      const cachedData = await client.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      const busInfo = await BusRouteInfoModel.findOne({ Route: route }).lean();
      if (busInfo) {
        await client.setEx(cacheKey, CACHE_TTL, JSON.stringify(busInfo));
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
