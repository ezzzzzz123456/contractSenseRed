import { Schema, model } from "mongoose";

const ReportSchema = new Schema(
  {
    contractId: { type: Schema.Types.ObjectId, ref: "Contract", required: true },
    aiOutput: { type: Schema.Types.Mixed, required: true },
    lawyerOutput: { type: Schema.Types.Mixed, default: {} },
    trustSeal: { type: Schema.Types.ObjectId, ref: "TrustSeal" },
    exportedPdfUrl: { type: String },
  },
  { timestamps: true },
);

export const ReportModel = model("Report", ReportSchema);

