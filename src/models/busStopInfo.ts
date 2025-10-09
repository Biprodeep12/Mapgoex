import mongoose, { Schema, Document, models } from "mongoose";

export interface IStop {
  stopId: string;
  eta: string;
  reached: boolean;
  reachedAt: string | null;
}

export interface IBusStopInfo extends Document {
  routeId: string;
  busId: string;
  stops: IStop[];
}

const StopSchema = new Schema<IStop>(
  {
    stopId: { type: String, required: true },
    eta: { type: String, required: true },
    reached: { type: Boolean, default: false },
    reachedAt: { type: String, default: null },
  },
);

const BusStopInfoSchema = new Schema<IBusStopInfo>(
  {
    routeId: { type: String, required: true },
    busId: { type: String, required: true },
    stops: { type: [StopSchema], required: true },
  },
);

const BusStopInfo =
  models.BusStopInfo || mongoose.model<IBusStopInfo>("BusStopInfo", BusStopInfoSchema);

export default BusStopInfo;
