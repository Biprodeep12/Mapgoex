import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI||'';

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseGlobal;
}

const cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
