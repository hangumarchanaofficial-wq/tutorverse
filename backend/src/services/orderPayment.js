import { HttpError } from "../utils/httpError.js";
import { createPaymentSession as createStripeSession } from "./paymentService.js";
import { createPayhereSession } from "./payhereService.js";

const PAYMENT_PROVIDER = (process.env.PAYMENT_PROVIDER || "stripe").toLowerCase();

async function findExistingPayment(supabaseAdmin, orderId) {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new HttpError(500, "Failed to load existing payment", error.message);
  return data || null;
}

function paymentRowToPayload(row) {
  return {
    provider: row.provider,
    session_id: row.session_id,
    status: row.status,
    client_secret: null,
  };
}

async function createCardSession({ orderNumber, total, shipping }) {
  if (PAYMENT_PROVIDER === "payhere") {
    return createPayhereSession({
      orderNumber,
      amountLkr: total,
      customer: shipping,
    });
  }
  return createStripeSession({ orderNumber, amountLkr: total });
}

/**
 * Idempotent per (order_id). If a payment row already exists we return its
 * payload instead of creating a new one. Provider is selected by the
 * PAYMENT_PROVIDER env var (`stripe` | `payhere`); otherwise mock.
 */
export async function createOrderPaymentRecord(supabaseAdmin, { orderId, orderNumber, paymentMethod, total, shipping }) {
  const existing = await findExistingPayment(supabaseAdmin, orderId);
  if (existing) return paymentRowToPayload(existing);

  if (paymentMethod === "card") {
    const payment = await createCardSession({ orderNumber, total, shipping });
    const { error } = await supabaseAdmin.from("payments").insert({
      order_id: orderId,
      provider: payment.provider,
      session_id: payment.session_id,
      status: payment.status,
      amount: total,
      currency: "LKR",
    });
    if (error) {
      if (error.code === "23505") {
        const fallback = await findExistingPayment(supabaseAdmin, orderId);
        if (fallback) return paymentRowToPayload(fallback);
      }
      throw new HttpError(500, "Failed to record payment", error.message);
    }
    return payment;
  }

  const provider = paymentMethod === "cod" ? "cod" : "bank_transfer";
  const sessionId = `${provider}_${orderId}`;
  const { error } = await supabaseAdmin.from("payments").insert({
    order_id: orderId,
    provider,
    session_id: sessionId,
    status: "pending",
    amount: total,
    currency: "LKR",
  });

  if (error) {
    if (error.code === "23505") {
      const fallback = await findExistingPayment(supabaseAdmin, orderId);
      if (fallback) return paymentRowToPayload(fallback);
    }
    throw new HttpError(500, "Failed to record payment", error.message);
  }

  return {
    provider,
    session_id: sessionId,
    status: "pending",
    client_secret: null,
  };
}
