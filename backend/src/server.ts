import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

const start = async (): Promise<void> => {
  const dbConnected = await connectDb();
  app.listen(env.port, () => {
    console.log(`Backend listening on ${env.port}${dbConnected ? "" : " (degraded mode: MongoDB offline)"}`);
  });
};

start().catch((error: Error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});

