import { createHash } from "crypto";

const merchantId = process.env.PAYHERE_MERCHANT_ID || "";
const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || "";
const sandbox = String(process.env.PAYHERE_SANDBOX || "true").toLowerCase() !== "false";
const returnUrl = process.env.PAYHERE_RETURN_URL || "";
const cancelUrl = process.env.PAYHERE_CANCEL_URL || "";
const notifyUrl = process.env.PAYHERE_NOTIFY_URL || "";

const CHECKOUT_URL = sandbox
  ? "https://sandbox.payhere.lk/pay/checkout"
  : "https://www.payhere.lk/pay/checkout";

function md5(str) {
  return createHash("md5").update(str, "utf8").digest("hex").toUpperCase();
}

function formatAmount(n) {
  return Number(n).toFixed(2);
}

/**
 * Build the form fields for PayHere checkout. The frontend posts these
 * fields to `checkout_url`. PayHere sends the verification POST back to
 * `notify_url` (handled in routes/payhereWebhook.js).
 *
 * Returns a payment-session-shaped object so it composes with the rest of
 * the payment flow.
 */
export function createPayhereSession({ orderNumber, amountLkr, customer }) {
  if (!merchantId || !merchantSecret) {
    return {
      provider: "mock",
      status: "initiated",
      session_id: `mock_${orderNumber}`,
      client_secret: null,
      redirect: null,
    };
  }

  const amount = formatAmount(amountLkr);
  const currency = "LKR";
  const hashedSecret = md5(merchantSecret);
  const hash = md5(`${merchantId}${orderNumber}${amount}${currency}${hashedSecret}`);

  const fields = {
    merchant_id: merchantId,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    order_id: orderNumber,
    items: `Order ${orderNumber}`,
    currency,
    amount,
    first_name: customer?.firstName || "",
    last_name: customer?.lastName || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    city: customer?.city || "",
    country: customer?.country || "Sri Lanka",
    hash,
  };

  return {
    provider: "payhere",
    status: "initiated",
    session_id: orderNumber, // PayHere identifies sessions by order_id
    client_secret: null,
    checkout_url: CHECKOUT_URL,
    fields,
  };
}

/**
 * Verify a notify-URL POST from PayHere.
 * https://support.payhere.lk/api-&-mobile-sdk/checkout-api
 */
export function verifyPayhereNotification(body) {
  if (!merchantId || !merchantSecret) return { ok: false, reason: "PayHere not configured" };

  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;

  if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
    return { ok: false, reason: "Missing fields" };
  }
  if (merchant_id !== merchantId) {
    return { ok: false, reason: "merchant_id mismatch" };
  }

  const local = md5(
    `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${md5(merchantSecret)}`
  );

  if (local !== String(md5sig).toUpperCase()) {
    return { ok: false, reason: "Signature mismatch" };
  }

  // PayHere status codes: 2 success, 0 pending, -1 cancelled, -2 failed, -3 chargedback
  const code = String(status_code);
  let status = "failed";
  if (code === "2") status = "succeeded";
  else if (code === "0") status = "pending";
  else if (code === "-1") status = "canceled";

  return { ok: true, orderNumber: String(order_id), status };
}
