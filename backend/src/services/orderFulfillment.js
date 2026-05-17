import { HttpError } from "../utils/httpError.js";

export async function loadOrderWithPayment(supabaseAdmin, orderId, userId) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*,order_items(*)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (orderError || !order) throw new HttpError(404, "Order not found");

  const { data: payment, error: payError } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payError) throw new HttpError(500, "Failed to load payment", payError.message);

  return { order, payment: payment || null };
}
