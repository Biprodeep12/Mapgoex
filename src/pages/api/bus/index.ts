import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/utils/mongodb'; 
import BusRouteInfoModel from '@/models/busRouteInfo';
import { BusData } from '@/types/bus';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BusData[] | { error: string }>
) {
  await connectToDatabase();

  try {
    const routes = await BusRouteInfoModel.find().lean();
    return res.status(200).json(routes);
  } catch (error) {
    return res.status(500).json({ error: `Internal server error: ${error}` });
  }
}
