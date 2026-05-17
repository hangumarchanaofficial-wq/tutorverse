import { apiFetch } from "../lib/apiClient";

export function validateCoupon(code) {
  return apiFetch("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function createOrder(payload, { idempotencyKey } = {}) {
  return apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
  });
}

export function syncCart(items) {
  return apiFetch("/cart/sync", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export function syncWishlist(items) {
  return apiFetch("/wishlist/sync", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
