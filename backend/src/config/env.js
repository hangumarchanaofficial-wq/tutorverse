import dotenv from "dotenv";

dotenv.config();

const requiredVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"];

for (const key of requiredVars) {
  if (!process.env[key]) {
    // Fail fast so deploy/runtime issues are obvious.
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  paymentProvider: process.env.PAYMENT_PROVIDER || "stripe",
  awsRegion: process.env.AWS_REGION || "ap-south-1",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  awsSnsSenderId: process.env.AWS_SNS_SENDER_ID || "TWOWAY",
};
