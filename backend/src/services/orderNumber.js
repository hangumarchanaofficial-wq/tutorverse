import { randomUUID } from "crypto";

function suffix() {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

/**
 * Collision-resistant identifiers. Date.now() alone collides under
 * concurrency and the unique constraints on orders.order_number /
 * invoice_number would surface that as a 500 to the customer.
 */
export function generateOrderNumber() {
  return `TW-${Date.now()}-${suffix()}`;
}

export function generateInvoiceNumber() {
  return `INV-${Date.now()}-${suffix()}`;
}
