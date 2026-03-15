import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
  userType: "user" | "lawyer";
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwtSecret) as JwtPayload;

