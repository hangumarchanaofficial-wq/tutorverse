import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const userOrIpKey = (req, res) => req.user?.id || ipKeyGenerator(req, res);

/** Mount AFTER requireAuth so each user has their own budget. */
export const orderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { error: "Too many order attempts, please try again later." },
});

export const couponValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { error: "Too many coupon checks, please try again later." },
});
