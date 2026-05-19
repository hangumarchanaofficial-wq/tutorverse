import { apiFetch } from "../lib/apiClient";
import { toApiOrderStatus } from "../lib/orderStatus";

function withSearchParams(path, params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `${path}?${s}` : path;
}

/* ─── analytics ─── */
export function fetchAdminAnalytics({ range = "30d", fresh = false } = {}) {
  const qs = new URLSearchParams();
  if (range) qs.set("range", range);
  if (fresh) qs.set("fresh", "1");
  const suffix = qs.toString();
  return apiFetch(`/admin/analytics${suffix ? `?${suffix}` : ""}`);
}

/* ─── orders ─── */
export function fetchAdminOrders(params) {
  return apiFetch(withSearchParams("/admin/orders", params));
}

export function fetchAdminOrder(id) {
  return apiFetch(`/admin/orders/${id}`);
}

export function updateAdminOrderStatus(id, status) {
  return apiFetch(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: toApiOrderStatus(status) }),
  });
}

export function downloadAdminInvoice(orderId) {
  return apiFetch(`/admin/invoice/${orderId}`); // returns Blob
}

/* ─── stock ─── */
export function fetchAdminStockReport() {
  return apiFetch("/admin/stock-report");
}

/* ─── products ─── */
export function fetchAdminProducts(params) {
  return apiFetch(withSearchParams("/admin/products", params));
}

export function createAdminProduct(payload) {
  return apiFetch("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function patchAdminProduct(id, payload) {
  return apiFetch(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminProduct(id) {
  return apiFetch(`/admin/products/${id}`, { method: "DELETE" });
}

export function importAdminProducts(items) {
  return apiFetch("/admin/products/import", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

/* ─── categories ─── */
export function fetchAdminCategories() {
  return apiFetch("/admin/categories");
}

export function createAdminCategory(payload) {
  return apiFetch("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function patchAdminCategory(id, payload) {
  return apiFetch(`/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminCategory(id) {
  return apiFetch(`/admin/categories/${id}`, { method: "DELETE" });
}

/* ─── coupons ─── */
export function fetchAdminCoupons() {
  return apiFetch("/admin/coupons");
}

export function createAdminCoupon(payload) {
  return apiFetch("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function patchAdminCoupon(id, payload) {
  return apiFetch(`/admin/coupons/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminCoupon(id) {
  return apiFetch(`/admin/coupons/${id}`, { method: "DELETE" });
}

/* ─── reviews ─── */
export function fetchAdminReviews(params) {
  return apiFetch(withSearchParams("/admin/reviews", params));
}

export function setAdminReviewApproval(id, isApproved) {
  return apiFetch(`/admin/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_approved: isApproved }),
  });
}

export function deleteAdminReview(id) {
  return apiFetch(`/admin/reviews/${id}`, { method: "DELETE" });
}

/* ─── payments ─── */
export function fetchAdminPayments(params) {
  return apiFetch(withSearchParams("/admin/payments", params));
}

export function fetchAdminPayment(id) {
  return apiFetch(`/admin/payments/${id}`);
}

export function updateAdminPayment(id, action, note) {
  return apiFetch(`/admin/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action, note }),
  });
}

/* ─── stock movements ─── */
export function fetchAdminStockMovements(params) {
  return apiFetch(withSearchParams("/admin/stock-movements", params));
}

export function createAdminStockAdjustment(payload) {
  return apiFetch("/admin/stock-movements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ─── sellers ─── */
export function fetchAdminSellers(params) {
  return apiFetch(withSearchParams("/admin/sellers", params));
}

export function fetchAdminSeller(id) {
  return apiFetch(`/admin/sellers/${id}`);
}
