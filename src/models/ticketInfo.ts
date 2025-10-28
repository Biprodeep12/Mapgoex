import mongoose, { Schema, Document } from "mongoose";

export interface ITicketItem {
  count: number;
  source: string;
  destination: string;
  payment: number;
}

export interface ITicket extends Document {
  uuid: string;
  tickets: ITicketItem[];
}

const TicketItemSchema = new Schema<ITicketItem>(
  {
    count: {
      type: Number,
      required: true,
      min: 1,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    payment: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const TicketSchema = new Schema<ITicket>(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
    },
    tickets: {
      type: [TicketItemSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Ticket ||
  mongoose.model<ITicket>("Ticket", TicketSchema);
