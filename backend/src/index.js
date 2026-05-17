import { randomUUID } from "crypto";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { stripeWebhookHandler } from "./routes/stripeWebhook.js";
import { payhereWebhookHandler } from "./routes/payhereWebhook.js";

const app = express();

app.post("/api/payments/stripe-webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
app.post(
  "/api/payments/payhere-webhook",
  express.urlencoded({ extended: false }),
  payhereWebhookHandler
);

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  })
);
app.use(helmet());
app.use((req, _res, next) => {
  req.requestId = randomUUID();
  next();
});
morgan.token("req-id", (req) => req.requestId || "-");
app.use(morgan(":req-id :method :url :status :response-time ms"));
app.use(express.json({ limit: "2mb" }));

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`TWOWAY backend listening on port ${env.port}`);
});
