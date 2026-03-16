import cors from "cors";
import express from "express";
import path from "node:path";
import authRoutes from "./routes/auth.routes";
import contractRoutes from "./routes/contract.routes";
import reportRoutes from "./routes/report.routes";
import lawyerRoutes from "./routes/lawyer.routes";
import aiProxyRoutes from "./routes/ai.proxy.routes";
import { errorHandler } from "./middleware/error.middleware";
import { env } from "./config/env";

export const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/lawyers", lawyerRoutes);
app.use("/api/ai", aiProxyRoutes);
app.use(errorHandler);
