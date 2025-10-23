import mongoose, { Schema, Document } from "mongoose";

export interface Review {
  userImage: string;
  userName: string;
  time: string;
  rating: number;
  comment: string;
}

export interface ReviewRouteDocument extends Document {
  routeName: string;
  reviews: Review[];
}

const ReviewSchema = new Schema<Review>(
  {
    userImage: { type: String, required: true },
    userName: { type: String, required: true },
    time: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
  },
  { _id: false }
);

const ReviewRouteSchema = new Schema<ReviewRouteDocument>(
  {
    routeName: { type: String, required: true, unique: true },
    reviews: { type: [ReviewSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.ReviewRoute ||
  mongoose.model<ReviewRouteDocument>("ReviewRoute", ReviewRouteSchema);
