import type { Request, Response } from "express";
import { signToken } from "../utils/jwt";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, userType = "user" } = req.body as { email: string; userType?: "user" | "lawyer" };
  res.status(201).json({
    message: "Registration stub",
    token: signToken({ userId: "stub-user-id", userType }),
    email,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, userType = "user" } = req.body as { email: string; userType?: "user" | "lawyer" };
  res.json({
    message: "Login stub",
    token: signToken({ userId: "stub-user-id", userType }),
    email,
  });
};

