import { HttpError } from "../utils/httpError.js";

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details,
    });
  }

  return res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? String(err?.stack || err) : null,
  });
}
