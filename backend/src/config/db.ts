import mongoose from "mongoose";
import { env } from "./env";

export const connectDb = async (): Promise<boolean> => {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    return true;
  } catch (error) {
    console.warn("MongoDB unavailable. Continuing in degraded mode for non-database routes.");
    return false;
  }
};

