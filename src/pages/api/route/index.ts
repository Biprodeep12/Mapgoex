import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { client } from '@/utils/db';

const CACHE_TTL = 3600;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    const [start, end] = coordinates;
    const cacheKey = `route:${start[0]},${start[1]}:${end[0]},${end[1]}`;

    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const response = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      { coordinates },
      {
        headers: {
          Authorization: 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjczZGM4NTFmMDVkOTRiOTRhNzFmNTBlMmRhODI0OThhIiwiaCI6Im11cm11cjY0In0=',
          'Content-Type': 'application/json',
        },
      }
    );

    await client.setEx(cacheKey, CACHE_TTL, JSON.stringify(response.data));

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching route:', error);
    return res.status(500).json({ error: `Internal server error: ${error}` });
  }
}
