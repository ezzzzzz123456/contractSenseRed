import { Schema, model } from "mongoose";

const ClauseSchema = new Schema(
  {
    text: { type: String, required: true },
    simplifiedText: { type: String, required: true },
    riskFlag: { type: String, enum: ["red", "yellow", "green"], required: true },
    explanation: { type: String, required: true },
    counterClauseSuggestion: { type: String, required: true },
  },
  { _id: false },
);

const ContractSchema = new Schema(
  {
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileUrl: { type: String, required: true },
    contractType: { type: String, required: true },
    status: { type: String, required: true, default: "uploaded" },
    clauseList: { type: [ClauseSchema], default: [] },
  },
  { timestamps: true },
);

export const ContractModel = model("Contract", ContractSchema);

