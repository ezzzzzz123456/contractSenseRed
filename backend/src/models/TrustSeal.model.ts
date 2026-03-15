import { Schema, model } from "mongoose";

const TrustSealSchema = new Schema(
  {
    reportId: { type: Schema.Types.ObjectId, ref: "Report", required: true },
    lawyerId: { type: Schema.Types.ObjectId, ref: "Lawyer", required: true },
    issuedAt: { type: Date, default: Date.now },
    sealHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const TrustSealModel = model("TrustSeal", TrustSealSchema);

