import { apiFetch } from "../lib/apiClient";

/* ── profile ── */
export function fetchMe() {
  return apiFetch("/me");
}

export function patchMe(payload) {
  return apiFetch("/me", { method: "PATCH", body: JSON.stringify(payload) });
}

/* ── orders ── */
export function fetchMyOrders() {
  return apiFetch("/orders/my");
}

export function fetchMyOrder(id) {
  return apiFetch(`/orders/${id}`);
}

export function downloadMyInvoice(orderId) {
  return apiFetch(`/invoice/${orderId}`); // returns Blob
}

/* ── reviews ── */
export function submitReview({ productId, rating, comment }) {
  return apiFetch("/reviews", {
    method: "POST",
    body: JSON.stringify({
      product_id: Number(productId),
      rating: Number(rating),
      comment: comment || "",
    }),
  });
}

export function fetchProductReviews(productId, { limit = 50, offset = 0 } = {}) {
  const sp = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiFetch(`/products/${productId}/reviews?${sp.toString()}`);
}

/* ── cart / wishlist hydration ── */
export function fetchServerCart() {
  return apiFetch("/cart");
}

export function fetchServerWishlist() {
  return apiFetch("/wishlist");
}
