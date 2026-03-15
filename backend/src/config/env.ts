import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/contractsense",
  jwtSecret: process.env.JWT_SECRET ?? "replace-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://localhost:8000",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  paymentProviderKey: process.env.PAYMENT_PROVIDER_KEY ?? "",
};

