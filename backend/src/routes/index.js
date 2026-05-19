import express from "express";
import Joi from "joi";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import { sendSms } from "../services/smsService.js";
import { buildInvoicePdfBuffer } from "../services/invoiceService.js";
import { createOrderPaymentRecord } from "../services/orderPayment.js";
import { loadOrderWithPayment } from "../services/orderFulfillment.js";
import { couponValidateLimiter, orderCreateLimiter } from "../middleware/rateLimit.js";
import { hashIdempotencyKey } from "../utils/idempotency.js";
import { generateInvoiceNumber, generateOrderNumber } from "../services/orderNumber.js";
import { attachOrderToClaim, claimIdempotencyKey, releaseClaim } from "../services/idempotencyStore.js";

const ORDER_STATUSES = [
  "pending",
  "placed",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "completed",
  "cancelled",
];
const INTERNAL_WEBHOOK_SECRET = process.env.INTERNAL_WEBHOOK_SECRET || "";

const router = express.Router();
const SUPABASE_READ_TIMEOUT_MS = Number(process.env.SUPABASE_READ_TIMEOUT_MS || 5_000);

function isTableMissing(err) {
  const msg = [err?.message, err?.details].filter(Boolean).join(" ");
  return /schema cache|relation .* does not exist/.test(msg);
}

function isSupabaseTimeout(err) {
  return err?.name === "AbortError" || err?.status === 504 || /aborted|timed out/i.test(err?.message || "");
}

function isDataSourceUnavailable(err) {
  const msg = [err?.message, err?.details].filter(Boolean).join(" ");
  return isSupabaseTimeout(err) || /fetch failed|network|failed to fetch/i.test(msg);
}

async function supabaseRead(query, timeoutMs = SUPABASE_READ_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const runnable = typeof query.abortSignal === "function" ? query.abortSignal(controller.signal) : query;

  try {
    return await runnable;
  } catch (error) {
    if (isSupabaseTimeout(error)) {
      throw new HttpError(504, "Data source timed out", error.message);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

const orderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().required(),
        quantity: Joi.number().integer().min(1).required(),
        selected_size: Joi.string().allow("", null),
        selected_color: Joi.string().allow("", null),
      })
    )
    .min(1)
    .required(),
  shipping: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    apartment: Joi.string().allow("", null),
    city: Joi.string().required(),
    province: Joi.string().allow("", null),
    postalCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  payment_method: Joi.string().valid("cod", "card", "bank").required(),
  coupon_code: Joi.string().allow("", null),
});

const reviewSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow("", null).max(8000),
});

const cartWishlistItemSchema = Joi.object({
  id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  title: Joi.string().max(500).allow("", null),
  quantity: Joi.number().integer().min(1).max(99),
  price: Joi.number(),
  originalPrice: Joi.number(),
  discount: Joi.number(),
  image: Joi.string().max(2000).allow("", null),
  category: Joi.string().max(200).allow("", null),
  selectedSize: Joi.string().max(120).allow("", null),
  selectedColor: Joi.string().max(120).allow("", null),
}).unknown(true);

const cartWishlistPayloadSchema = Joi.array().items(cartWishlistItemSchema).max(200);

const adminProductCreateSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow("", null),
  category_id: Joi.number().integer().positive().allow(null),
  category_slug: Joi.string().allow("", null),
  brand: Joi.string().allow("", null),
  price: Joi.number().min(0).required(),
  original_price: Joi.number().min(0).allow(null),
  discount: Joi.number().integer().min(0).max(100).default(0),
  stock_qty: Joi.number().integer().min(0).default(0),
  image: Joi.string().allow("", null),
  images_json: Joi.array().default([]),
  is_active: Joi.boolean().default(true),
  is_featured: Joi.boolean().default(false),
  is_best_seller: Joi.boolean().default(false),
  is_new_arrival: Joi.boolean().default(false),
});

const adminProductPatchSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow("", null),
  category_id: Joi.number().integer().positive().allow(null),
  category_slug: Joi.string().allow("", null),
  brand: Joi.string().allow("", null),
  price: Joi.number().min(0),
  original_price: Joi.number().min(0).allow(null),
  discount: Joi.number().integer().min(0).max(100),
  stock_qty: Joi.number().integer().min(0),
  image: Joi.string().allow("", null),
  images_json: Joi.array(),
  is_active: Joi.boolean(),
  is_featured: Joi.boolean(),
  is_best_seller: Joi.boolean(),
  is_new_arrival: Joi.boolean(),
}).min(1);

const categorySchema = Joi.object({
  name: Joi.string().min(1).max(160).required(),
  slug: Joi.string().min(1).max(160).pattern(/^[a-z0-9-]+$/).required(),
});

const categoryPatchSchema = Joi.object({
  name: Joi.string().min(1).max(160),
  slug: Joi.string().min(1).max(160).pattern(/^[a-z0-9-]+$/),
}).min(1);

const couponCreateSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(40).required(),
  type: Joi.string().valid("percentage", "fixed").required(),
  value: Joi.number().min(0).required(),
  is_active: Joi.boolean().default(true),
  expires_at: Joi.date().iso().allow(null),
});

const couponPatchSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(40),
  type: Joi.string().valid("percentage", "fixed"),
  value: Joi.number().min(0),
  is_active: Joi.boolean(),
  expires_at: Joi.date().iso().allow(null),
}).min(1);

const profilePatchSchema = Joi.object({
  full_name: Joi.string().max(160).allow("", null),
  phone: Joi.string().max(40).allow("", null),
}).min(1);

const productImportSchema = Joi.object({
  items: Joi.array().items(adminProductCreateSchema).min(1).max(500).required(),
});

router.get("/health", async (_req, res, next) => {
  try {
    const { error } = await supabaseAdmin.from("products").select("id").limit(1).maybeSingle();
    if (error) {
      return res.status(503).json({
        ok: false,
        service: "twoway-backend",
        database: "unavailable",
        error: error.message,
      });
    }
    res.json({ ok: true, service: "twoway-backend", database: "ok" });
  } catch (err) {
    next(err);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const { category, q, featured, best_seller, new_arrival } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 1000);

    let query = supabaseAdmin.from("products").select("*").eq("is_active", true);
    if (category) query = query.eq("category_slug", String(category));
    if (q) query = query.ilike("title", `%${String(q)}%`);
    if (featured === "true") query = query.eq("is_featured", true);
    if (best_seller === "true") query = query.eq("is_best_seller", true);
    if (new_arrival === "true") query = query.eq("is_new_arrival", true);

    const { data, error } = await query.limit(limit);
    if (error) throw new HttpError(500, "Failed to load products", error.message);
    res.json({ items: data || [] });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [] });
    next(error);
  }
});

router.get("/products/:id", async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isFinite(productId)) throw new HttpError(400, "Invalid product id");

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_active", true)
      .single();
    if (error || !product) throw new HttpError(404, "Product not found");

    let reviews = [];
    try {
      const { data: revData } = await supabaseAdmin
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      reviews = revData || [];
    } catch { /* reviews table may not exist yet */ }

    res.json({ ...product, reviews });
  } catch (error) {
    if (isTableMissing(error)) return res.status(404).json({ error: "Product not found" });
    next(error);
  }
});

router.get("/categories", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new HttpError(500, "Failed to load categories", error.message);
    res.json({ items: data || [] });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [] });
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .eq("id", req.user.id)
      .maybeSingle();
    if (error) throw new HttpError(500, "Failed to load profile", error.message);

    res.json({
      id: req.user.id,
      email: req.user.email,
      profile:
        data || {
          id: req.user.id,
          full_name: req.user.user_metadata?.full_name || "",
          phone: null,
          role: "customer",
          created_at: null,
        },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const { error: valErr, value } = profilePatchSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid profile patch", valErr.details);

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: req.user.id, ...value }, { onConflict: "id" })
      .select("id, full_name, phone, role, created_at")
      .single();
    if (error) throw new HttpError(500, "Failed to update profile", error.message);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/products/:id/reviews", async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isFinite(productId)) throw new HttpError(400, "Invalid product id");

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const { data, error, count } = await supabaseAdmin
      .from("reviews")
      .select("id, product_id, rating, comment, created_at", { count: "exact" })
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new HttpError(500, "Failed to load reviews", error.message);
    res.json({ items: data || [], total: count ?? 0 });
  } catch (error) {
    next(error);
  }
});

router.post("/cart/sync", requireAuth, async (req, res, next) => {
  try {
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    const { error: cartErr, value: items } = cartWishlistPayloadSchema.validate(rawItems, { abortEarly: false });
    if (cartErr) throw new HttpError(400, "Invalid cart payload", cartErr.details);

    await supabaseAdmin.from("carts").upsert(
      {
        user_id: req.user.id,
        items_json: items,
      },
      { onConflict: "user_id" }
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/cart", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("carts")
      .select("items_json")
      .eq("user_id", req.user.id)
      .single();

    if (error && error.code !== "PGRST116") throw new HttpError(500, "Failed to load cart", error.message);
    res.json({ items: data?.items_json || [] });
  } catch (error) {
    next(error);
  }
});

router.get("/wishlist", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("wishlists")
      .select("items_json")
      .eq("user_id", req.user.id)
      .single();

    if (error && error.code !== "PGRST116") throw new HttpError(500, "Failed to load wishlist", error.message);
    res.json({ items: data?.items_json || [] });
  } catch (error) {
    next(error);
  }
});

router.post("/wishlist/sync", requireAuth, async (req, res, next) => {
  try {
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    const { error: wlErr, value: items } = cartWishlistPayloadSchema.validate(rawItems, { abortEarly: false });
    if (wlErr) throw new HttpError(400, "Invalid wishlist payload", wlErr.details);

    await supabaseAdmin.from("wishlists").upsert(
      {
        user_id: req.user.id,
        items_json: items,
      },
      { onConflict: "user_id" }
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post("/coupons/validate", couponValidateLimiter, async (req, res, next) => {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    if (!code) throw new HttpError(400, "Coupon code is required");
    const { data, error } = await supabaseAdmin.from("coupons").select("*").eq("code", code).single();
    if (error || !data) throw new HttpError(404, "Invalid coupon code");
    if (!data.is_active) throw new HttpError(400, "Coupon is inactive");
    if (data.expires_at && new Date(data.expires_at) < new Date()) throw new HttpError(400, "Coupon has expired");
    res.json({ valid: true, coupon: data });
  } catch (error) {
    next(error);
  }
});

router.post("/orders", requireAuth, orderCreateLimiter, async (req, res, next) => {
  const { error: validationError, value } = orderSchema.validate(req.body, { abortEarly: false });
  if (validationError) {
    return next(new HttpError(400, "Invalid order payload", validationError.details));
  }

  const { items, shipping, payment_method, coupon_code } = value;

  // Optional Idempotency-Key claim must happen BEFORE the RPC, so two
  // concurrent retries of the same key cannot both create an order.
  let idemHash = null;
  const idemRaw = String(req.get("idempotency-key") || "").trim();
  if (idemRaw) {
    const idemValErr = Joi.string().min(8).max(128).validate(idemRaw).error;
    if (idemValErr) return next(new HttpError(400, "Invalid Idempotency-Key header", idemValErr.details));
    idemHash = hashIdempotencyKey(idemRaw);
    try {
      const claim = await claimIdempotencyKey(supabaseAdmin, {
        userId: req.user.id,
        idempotencyKey: idemHash,
      });
      if (!claim.claimed) {
        return res.status(201).json(claim.replay);
      }
    } catch (err) {
      return next(err);
    }
  }

  let orderId = null;
  try {
    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber();

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("create_order_transaction", {
      p_user_id: req.user.id,
      p_payment_method: payment_method,
      p_coupon_code: coupon_code || null,
      p_shipping: shipping,
      p_items: items,
      p_order_number: orderNumber,
      p_invoice_number: invoiceNumber,
    });

    if (rpcError) throw new HttpError(500, "Order transaction failed", rpcError.message);
    if (!rpcResult?.ok) {
      throw new HttpError(400, typeof rpcResult?.error === "string" ? rpcResult.error : "Order could not be placed");
    }

    orderId = Number(rpcResult.order_id);

    if (idemHash) {
      await attachOrderToClaim(supabaseAdmin, {
        userId: req.user.id,
        idempotencyKey: idemHash,
        orderId,
      });
    }

    const { data: order, error: orderLoadError } = await supabaseAdmin
      .from("orders")
      .select("*,order_items(*)")
      .eq("id", orderId)
      .single();
    if (orderLoadError || !order) {
      throw new HttpError(500, "Order created but could not be loaded", orderLoadError?.message);
    }

    const { error: invError } = await supabaseAdmin.from("invoices").upsert(
      { order_id: order.id, invoice_number: order.invoice_number },
      { onConflict: "order_id" }
    );
    if (invError) throw new HttpError(500, "Failed to record invoice", invError.message);

    const payment = await createOrderPaymentRecord(supabaseAdmin, {
      orderId: order.id,
      orderNumber,
      paymentMethod: payment_method,
      total: order.total_amount,
      shipping,
    });

    // SMS is best-effort; a failure here must not fail the order response.
    sendSms(shipping.phone, `Your TWOWAY order ${orderNumber} was placed successfully.`)
      .then((sms) =>
        supabaseAdmin.from("sms_logs").insert({
          order_id: order.id,
          phone: shipping.phone,
          message: `Your TWOWAY order ${orderNumber} was placed successfully.`,
          status: sms.ok ? "sent" : "failed",
          provider_message_id: sms.providerMessageId || null,
          error_message: sms.ok ? null : sms.reason,
        })
      )
      .catch(() => null);

    return res.status(201).json({ order, payment });
  } catch (err) {
    if (idemHash && orderId === null) {
      await releaseClaim(supabaseAdmin, { userId: req.user.id, idempotencyKey: idemHash }).catch(() => null);
    }
    return next(err);
  }
});

router.get("/orders/my", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*,order_items(*)")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw new HttpError(500, "Failed to load orders", error.message);
    res.json({ items: data || [] });
  } catch (error) {
    next(error);
  }
});

router.get("/orders/:id", requireAuth, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isFinite(orderId)) throw new HttpError(400, "Invalid order id");

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*,order_items(*)")
      .eq("id", orderId)
      .eq("user_id", req.user.id)
      .single();
    if (error || !data) throw new HttpError(404, "Order not found");
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post("/reviews", requireAuth, async (req, res, next) => {
  try {
    const { error: validationError, value } = reviewSchema.validate(req.body, { abortEarly: false });
    if (validationError) throw new HttpError(400, "Invalid review", validationError.details);

    const payload = {
      user_id: req.user.id,
      product_id: value.product_id,
      rating: value.rating,
      comment: value.comment || "",
      is_approved: false,
    };
    const { data, error } = await supabaseAdmin.from("reviews").insert(payload).select("*").single();
    if (error) throw new HttpError(500, "Failed to submit review", error.message);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * Internal webhook for non-Stripe providers (or local dev tools). Disabled
 * unless INTERNAL_WEBHOOK_SECRET is set, and the caller must supply it via
 * the X-Internal-Webhook-Secret header. The Stripe-signed webhook lives at
 * POST /api/payments/stripe-webhook.
 */
router.post("/payments/webhook", async (req, res, next) => {
  try {
    if (!INTERNAL_WEBHOOK_SECRET) throw new HttpError(503, "Internal webhook is not configured");
    const provided = String(req.get("x-internal-webhook-secret") || "");
    if (provided !== INTERNAL_WEBHOOK_SECRET) throw new HttpError(401, "Unauthorized");

    const webhookSchema = Joi.object({
      session_id: Joi.string().min(1).max(255).required(),
      status: Joi.string().valid("succeeded", "failed", "canceled", "pending").required(),
    });
    const { error: valErr, value } = webhookSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid webhook payload", valErr.details);

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({ status: value.status })
      .eq("session_id", value.session_id)
      .select("*")
      .maybeSingle();
    if (paymentError) throw new HttpError(500, "Failed to update payment", paymentError.message);
    if (!payment) throw new HttpError(404, "Payment not found");

    const orderPaymentStatus =
      value.status === "succeeded" ? "paid" : value.status === "pending" ? "pending" : "failed";

    await supabaseAdmin.from("orders").update({ payment_status: orderPaymentStatus }).eq("id", payment.order_id);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/invoice/:orderId", requireAuth, async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isFinite(orderId)) throw new HttpError(400, "Invalid order id");

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*,order_items(*)")
      .eq("id", orderId)
      .eq("user_id", req.user.id)
      .single();
    if (error || !data) throw new HttpError(404, "Order not found");

    const pdfBuffer = await buildInvoicePdfBuffer(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${data.invoice_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/orders", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const rawStatus = req.query.status ? String(req.query.status) : null;
    const status = rawStatus && ORDER_STATUSES.includes(rawStatus) ? rawStatus : null;
    if (rawStatus && !status) throw new HttpError(400, "Invalid status filter");

    let query = supabaseAdmin
      .from("orders")
      .select("*,order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await supabaseRead(query);
    if (isDataSourceUnavailable(error)) {
      return res.json({ items: [], total: 0, warning: "Data source unavailable" });
    }
    if (error) throw new HttpError(500, "Failed to load orders", error.message);
    res.json({ items: data || [], total: count ?? 0 });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [], total: 0 });
    if (isDataSourceUnavailable(error)) {
      return res.json({ items: [], total: 0, warning: "Data source unavailable" });
    }
    next(error);
  }
});

router.get("/admin/orders/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isFinite(orderId)) throw new HttpError(400, "Invalid order id");

    const { data, error } = await supabaseRead(
      supabaseAdmin
        .from("orders")
        .select("*,order_items(*)")
        .eq("id", orderId)
        .single()
    );
    if (isDataSourceUnavailable(error)) throw new HttpError(504, "Data source unavailable");
    if (error || !data) throw new HttpError(404, "Order not found");
    res.json(data);
  } catch (error) {
    if (isDataSourceUnavailable(error)) return next(new HttpError(504, "Data source unavailable"));
    next(error);
  }
});

router.get("/admin/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = req.query.q ? String(req.query.q).trim() : null;
    const active = req.query.is_active;

    let query = supabaseAdmin
      .from("products")
      .select("*", { count: "exact" })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) query = query.ilike("title", `%${q}%`);
    if (active === "true") query = query.eq("is_active", true);
    if (active === "false") query = query.eq("is_active", false);

    const { data, error, count } = await query;
    if (error) throw new HttpError(500, "Failed to load products", error.message);
    res.json({ items: data || [], total: count ?? 0 });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [], total: 0 });
    next(error);
  }
});

router.post("/admin/products", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { error: valErr, value } = adminProductCreateSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid product payload", valErr.details);

    const { data, error } = await supabaseAdmin.from("products").insert(value).select("*").single();
    if (error) throw new HttpError(500, "Failed to create product", error.message);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isFinite(productId)) throw new HttpError(400, "Invalid product id");

    const { error: valErr, value } = adminProductPatchSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid product patch", valErr.details);

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(value)
      .eq("id", productId)
      .select("*")
      .maybeSingle();
    if (error) throw new HttpError(500, "Failed to update product", error.message);
    if (!data) throw new HttpError(404, "Product not found");
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/products/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isFinite(productId)) throw new HttpError(400, "Invalid product id");

    // Hard delete blows up the FK from order_items.product_id (ON DELETE
    // SET NULL is not declared). Soft-delete by deactivating instead so
    // historical orders keep their product reference.
    const { data, error } = await supabaseAdmin
      .from("products")
      .update({ is_active: false })
      .eq("id", productId)
      .select("*")
      .maybeSingle();
    if (error) throw new HttpError(500, "Failed to deactivate product", error.message);
    if (!data) throw new HttpError(404, "Product not found");
    res.json({ ok: true, product: data });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/products/import", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { error: valErr, value } = productImportSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid import payload", valErr.details);

    const { data, error } = await supabaseAdmin.from("products").insert(value.items).select("id");
    if (error) throw new HttpError(500, "Bulk import failed", error.message);
    res.status(201).json({ inserted: data?.length || 0, ids: (data || []).map((r) => r.id) });
  } catch (error) {
    next(error);
  }
});

// Per-range in-memory cache. The dashboard refetches on every navigation;
// without this each visit re-runs ~10 Supabase queries (~1-2s round-trip).
// 30s is short enough that the data feels live.
const analyticsCache = new Map();
const ANALYTICS_TTL_MS = 30_000;
const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };

function pctDelta(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

router.get("/admin/analytics", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const range = RANGE_DAYS[req.query.range] ? req.query.range : "30d";
    const rangeDays = RANGE_DAYS[range];
    const now = Date.now();
    const fresh = req.query.fresh === "1";

    const cached = analyticsCache.get(range);
    if (!fresh && cached && now - cached.at < ANALYTICS_TTL_MS) {
      res.set("X-Cache", "HIT");
      return res.json(cached.payload);
    }

    const periodStart = new Date(now - rangeDays * 86_400_000);
    const prevStart = new Date(now - 2 * rangeDays * 86_400_000);
    const periodStartIso = periodStart.toISOString();
    const prevStartIso = prevStart.toISOString();

    // 12 calendar months back, aligned to the first of the month so the
    // bar/line chart bins line up with month labels regardless of "today".
    const monthsBackStart = new Date(Date.UTC(
      new Date(now).getUTCFullYear(),
      new Date(now).getUTCMonth() - 11,
      1
    ));
    const monthsBackStartIso = monthsBackStart.toISOString();

    // Each query is independent; if one table is missing, RLS blocks, or
    // Supabase is slow, still return a payload so the dashboard can render.
    const safe = (query) =>
      supabaseRead(query).catch(() => ({ data: null, count: null, error: true }));

    const [
      { count: ordersAllTime },
      { count: usersTotal },
      { count: productsActive },
      { count: pendingReviews },
      { count: lowStock },
      { count: newCustomersCurrent },
      { count: newCustomersPrev },
      { data: periodOrders },
      { data: recentOrders },
      { data: recentReviews },
      { data: monthlyOrders },
      { data: locationOrders },
    ] = await Promise.all([
      safe(supabaseAdmin.from("orders").select("*", { count: "exact", head: true })),
      safe(supabaseAdmin.from("profiles").select("*", { count: "exact", head: true })),
      safe(
        supabaseAdmin.from("products").select("*", { count: "exact", head: true }).eq("is_active", true)
      ),
      safe(
        supabaseAdmin.from("reviews").select("*", { count: "exact", head: true }).eq("is_approved", false)
      ),
      safe(
        supabaseAdmin
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .lte("stock_qty", 5)
      ),
      safe(
        supabaseAdmin
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", periodStartIso)
      ),
      safe(
        supabaseAdmin
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", prevStartIso)
          .lt("created_at", periodStartIso)
      ),
      // One pull spanning 2x range so we can compute current + previous deltas
      // and per-day buckets without extra round-trips.
      safe(
        supabaseAdmin
          .from("orders")
          .select("id, total_amount, status, payment_method, created_at")
          .gte("created_at", prevStartIso)
      ),
      safe(
        supabaseAdmin
          .from("orders")
          .select("id, order_number, customer_name, customer_email, total_amount, status, payment_status, created_at")
          .order("created_at", { ascending: false })
          .limit(8)
      ),
      safe(
        supabaseAdmin
          .from("reviews")
          .select("id, rating, comment, is_approved, created_at, product_id")
          .order("created_at", { ascending: false })
          .limit(5)
      ),
      // 12-month bar/line chart series.
      safe(
        supabaseAdmin
          .from("orders")
          .select("id, total_amount, created_at")
          .gte("created_at", monthsBackStartIso)
      ),
      // Customer geography from shipping_payload jsonb (bounded for cost).
      safe(
        supabaseAdmin
          .from("orders")
          .select("shipping_payload, total_amount, created_at")
          .gte("created_at", periodStartIso)
          .order("created_at", { ascending: false })
          .limit(2000)
      ),
    ]);

    // Split the order pull into current vs previous period in JS.
    const ordersAll = periodOrders || [];
    const currOrders = ordersAll.filter((o) => o.created_at >= periodStartIso);
    const prevOrders = ordersAll.filter(
      (o) => o.created_at >= prevStartIso && o.created_at < periodStartIso
    );

    const sumRevenue = (arr) => arr.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const revenue = sumRevenue(currOrders);
    const revenuePrev = sumRevenue(prevOrders);
    const ordersN = currOrders.length;
    const ordersPrev = prevOrders.length;
    const aov = ordersN ? revenue / ordersN : 0;
    const aovPrev = ordersPrev ? revenuePrev / ordersPrev : 0;

    // Per-day buckets for the line chart + KPI sparklines.
    const dayBuckets = new Map();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
      dayBuckets.set(d, { date: d, revenue: 0, orders: 0 });
    }
    for (const o of currOrders) {
      const d = String(o.created_at).slice(0, 10);
      const b = dayBuckets.get(d);
      if (!b) continue;
      b.revenue += Number(o.total_amount || 0);
      b.orders += 1;
    }
    const salesByDay = Array.from(dayBuckets.values());

    // Status + payment breakdowns from current-period orders.
    const statusMap = new Map();
    const paymentMap = new Map();
    for (const o of currOrders) {
      statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);
      const pm = o.payment_method || "unknown";
      const slot = paymentMap.get(pm) || { method: pm, count: 0, amount: 0 };
      slot.count += 1;
      slot.amount += Number(o.total_amount || 0);
      paymentMap.set(pm, slot);
    }
    const statusBreakdown = Array.from(statusMap, ([status, count]) => ({ status, count }));
    const paymentMix = Array.from(paymentMap.values()).sort((a, b) => b.amount - a.amount);

    // Aggregate top products + top categories from order_items joined to
    // current-period orders. order_items has no timestamp itself.
    const currOrderIds = currOrders.map((o) => o.id).filter(Boolean);
    let topProducts = [];
    let topCategories = [];
    if (currOrderIds.length) {
      const { data: items } = await safe(
        supabaseAdmin
          .from("order_items")
          .select(
            "product_id, product_title, quantity, line_total, products(title, image, category_id, category_slug, categories(name, slug))"
          )
          .in("order_id", currOrderIds)
      );
      const productAgg = new Map();
      const categoryAgg = new Map();
      for (const it of items || []) {
        const pid = it.product_id || it.products?.id || it.product_title;
        const slot =
          productAgg.get(pid) ||
          {
            id: it.product_id,
            title: it.products?.title || it.product_title,
            image: it.products?.image,
            qty: 0,
            revenue: 0,
          };
        slot.qty += Number(it.quantity || 0);
        slot.revenue += Number(it.line_total || 0);
        productAgg.set(pid, slot);

        const catName =
          it.products?.categories?.name ||
          it.products?.category_slug ||
          "Uncategorized";
        const cslot = categoryAgg.get(catName) || { name: catName, revenue: 0, orders: 0 };
        cslot.revenue += Number(it.line_total || 0);
        cslot.orders += 1;
        categoryAgg.set(catName, cslot);
      }
      topProducts = Array.from(productAgg.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const catTotal = Array.from(categoryAgg.values()).reduce((s, c) => s + c.revenue, 0) || 1;
      topCategories = Array.from(categoryAgg.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((c) => ({ ...c, share: c.revenue / catTotal }));
    }

    // ─── 12-month bar/line series ──────────────────────────────────────
    // Always emit 12 buckets in chronological order so the chart never
    // has to guess about gaps.
    const monthBuckets = [];
    {
      const baseYear = new Date(now).getUTCFullYear();
      const baseMonth = new Date(now).getUTCMonth();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(baseYear, baseMonth - i, 1));
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        monthBuckets.push({
          key,
          label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
          year: d.getUTCFullYear(),
          revenue: 0,
          orders: 0,
        });
      }
      const monthIndex = new Map(monthBuckets.map((b, idx) => [b.key, idx]));
      for (const o of monthlyOrders || []) {
        const dt = new Date(o.created_at);
        const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
        const idx = monthIndex.get(key);
        if (idx === undefined) continue;
        monthBuckets[idx].revenue += Number(o.total_amount || 0);
        monthBuckets[idx].orders += 1;
      }
    }

    // ─── Customer locations from shipping_payload ──────────────────────
    // We aggregate at three granularities so the dashboard can pivot
    // between province / city / country without another round-trip.
    const provinceAgg = new Map();
    const cityAgg = new Map();
    const countryAgg = new Map();
    const normalizeKey = (s) => String(s || "").trim();
    for (const row of locationOrders || []) {
      const sp = row.shipping_payload || {};
      const amount = Number(row.total_amount || 0);
      const city = normalizeKey(sp.city);
      const province = normalizeKey(sp.province) || "Unspecified";
      const country = normalizeKey(sp.country) || "Sri Lanka";

      const pSlot = provinceAgg.get(province) || { name: province, orders: 0, revenue: 0 };
      pSlot.orders += 1;
      pSlot.revenue += amount;
      provinceAgg.set(province, pSlot);

      if (city) {
        const cSlot = cityAgg.get(city) || { name: city, province, orders: 0, revenue: 0 };
        cSlot.orders += 1;
        cSlot.revenue += amount;
        cityAgg.set(city, cSlot);
      }

      const coSlot = countryAgg.get(country) || { name: country, orders: 0, revenue: 0 };
      coSlot.orders += 1;
      coSlot.revenue += amount;
      countryAgg.set(country, coSlot);
    }

    const totalLocOrders = (locationOrders || []).length || 1;
    const sortAndShare = (arr) =>
      arr
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 8)
        .map((r) => ({ ...r, share: r.orders / totalLocOrders }));

    const customerLocations = {
      provinces: sortAndShare(Array.from(provinceAgg.values())),
      cities: sortAndShare(Array.from(cityAgg.values())),
      countries: sortAndShare(Array.from(countryAgg.values())),
      sampledOrders: locationOrders?.length || 0,
    };

    const payload = {
      range,
      rangeDays,
      generatedAt: new Date(now).toISOString(),
      kpis: {
        revenue: {
          value: revenue,
          prev: revenuePrev,
          delta: pctDelta(revenue, revenuePrev),
          spark: salesByDay.map((d) => d.revenue),
        },
        orders: {
          value: ordersN,
          prev: ordersPrev,
          delta: pctDelta(ordersN, ordersPrev),
          spark: salesByDay.map((d) => d.orders),
        },
        aov: {
          value: aov,
          prev: aovPrev,
          delta: pctDelta(aov, aovPrev),
        },
        newCustomers: {
          value: newCustomersCurrent || 0,
          prev: newCustomersPrev || 0,
          delta: pctDelta(newCustomersCurrent || 0, newCustomersPrev || 0),
        },
      },
      totals: {
        ordersAllTime: ordersAllTime || 0,
        productsActive: productsActive || 0,
        usersTotal: usersTotal || 0,
        pendingOrders: statusMap.get("pending") || 0,
        completedOrders: statusMap.get("completed") || 0,
        cancelledOrders: statusMap.get("cancelled") || 0,
        pendingReviews: pendingReviews || 0,
        lowStock: lowStock || 0,
      },
      salesByDay,
      salesByMonth: monthBuckets,
      statusBreakdown,
      paymentMix,
      topCategories,
      topProducts,
      customerLocations,
      recentOrders: recentOrders || [],
      recentReviews: recentReviews || [],
    };

    analyticsCache.set(range, { at: now, payload });
    res.set("X-Cache", "MISS");
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/categories", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new HttpError(500, "Failed to load categories", error.message);
    res.json({ items: data || [] });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [] });
    next(error);
  }
});

router.post("/admin/categories", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { error: valErr, value } = categorySchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid category", valErr.details);

    const { data, error } = await supabaseAdmin.from("categories").insert(value).select("*").single();
    if (error) {
      if (error.code === "23505") throw new HttpError(409, "Category name or slug already exists");
      throw new HttpError(500, "Failed to create category", error.message);
    }
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid category id");

    const { error: valErr, value } = categoryPatchSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid category patch", valErr.details);

    const { data, error } = await supabaseAdmin
      .from("categories")
      .update(value)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") throw new HttpError(409, "Category name or slug already exists");
      throw new HttpError(500, "Failed to update category", error.message);
    }
    if (!data) throw new HttpError(404, "Category not found");
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/categories/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid category id");

    const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
    if (error) throw new HttpError(500, "Failed to delete category", error.message);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/coupons", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new HttpError(500, "Failed to load coupons", error.message);
    res.json({ items: data || [] });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [] });
    next(error);
  }
});

router.post("/admin/coupons", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { error: valErr, value } = couponCreateSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid coupon", valErr.details);

    const { data, error } = await supabaseAdmin.from("coupons").insert(value).select("*").single();
    if (error) {
      if (error.code === "23505") throw new HttpError(409, "Coupon code already exists");
      throw new HttpError(500, "Failed to create coupon", error.message);
    }
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/admin/coupons/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid coupon id");

    const { error: valErr, value } = couponPatchSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid coupon patch", valErr.details);

    const { data, error } = await supabaseAdmin
      .from("coupons")
      .update(value)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") throw new HttpError(409, "Coupon code already exists");
      throw new HttpError(500, "Failed to update coupon", error.message);
    }
    if (!data) throw new HttpError(404, "Coupon not found");
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/coupons/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid coupon id");

    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);
    if (error) throw new HttpError(500, "Failed to delete coupon", error.message);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/reviews", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const status = req.query.status; // pending | approved | all

    let query = supabaseAdmin
      .from("reviews")
      .select("id, product_id, user_id, rating, comment, is_approved, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === "pending") query = query.eq("is_approved", false);
    else if (status === "approved") query = query.eq("is_approved", true);

    const { data, error, count } = await query;
    if (error) throw new HttpError(500, "Failed to load reviews", error.message);
    res.json({ items: data || [], total: count ?? 0 });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [], total: 0 });
    next(error);
  }
});

router.patch("/admin/reviews/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid review id");

    const reviewPatchSchema = Joi.object({
      is_approved: Joi.boolean().required(),
    });
    const { error: valErr, value } = reviewPatchSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid review patch", valErr.details);

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .update(value)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new HttpError(500, "Failed to update review", error.message);
    if (!data) throw new HttpError(404, "Review not found");
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete("/admin/reviews/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid review id");

    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);
    if (error) throw new HttpError(500, "Failed to delete review", error.message);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/invoice/:orderId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isFinite(orderId)) throw new HttpError(400, "Invalid order id");

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*,order_items(*)")
      .eq("id", orderId)
      .maybeSingle();
    if (error) throw new HttpError(500, "Failed to load order", error.message);
    if (!data) throw new HttpError(404, "Order not found");

    const pdfBuffer = await buildInvoicePdfBuffer(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${data.invoice_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

router.get("/admin/stock-report", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id,title,stock_qty,is_active")
      .order("stock_qty", { ascending: true });
    if (error) throw new HttpError(500, "Failed to load stock report", error.message);

    res.json({
      lowStock: (data || []).filter((item) => Number(item.stock_qty) > 0 && Number(item.stock_qty) <= 10),
      outOfStock: (data || []).filter((item) => Number(item.stock_qty) <= 0),
      all: data || [],
    });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ outOfStock: [], lowStock: [] });
    next(error);
  }
});

router.patch("/admin/orders/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isFinite(orderId)) throw new HttpError(400, "Invalid order id");

    const statusSchema = Joi.object({
      status: Joi.string()
        .valid(...ORDER_STATUSES)
        .required(),
    });
    const { error: valErr, value } = statusSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid status payload", valErr.details);

    const { data, error } = await supabaseRead(
      supabaseAdmin
        .from("orders")
        .update({ status: value.status })
        .eq("id", orderId)
        .select("*")
        .maybeSingle()
    );
    if (error) throw new HttpError(500, "Failed to update order status", error.message);
    if (!data) throw new HttpError(404, "Order not found");

    // §5.10 Customer SMS on key status changes — best-effort, logged.
    const phone = data.customer_phone;
    const message =
      value.status === "processing"
        ? `Your TWOWAY order ${data.order_number} is being processed.`
        : value.status === "completed"
          ? `Your TWOWAY order ${data.order_number} has been completed. Thank you for shopping with us!`
          : value.status === "cancelled"
            ? `Your TWOWAY order ${data.order_number} has been cancelled.`
            : null;

    if (phone && message) {
      sendSms(phone, message)
        .then((sms) =>
          supabaseAdmin.from("sms_logs").insert({
            order_id: data.id,
            phone,
            message,
            status: sms.ok ? "sent" : "failed",
            provider_message_id: sms.providerMessageId || null,
            error_message: sms.ok ? null : sms.reason,
          })
        )
        .catch(() => null);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

/* ───────────────────────── §6.1  Admin → Payments ─────────────────────────
 * GET  /admin/payments        – list payments (filters: status, method, q, range)
 * GET  /admin/payments/:id    – single payment with parent order
 * PATCH /admin/payments/:id   – {action: "refund" | "cod_collect" | "retry"}
 *
 * Method label is a UI concern; we surface both `provider` (raw) and
 * `method` (UI-friendly). COD/bank_transfer providers map to COD/BANK,
 * everything else maps to its provider name uppercased (PAYHERE, STRIPE).
 */
const PAYMENT_STATUSES = ["pending", "succeeded", "failed", "canceled", "refunded", "initiated"];

function paymentMethodLabel(provider) {
  const p = String(provider || "").toLowerCase();
  if (p === "cod") return "COD";
  if (p === "bank_transfer" || p === "bank") return "BANK";
  if (!p) return "OTHER";
  return p.toUpperCase();
}

router.get("/admin/payments", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const status = req.query.status ? String(req.query.status).toLowerCase() : null;
    const method = req.query.method ? String(req.query.method).toLowerCase() : null;
    const q = req.query.q ? String(req.query.q).trim() : null;

    if (status && !PAYMENT_STATUSES.includes(status)) {
      throw new HttpError(400, "Invalid status filter");
    }

    let query = supabaseAdmin
      .from("payments")
      .select(
        "id, order_id, provider, session_id, status, amount, currency, created_at, orders!inner(order_number, customer_name, customer_email, payment_method, status, payment_status)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (method) {
      // Translate UI label back to provider value for filtering.
      const map = { cod: "cod", bank: "bank_transfer", payhere: "payhere", stripe: "stripe" };
      const providerKey = map[method] || method;
      query = query.eq("provider", providerKey);
    }
    if (q) {
      // ilike on session_id (transaction ref) — order_number search is handled
      // server-side via or() once we land an FK-aware filter; for MVP we filter
      // q on session_id only and let the client filter joined fields.
      query = query.ilike("session_id", `%${q}%`);
    }

    const { data, error, count } = await query;
    if (error) throw new HttpError(500, "Failed to load payments", error.message);

    const items = (data || []).map((row) => ({
      id: row.id,
      orderId: row.order_id,
      orderNumber: row.orders?.order_number || null,
      customerName: row.orders?.customer_name || null,
      customerEmail: row.orders?.customer_email || null,
      method: paymentMethodLabel(row.provider),
      provider: row.provider,
      gateway: row.provider,
      status: row.status,
      amount: Number(row.amount || 0),
      currency: row.currency || "LKR",
      transactionRef: row.session_id,
      createdAt: row.created_at,
      orderStatus: row.orders?.status || null,
      orderPaymentStatus: row.orders?.payment_status || null,
    }));

    res.json({ items, total: count ?? 0 });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [], total: 0 });
    next(error);
  }
});

router.get("/admin/payments/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid payment id");

    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*, orders(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new HttpError(500, "Failed to load payment", error.message);
    if (!data) throw new HttpError(404, "Payment not found");

    res.json({
      id: data.id,
      orderId: data.order_id,
      method: paymentMethodLabel(data.provider),
      provider: data.provider,
      status: data.status,
      amount: Number(data.amount || 0),
      currency: data.currency || "LKR",
      transactionRef: data.session_id,
      createdAt: data.created_at,
      order: data.orders || null,
    });
  } catch (error) {
    next(error);
  }
});

const paymentActionSchema = Joi.object({
  action: Joi.string().valid("refund", "cod_collect", "retry").required(),
  note: Joi.string().max(500).allow("", null),
});

router.patch("/admin/payments/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, "Invalid payment id");

    const { error: valErr, value } = paymentActionSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid payment action", valErr.details);

    const { data: payment, error: loadErr } = await supabaseAdmin
      .from("payments")
      .select("*, orders(id, order_number, status, payment_status)")
      .eq("id", id)
      .maybeSingle();
    if (loadErr) throw new HttpError(500, "Failed to load payment", loadErr.message);
    if (!payment) throw new HttpError(404, "Payment not found");

    let nextPaymentStatus = payment.status;
    let nextOrderPaymentStatus = payment.orders?.payment_status || "pending";

    if (value.action === "refund") {
      if (payment.status !== "succeeded") {
        throw new HttpError(400, "Only paid (succeeded) payments can be refunded");
      }
      nextPaymentStatus = "refunded";
      nextOrderPaymentStatus = "refunded";
    } else if (value.action === "cod_collect") {
      if (payment.provider !== "cod") {
        throw new HttpError(400, "Only COD payments can be marked collected");
      }
      if (payment.status === "succeeded") {
        throw new HttpError(400, "Payment is already collected");
      }
      nextPaymentStatus = "succeeded";
      nextOrderPaymentStatus = "paid";
    } else if (value.action === "retry") {
      if (payment.status !== "failed") {
        throw new HttpError(400, "Only failed payments can be retried");
      }
      nextPaymentStatus = "pending";
      nextOrderPaymentStatus = "pending";
    }

    const { error: payUpdErr } = await supabaseAdmin
      .from("payments")
      .update({ status: nextPaymentStatus })
      .eq("id", id);
    if (payUpdErr) throw new HttpError(500, "Failed to update payment", payUpdErr.message);

    if (payment.order_id) {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: nextOrderPaymentStatus })
        .eq("id", payment.order_id);
    }

    res.json({ ok: true, payment_status: nextPaymentStatus, order_payment_status: nextOrderPaymentStatus });
  } catch (error) {
    next(error);
  }
});

/* ───────────────────────── §6.2  Admin → Stock Logs ─────────────────────────
 * GET  /admin/stock-movements    – list stock movements (filters: type, q, productId)
 * POST /admin/stock-movements    – admin manual adjustment; also updates products.stock_qty
 *
 * The order RPC already inserts `out` movements automatically; this endpoint
 * exposes the table as a feed plus admin-driven `in` / `adjustment` rows.
 */
const STOCK_MOVEMENT_TYPES = ["in", "out", "adjustment"];

const stockAdjustmentSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  movement_type: Joi.string().valid(...STOCK_MOVEMENT_TYPES).required(),
  quantity: Joi.number().integer().required(),
  reason: Joi.string().max(500).allow("", null),
}).custom((value, helpers) => {
  if (value.movement_type !== "adjustment" && value.quantity <= 0) {
    return helpers.error("any.invalid", { message: "Quantity must be positive for in/out movements" });
  }
  return value;
});

function mapStockMovement(row) {
  // The UI prefers a signed quantity: in/returned = +, out/sold = -, adjustment = as-is.
  const signed =
    row.movement_type === "out"
      ? -Math.abs(Number(row.quantity || 0))
      : Number(row.quantity || 0);

  // Derive a UI-friendly label: ADDED / SOLD / ADJUSTED / RETURNED, biased
  // by the reason field which is set by the order RPC (`Order ORD-…`).
  const reason = String(row.reason || "");
  let label = row.movement_type === "in" ? "ADDED" : row.movement_type === "out" ? "SOLD" : "ADJUSTED";
  if (/return/i.test(reason)) label = "RETURNED";
  if (/damage/i.test(reason)) label = "DAMAGED";

  return {
    id: row.id,
    productId: row.product_id,
    productName: row.products?.title || `Product #${row.product_id}`,
    sku: row.products?.id ? `SKU-${row.products.id}` : null, // products has no sku column yet
    type: label,
    movementType: row.movement_type,
    quantity: signed,
    reason: row.reason || null,
    createdAt: row.created_at,
  };
}

router.get("/admin/stock-movements", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const movementType = req.query.type ? String(req.query.type).toLowerCase() : null;
    const productId = req.query.product_id ? Number(req.query.product_id) : null;
    const q = req.query.q ? String(req.query.q).trim() : null;

    if (movementType && !STOCK_MOVEMENT_TYPES.includes(movementType)) {
      throw new HttpError(400, "Invalid movement type");
    }

    let query = supabaseAdmin
      .from("stock_movements")
      .select("id, product_id, movement_type, quantity, reason, created_at, products(id, title)", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (movementType) query = query.eq("movement_type", movementType);
    if (productId) query = query.eq("product_id", productId);
    if (q) query = query.ilike("reason", `%${q}%`);

    const { data, error, count } = await query;
    if (error) throw new HttpError(500, "Failed to load stock movements", error.message);

    res.json({ items: (data || []).map(mapStockMovement), total: count ?? 0 });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [], total: 0 });
    next(error);
  }
});

router.post("/admin/stock-movements", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { error: valErr, value } = stockAdjustmentSchema.validate(req.body, { abortEarly: false });
    if (valErr) throw new HttpError(400, "Invalid stock adjustment", valErr.details);

    const { data: product, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, title, stock_qty")
      .eq("id", value.product_id)
      .maybeSingle();
    if (prodErr) throw new HttpError(500, "Failed to load product", prodErr.message);
    if (!product) throw new HttpError(404, "Product not found");

    const delta =
      value.movement_type === "in"
        ? Math.abs(value.quantity)
        : value.movement_type === "out"
          ? -Math.abs(value.quantity)
          : value.quantity; // adjustment: signed

    const newStock = Math.max(0, Number(product.stock_qty || 0) + delta);

    const { data: movement, error: movErr } = await supabaseAdmin
      .from("stock_movements")
      .insert({
        product_id: value.product_id,
        movement_type: value.movement_type,
        quantity: Math.abs(value.quantity),
        reason: value.reason || `Admin ${value.movement_type}`,
      })
      .select("*, products(id, title)")
      .single();
    if (movErr) throw new HttpError(500, "Failed to record movement", movErr.message);

    const { error: stockErr } = await supabaseAdmin
      .from("products")
      .update({ stock_qty: newStock })
      .eq("id", value.product_id);
    if (stockErr) throw new HttpError(500, "Failed to update product stock", stockErr.message);

    res.status(201).json({
      ok: true,
      previousStock: Number(product.stock_qty || 0),
      newStock,
      movement: mapStockMovement(movement),
    });
  } catch (error) {
    next(error);
  }
});

/* ───────────────────────── §6.3  Admin → Sellers ─────────────────────────
 * GET  /admin/sellers      – list profiles enriched with order roll-ups
 * GET  /admin/sellers/:id  – single seller with their orders + reviews
 *
 * In this codebase "sellers" maps to `profiles` (every signed-up user). We
 * derive ordersCount, totalSales, lastOrder by aggregating `orders` joined
 * on user_id. status: active if a sale within 30 days, else inactive.
 * isRepeat: ordersCount >= 2.
 */
const SELLER_ACTIVE_WINDOW_MS = 30 * 86_400_000;

router.get("/admin/sellers", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const q = req.query.q ? String(req.query.q).trim().toLowerCase() : null;
    const filter = req.query.filter ? String(req.query.filter).toLowerCase() : "all";

    const [{ data: profiles, error: profErr }, { data: orderRows, error: ordErr }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, full_name, phone, role, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("orders")
          .select("user_id, total_amount, created_at, customer_email"),
      ]);

    if (profErr) throw new HttpError(500, "Failed to load profiles", profErr.message);
    if (ordErr) throw new HttpError(500, "Failed to load order roll-ups", ordErr.message);

    const aggMap = new Map();
    for (const o of orderRows || []) {
      const slot = aggMap.get(o.user_id) || {
        ordersCount: 0,
        totalSpent: 0,
        lastOrder: null,
        emailFromOrders: null,
      };
      slot.ordersCount += 1;
      slot.totalSpent += Number(o.total_amount || 0);
      const ts = new Date(o.created_at).getTime();
      if (!slot.lastOrder || ts > new Date(slot.lastOrder).getTime()) slot.lastOrder = o.created_at;
      if (!slot.emailFromOrders && o.customer_email) slot.emailFromOrders = o.customer_email;
      aggMap.set(o.user_id, slot);
    }

    const now = Date.now();
    let items = (profiles || []).map((p) => {
      const a = aggMap.get(p.id) || { ordersCount: 0, totalSpent: 0, lastOrder: null, emailFromOrders: null };
      const lastTs = a.lastOrder ? new Date(a.lastOrder).getTime() : null;
      const status = lastTs && now - lastTs < SELLER_ACTIVE_WINDOW_MS ? "active" : "inactive";
      return {
        id: p.id,
        name: p.full_name || "Unknown seller",
        email: a.emailFromOrders, // populated lazily; admin can edit on profile page
        phone: p.phone || null,
        storeName: null, // dedicated storeName column doesn't exist yet
        role: p.role || "customer",
        joinedAt: p.created_at,
        ordersCount: a.ordersCount,
        totalSpent: a.totalSpent,
        avgOrderValue: a.ordersCount ? a.totalSpent / a.ordersCount : 0,
        lastOrder: a.lastOrder,
        status,
        isRepeat: a.ordersCount >= 2,
      };
    });

    if (q) {
      items = items.filter((s) => {
        const hay = `${s.name} ${s.email || ""} ${s.phone || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (filter === "active") items = items.filter((s) => s.status === "active");
    else if (filter === "inactive") items = items.filter((s) => s.status === "inactive");
    else if (filter === "repeat") items = items.filter((s) => s.isRepeat);

    const total = items.length;
    items = items.slice(offset, offset + limit);

    res.json({ items, total });
  } catch (error) {
    if (isTableMissing(error)) return res.json({ items: [], total: 0 });
    next(error);
  }
});

router.get("/admin/sellers/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    if (!id) throw new HttpError(400, "Invalid seller id");

    const [{ data: profile, error: profErr }, { data: orderRows, error: ordErr }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, full_name, phone, role, created_at")
          .eq("id", id)
          .maybeSingle(),
        supabaseAdmin
          .from("orders")
          .select("id, order_number, total_amount, status, payment_status, created_at, customer_email")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    if (profErr) throw new HttpError(500, "Failed to load profile", profErr.message);
    if (ordErr) throw new HttpError(500, "Failed to load orders", ordErr.message);
    if (!profile) throw new HttpError(404, "Seller not found");

    const ordersList = orderRows || [];
    const totalSpent = ordersList.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const lastOrder = ordersList[0]?.created_at || null;
    const lastTs = lastOrder ? new Date(lastOrder).getTime() : null;
    const status = lastTs && Date.now() - lastTs < SELLER_ACTIVE_WINDOW_MS ? "active" : "inactive";

    // Best-effort: pull related reviews authored by this user, scoped to
    // products with at least one approved or pending review row.
    let reviews = [];
    try {
      const { data: revs } = await supabaseAdmin
        .from("reviews")
        .select("id, product_id, rating, comment, is_approved, created_at, products(title)")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      reviews = (revs || []).map((r) => ({
        id: r.id,
        productId: r.product_id,
        productName: r.products?.title || `Product #${r.product_id}`,
        rating: r.rating,
        comment: r.comment,
        isApproved: r.is_approved,
        createdAt: r.created_at,
      }));
    } catch {
      reviews = [];
    }

    res.json({
      seller: {
        id: profile.id,
        name: profile.full_name || "Unknown seller",
        email: ordersList[0]?.customer_email || null,
        phone: profile.phone || null,
        storeName: null,
        role: profile.role || "customer",
        joinedAt: profile.created_at,
        ordersCount: ordersList.length,
        totalSpent,
        avgOrderValue: ordersList.length ? totalSpent / ordersList.length : 0,
        lastOrder,
        status,
        isRepeat: ordersList.length >= 2,
      },
      orders: ordersList.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        totalAmount: Number(o.total_amount || 0),
        status: o.status,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
      })),
      reviews,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
