import { createHash } from "crypto";

export function hashIdempotencyKey(rawKey) {
  return createHash("sha256").update(String(rawKey), "utf8").digest("hex");
}
