import Stripe from "stripe";
import { supabaseAdmin } from "../lib/supabase.js";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

/**
 * Stripe webhook — register this URL in Stripe Dashboard.
 * Mounted with express.raw() in index.js (must run before express.json).
 */
export async function stripeWebhookHandler(req, res, next) {
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ error: "Stripe webhook is not configured" });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      await syncPaymentAndOrder(pi.id, "succeeded", "paid");
    } else if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object;
      await syncPaymentAndOrder(pi.id, "failed", "failed");
    } else if (event.type === "payment_intent.canceled") {
      const pi = event.data.object;
      await syncPaymentAndOrder(pi.id, "canceled", "failed");
    }

    return res.json({ received: true });
  } catch (err) {
    return next(err);
  }
}

async function syncPaymentAndOrder(paymentIntentId, paymentRowStatus, orderPaymentStatus) {
  const { data: payment, error: payErr } = await supabaseAdmin
    .from("payments")
    .update({ status: paymentRowStatus })
    .eq("session_id", paymentIntentId)
    .select("order_id")
    .maybeSingle();

  if (payErr || !payment?.order_id) return;

  await supabaseAdmin.from("orders").update({ payment_status: orderPaymentStatus }).eq("id", payment.order_id);
}
