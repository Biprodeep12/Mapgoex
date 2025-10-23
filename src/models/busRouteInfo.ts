import { BusData } from '@/types/bus';
import mongoose, { Schema, Document, Model } from 'mongoose';

interface BusRouteInfoDocument extends BusData, Document {}

const BusStopSchema = new Schema({
  name: { type: String, required: true },
  coords: { type: [Number], required: true },
});

const BusRouteInfoSchema = new Schema<BusRouteInfoDocument>({
  Route: { type: String, required: true },
  rating: { type: Number, required: true, default: 0 },
  startPoint: {
    name: { type: String, required: true },
    coords: { type: [Number], required: true },
  },
  endPoint: {
    name: { type: String, required: true },
    coords: { type: [Number], required: true },
  },
  busStops: { type: [BusStopSchema], required: true },
});

const BusRouteInfoModel: Model<BusRouteInfoDocument> =
  mongoose.models.BusRouteInfo ||
  mongoose.model<BusRouteInfoDocument>('BusRouteInfo', BusRouteInfoSchema);

export default BusRouteInfoModel;
