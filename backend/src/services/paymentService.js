import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

/** Currencies Stripe treats as zero-decimal (amount = whole units, no ×100). Comma-separated ISO codes. */
function stripeAmountUnits(amountMain, currency) {
  const cur = String(currency).toLowerCase();
  const zeroDecimal = new Set(
    String(process.env.STRIPE_ZERO_DECIMAL_CURRENCIES || "")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
  );
  const n = Number(amountMain);
  if (zeroDecimal.has(cur)) return Math.round(n);
  return Math.round(n * 100);
}

export async function createPaymentSession({ orderNumber, amountLkr, currency = "lkr" }) {
  if (!stripe) {
    return {
      provider: "mock",
      status: "initiated",
      session_id: `mock_${orderNumber}`,
      client_secret: null,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: stripeAmountUnits(amountLkr, currency),
    currency,
    metadata: { orderNumber },
  });

  return {
    provider: "stripe",
    status: paymentIntent.status,
    session_id: paymentIntent.id,
    client_secret: paymentIntent.client_secret,
  };
}
