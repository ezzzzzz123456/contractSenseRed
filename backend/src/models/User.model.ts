import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    userType: { type: String, enum: ["user", "lawyer"], required: true },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    ratings: { type: Number, default: 0 },
    pricing: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const UserModel = model("User", UserSchema);

