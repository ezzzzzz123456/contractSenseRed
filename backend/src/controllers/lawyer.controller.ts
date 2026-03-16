import type { Request, Response } from "express";
import { ContractModel } from "../models/Contract.model";
import { LawyerModel } from "../models/Lawyer.model";
import { ReportModel } from "../models/Report.model";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export const listLawyers = async (_req: Request, res: Response): Promise<void> => {
  const lawyers = await LawyerModel.find().populate("userId", "name email pricing verificationStatus").lean();
  res.json(
    lawyers.map((lawyer) => ({
      _id: lawyer._id.toString(),
      userId: lawyer.userId?._id?.toString?.() ?? lawyer.userId?.toString?.() ?? "",
      name: "name" in lawyer.userId ? lawyer.userId.name : "Assigned Counsel",
      email: "email" in lawyer.userId ? lawyer.userId.email : "",
      specializations: lawyer.specializations,
      isVerified: lawyer.isVerified,
      ratings: lawyer.ratings,
      feePerReview: lawyer.feePerReview || ("pricing" in lawyer.userId ? lawyer.userId.pricing : 0),
      verificationStatus: "verificationStatus" in lawyer.userId ? lawyer.userId.verificationStatus : "pending",
    })),
  );
};

export const getLawyer = async (req: Request, res: Response): Promise<void> => {
  const lawyer = await LawyerModel.findById(req.params.lawyerId)
    .populate("userId", "name email pricing verificationStatus")
    .lean();

  if (!lawyer) {
    res.status(404).json({ message: "Lawyer not found" });
    return;
  }

  res.json({
    _id: lawyer._id.toString(),
    userId: lawyer.userId?._id?.toString?.() ?? lawyer.userId?.toString?.() ?? "",
    name: "name" in lawyer.userId ? lawyer.userId.name : "Assigned Counsel",
    email: "email" in lawyer.userId ? lawyer.userId.email : "",
    specializations: lawyer.specializations,
    isVerified: lawyer.isVerified,
    ratings: lawyer.ratings,
    feePerReview: lawyer.feePerReview || ("pricing" in lawyer.userId ? lawyer.userId.pricing : 0),
    verificationStatus: "verificationStatus" in lawyer.userId ? lawyer.userId.verificationStatus : "pending",
  });
};

export const requestLawyerReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (req.user.userType !== "user") {
    res.status(403).json({ message: "Only user accounts can request lawyer review" });
    return;
  }

  const { contractId, lawyerId, note } = req.body as {
    contractId?: string;
    lawyerId?: string;
    note?: string;
  };

  if (!contractId || !lawyerId) {
    res.status(400).json({ message: "contractId and lawyerId are required" });
    return;
  }

  const contract = await ContractModel.findOne({ _id: contractId, uploadedBy: req.user.userId });
  if (!contract) {
    res.status(404).json({ message: "Contract not found" });
    return;
  }

  const lawyer = await LawyerModel.findById(lawyerId).populate("userId", "name email");
  if (!lawyer) {
    res.status(404).json({ message: "Lawyer not found" });
    return;
  }

  const report = await ReportModel.findOneAndUpdate(
    { contractId: contract._id },
    {
      contractId: contract._id,
      $set: {
        "lawyerOutput.assignedLawyerId": lawyer._id.toString(),
        "lawyerOutput.assignedLawyerName": "name" in lawyer.userId ? lawyer.userId.name : "Assigned Counsel",
        "lawyerOutput.assignedLawyerEmail": "email" in lawyer.userId ? lawyer.userId.email : "",
        "lawyerOutput.reviewStatus": "pending_lawyer",
        "lawyerOutput.requestedAt": new Date().toISOString(),
        "lawyerOutput.requestNote": note ?? "",
      },
      $setOnInsert: {
        aiOutput: {},
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  contract.status = "pending_lawyer";
  await contract.save();

  res.json({
    message: "Lawyer review requested",
    contractId: contract._id.toString(),
    reportId: report._id.toString(),
    lawyer: {
      _id: lawyer._id.toString(),
      userId: lawyer.userId?._id?.toString?.() ?? lawyer.userId?.toString?.() ?? "",
      name: "name" in lawyer.userId ? lawyer.userId.name : "Assigned Counsel",
      email: "email" in lawyer.userId ? lawyer.userId.email : "",
      specializations: lawyer.specializations,
      isVerified: lawyer.isVerified,
      ratings: lawyer.ratings,
      feePerReview: lawyer.feePerReview,
    },
  });
};

export const getAssignedReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (req.user.userType !== "lawyer") {
    res.status(403).json({ message: "Lawyer account required" });
    return;
  }

  const lawyer = await LawyerModel.findOne({ userId: req.user.userId }).lean();
  if (!lawyer) {
    res.json({ reviews: [] });
    return;
  }

  const reports = await ReportModel.find({
    "lawyerOutput.assignedLawyerId": lawyer._id.toString(),
  }).lean();

  const contractIds = reports.map((report) => report.contractId);
  const contracts = await ContractModel.find({ _id: { $in: contractIds } }).lean();
  const contractsById = new Map(contracts.map((contract) => [contract._id.toString(), contract]));

  res.json({
    reviews: reports.map((report) => {
      const contract = contractsById.get(report.contractId.toString());
      const lawyerOutput = (report.lawyerOutput ?? {}) as Record<string, unknown>;

      return {
        reportId: report._id.toString(),
        contractId: report.contractId.toString(),
        contractName: contract?.fileUrl?.split("/").pop() ?? contract?.contractType ?? "Contract",
        contractType: contract?.contractType ?? "general",
        contractStatus: contract?.status ?? "pending_lawyer",
        requestedAt: (lawyerOutput.requestedAt as string | undefined) ?? null,
        requestNote: (lawyerOutput.requestNote as string | undefined) ?? "",
        reviewStatus: (lawyerOutput.reviewStatus as string | undefined) ?? "pending_lawyer",
        overallRiskScore: (report.aiOutput as Record<string, unknown>)?.overallRiskScore ?? null,
      };
    }),
  });
};
