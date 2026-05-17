import { HttpError } from "../utils/httpError.js";
import { loadOrderWithPayment } from "./orderFulfillment.js";

const POLL_INTERVAL_MS = 250;
const POLL_TIMEOUT_MS = 8000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Race-free claim. Returns one of:
 *   { claimed: true }                                     -> caller must run RPC then call resolveClaim()
 *   { claimed: false, replay: { order, payment } }        -> request is a duplicate; return this to client
 */
export async function claimIdempotencyKey(supabase, { userId, idempotencyKey }) {
  const { error: insertError } = await supabase
    .from("order_idempotency")
    .insert({ user_id: userId, idempotency_key: idempotencyKey, order_id: null });

  if (!insertError) return { claimed: true };

  if (insertError.code !== "23505") {
    throw new HttpError(500, "Failed to claim idempotency key", insertError.message);
  }

  // Another concurrent request owns the slot. Wait briefly for it to commit
  // an order_id, then return the existing order so retries converge.
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from("order_idempotency")
      .select("order_id")
      .eq("user_id", userId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (error) throw new HttpError(500, "Failed to read idempotency state", error.message);
    if (data?.order_id) {
      const replay = await loadOrderWithPayment(supabase, data.order_id, userId);
      return { claimed: false, replay };
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new HttpError(409, "Order already in progress, please retry");
}

export async function attachOrderToClaim(supabase, { userId, idempotencyKey, orderId }) {
  const { error } = await supabase
    .from("order_idempotency")
    .update({ order_id: orderId })
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .is("order_id", null);
  if (error) throw new HttpError(500, "Failed to attach order to idempotency key", error.message);
}

export async function releaseClaim(supabase, { userId, idempotencyKey }) {
  // Only release if still unattached (so a replay-in-progress winner is preserved).
  await supabase
    .from("order_idempotency")
    .delete()
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .is("order_id", null);
}
