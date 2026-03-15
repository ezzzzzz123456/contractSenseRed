import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { UserModel } from "../models/User.model";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { signToken } from "../utils/jwt";

type AuthBody = {
  name?: string;
  email?: string;
  password?: string;
  userType?: "user" | "lawyer";
};

const serializeUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  userType: "user" | "lawyer";
  verificationStatus: "pending" | "verified" | "rejected";
  ratings: number;
  pricing: number;
}) => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  userType: user.userType,
  verificationStatus: user.verificationStatus,
  ratings: user.ratings,
  pricing: user.pricing,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, userType = "user" } = req.body as AuthBody;

  if (!name || !email || !password) {
    res.status(400).json({ message: "Name, email, and password are required" });
    return;
  }

  const existingUser = await UserModel.findOne({ email }).lean();
  if (existingUser) {
    res.status(409).json({ message: "An account with that email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({
    name,
    email,
    passwordHash,
    userType,
    verificationStatus: userType === "lawyer" ? "pending" : "verified",
    ratings: 0,
    pricing: 0,
  });

  const token = signToken({ userId: user._id.toString(), userType: user.userType });
  res.status(201).json({
    message: "Registration successful",
    token,
    user: serializeUser(user),
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as AuthBody;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user._id.toString(), userType: user.userType });
  res.json({
    message: "Login successful",
    token,
    user: serializeUser(user),
  });
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    user: serializeUser(user),
  });
};
