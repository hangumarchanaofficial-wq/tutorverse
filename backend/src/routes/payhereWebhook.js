import { supabaseAdmin } from "../lib/supabase.js";
import { verifyPayhereNotification } from "../services/payhereService.js";

/**
 * PayHere posts notification as application/x-www-form-urlencoded. Mounted
 * with express.urlencoded() in index.js, before the JSON parser, so the
 * verification has the original fields.
 */
export async function payhereWebhookHandler(req, res, next) {
  try {
    const result = verifyPayhereNotification(req.body || {});
    if (!result.ok) {
      return res.status(400).json({ error: result.reason });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("order_number", result.orderNumber)
      .maybeSingle();
    if (orderError || !order) return res.status(404).json({ error: "Order not found" });

    await supabaseAdmin
      .from("payments")
      .update({ status: result.status })
      .eq("order_id", order.id)
      .eq("provider", "payhere");

    const orderPaymentStatus =
      result.status === "succeeded" ? "paid" : result.status === "pending" ? "pending" : "failed";

    await supabaseAdmin.from("orders").update({ payment_status: orderPaymentStatus }).eq("id", order.id);

    return res.json({ received: true });
  } catch (err) {
    return next(err);
  }
}
