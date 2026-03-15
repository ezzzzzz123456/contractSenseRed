import { Schema, model } from "mongoose";

const LawyerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    specializations: { type: [String], default: [] },
    isVerified: { type: Boolean, default: false },
    ratings: { type: Number, default: 0 },
    feePerReview: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const LawyerModel = model("Lawyer", LawyerSchema);

