import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  StatusBadge, OrderTimeline, ProductThumbnail,
  ConfirmDialog, Skeleton, Select, Btn, useToast,
  formatLkr, fmtDateTime,
} from "../../admin/components/ui";
import { orders as mockOrders } from "../../admin/data/mockData";
import { fetchAdminOrder, updateAdminOrderStatus, downloadAdminInvoice } from "../../services/adminApi";

const STATUS_OPTIONS = [
  { value: "PLACED", label: "Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

function Card({ title, badge, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-[#263145] bg-[#121b2e] p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">{title}</h2>
        {badge}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function normalizeMock(o) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    status: o.orderStatus,
    payment_status: o.paymentStatus,
    payment_method: o.paymentMethod,
    customer_name: o.customerName,
    customer_email: o.customerEmail,
    customer_phone: o.customerPhone,
    shipping_address: o.shippingAddress,
    total_amount: o.totalAmount,
    subtotal_amount: o.subtotal,
    discount_amount: o.discount,
    shipping_amount: o.shipping,
    coupon_code: o.couponCode,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    order_items: (o.items || []).map((it, idx) => ({
      id: idx,
      product_id: it.productId,
      product_title: it.name,
      product_image: it.image,
      quantity: it.qty,
      unit_price: it.price,
      line_total: it.price * it.qty,
      selected_size: null,
      selected_color: null,
    })),
    invoice_number: null,
    shipping_payload: {},
  };
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const notesKey = `admin-order-notes-${id}`;
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(notesKey);
    if (stored) setNotes(stored);
  }, [notesKey]);

  useEffect(() => {
    if (id) localStorage.setItem("admin-last-order-view", id);
  }, [id]);

  const saveNotes = () => {
    localStorage.setItem(notesKey, notes);
    setNotesSaved(true);
    toast?.("Notes saved");
    setTimeout(() => setNotesSaved(false), 2000);
  };

  useEffect(() => {
    let on = true;
    setLoading(true);
    setError("");
    fetchAdminOrder(id)
      .then((data) => {
        if (!on) return;
        setOrder(data);
        setStatus(data.status || data.orderStatus || "PLACED");
      })
      .catch(() => {
        if (!on) return;
        const mock = mockOrders.find((o) => o.id === id);
        if (mock) {
          const normalized = normalizeMock(mock);
          setOrder(normalized);
          setStatus(normalized.status);
        } else {
          setError("Order not found");
        }
      })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [id]);

  const downloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const blob = await downloadAdminInvoice(order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.invoice_number || order.order_number || `order-${order.id}`}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast?.("Invoice download failed", "error");
    } finally {
      setDownloading(false);
    }
  };

  const saveStatus = async () => {
    if (!order || status === (order.status || order.orderStatus)) return;
    setSaving(true);
    try {
      const updated = await updateAdminOrderStatus(order.id, status);
      setOrder((prev) => ({ ...prev, ...updated, status }));
      toast?.("Order status updated");
      setShowConfirm(false);
    } catch {
      setOrder((prev) => ({ ...prev, status }));
      toast?.("Status updated locally", "warning");
      setShowConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  const copyOrderNumber = useCallback(() => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_number || order.orderNumber || "").then(() => {
      setCopied(true);
      toast?.("Order number copied");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [order, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#f87171]/20 bg-[#f87171]/10 px-4 py-3 text-sm text-[#f87171]">{error}</div>
        <Link to="/admin/orders" className="text-sm font-semibold text-[#d8b84f] hover:underline">← Back to orders</Link>
      </div>
    );
  }

  if (!order) return null;

  const orderNum = order.order_number || order.orderNumber || `#${order.id}`;
  const currentStatus = order.status || order.orderStatus || "PLACED";
  const ship = order.shipping_payload || {};
  const items = order.order_items || [];

  const timeline = [
    { label: "Order placed", time: order.created_at || order.createdAt, active: true },
    { label: "Confirmed", time: ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(currentStatus) ? order.updated_at || order.updatedAt : null, active: ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(currentStatus) },
    { label: "Processing", time: ["PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(currentStatus) ? order.updated_at || order.updatedAt : null, active: ["PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].includes(currentStatus) },
    { label: "Packed", time: ["PACKED", "SHIPPED", "DELIVERED"].includes(currentStatus) ? order.updated_at || order.updatedAt : null, active: ["PACKED", "SHIPPED", "DELIVERED"].includes(currentStatus) },
    { label: "Shipped", time: ["SHIPPED", "DELIVERED"].includes(currentStatus) ? order.updated_at || order.updatedAt : null, active: ["SHIPPED", "DELIVERED"].includes(currentStatus) },
    { label: "Delivered", time: currentStatus === "DELIVERED" ? order.updated_at || order.updatedAt : null, active: currentStatus === "DELIVERED" },
    ...(currentStatus === "CANCELLED" ? [{ label: "Cancelled", time: order.updated_at || order.updatedAt, active: true }] : []),
  ];

  return (
    <>
      <style>{`@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`}</style>

      <ConfirmDialog
        open={showConfirm}
        title="Update order status"
        message={`Change status from "${currentStatus}" to "${status}"? This action will be reflected immediately.`}
        confirmLabel={saving ? "Updating…" : "Confirm"}
        onConfirm={saveStatus}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="print-area space-y-6">
        {/* Breadcrumb + Header */}
        <div className="no-print">
          <div className="flex items-center gap-2 text-xs text-[#8b95a7]">
            <Link to="/admin/orders" className="font-semibold text-[#d8b84f] hover:underline">Orders</Link>
            <span>/</span>
            <span className="text-[#f8fafc]">{orderNum}</span>
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#f8fafc]">{orderNum}</h1>
              <button
                onClick={copyOrderNumber}
                className="rounded-lg border border-[#263145] p-1.5 text-[#8b95a7] transition hover:bg-[#182238] hover:text-[#f8fafc]"
                title="Copy order number"
              >
                {copied ? (
                  <svg className="h-4 w-4 text-[#34d399]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
              </button>
              <StatusBadge status={currentStatus} />
              <StatusBadge status={order.payment_status || order.paymentStatus} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn variant="secondary" onClick={() => window.print()}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print
              </Btn>
              <Btn variant="secondary" onClick={downloadInvoice} disabled={downloading}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {downloading ? "Preparing…" : "Invoice"}
              </Btn>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#8b95a7]">
            <span className="font-mono">ID {order.id}</span>
            {(order.invoice_number) && <> · Invoice <span className="font-mono">{order.invoice_number}</span></>}
            {(order.created_at || order.createdAt) && <> · Placed {fmtDateTime(order.created_at || order.createdAt)}</>}
          </p>
        </div>

        {/* Order Pipeline */}
        <Card title="Order Pipeline" className="no-print">
          <OrderTimeline currentStatus={currentStatus} />
        </Card>

        {/* Status Update */}
        <Card title="Update Status" className="no-print">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>
            <Btn
              variant="primary"
              size="md"
              disabled={saving || status === currentStatus}
              onClick={() => setShowConfirm(true)}
            >
              {saving ? "Saving…" : "Save status"}
            </Btn>
          </div>
        </Card>

        {/* Customer + Payment + Shipping */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Customer">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-[#d8b84f]/10 text-lg font-bold text-[#d8b84f]">
                {((order.customer_name || order.customerName || "?")[0]).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#f8fafc]">{order.customer_name || order.customerName}</p>
                <p className="text-sm text-[#8b95a7]">{order.customer_email || order.customerEmail}</p>
                {(order.customer_phone || order.customerPhone) && (
                  <p className="text-sm text-[#8b95a7]">{order.customer_phone || order.customerPhone}</p>
                )}
              </div>
            </div>
          </Card>

          <Card title="Payment Summary">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#8b95a7]">Method</dt>
                <dd className="font-medium text-[#f8fafc]">{order.payment_method || order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8b95a7]">Payment</dt>
                <dd><StatusBadge status={order.payment_status || order.paymentStatus} /></dd>
              </div>
              <div className="h-px bg-[#263145]" />
              <div className="flex justify-between">
                <dt className="text-[#8b95a7]">Subtotal</dt>
                <dd className="text-[#f8fafc]">{formatLkr(order.subtotal_amount ?? order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8b95a7]">Shipping</dt>
                <dd className="text-[#f8fafc]">{formatLkr(order.shipping_amount ?? order.shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8b95a7]">Discount</dt>
                <dd className="text-[#f8fafc]">-{formatLkr(order.discount_amount ?? order.discount)}</dd>
              </div>
              <div className="h-px bg-[#263145]" />
              <div className="flex justify-between text-base font-bold">
                <dt className="text-[#f8fafc]">Total</dt>
                <dd className="text-[#d8b84f]">{formatLkr(order.total_amount ?? order.totalAmount)}</dd>
              </div>
            </dl>
            {(order.coupon_code || order.couponCode) && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#d8b84f]/10 px-3 py-2">
                <svg className="h-4 w-4 text-[#d8b84f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                <span className="font-mono text-xs font-semibold text-[#d8b84f]">{order.coupon_code || order.couponCode}</span>
              </div>
            )}
          </Card>

          <Card title="Shipping">
            <div className="space-y-3">
              <div className="rounded-lg border border-[#263145] bg-[#182238] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8b95a7]">Delivery address</p>
                <p className="mt-1 text-sm text-[#f8fafc]">{order.shipping_address || order.shippingAddress || "—"}</p>
              </div>
              {ship && Object.keys(ship).length > 0 && (
                <pre className="max-h-32 overflow-auto rounded-lg border border-[#263145] bg-[#182238] p-3 text-xs text-[#8b95a7] font-mono">
                  {JSON.stringify(ship, null, 2)}
                </pre>
              )}
            </div>
          </Card>
        </div>

        {/* Line Items */}
        <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
          <div className="flex items-center justify-between border-b border-[#263145] px-5 py-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">Line items</h2>
            <span className="rounded-full bg-[#182238] px-2.5 py-0.5 text-[10px] font-semibold text-[#8b95a7]">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                <tr>
                  <th className="px-5 py-2.5">Product</th>
                  <th className="px-5 py-2.5">Qty</th>
                  <th className="px-5 py-2.5">Unit Price</th>
                  <th className="px-5 py-2.5">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263145]/60">
                {items.map((row) => (
                  <tr key={row.id} className="transition hover:bg-[#182238]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail src={row.product_image} alt={row.product_title} />
                        <div>
                          <span className="font-medium text-[#f8fafc]">{row.product_title}</span>
                          <span className="ml-2 text-[11px] text-[#8b95a7]">#{row.product_id}</span>
                          {(row.selected_size || row.selected_color) && (
                            <span className="mt-0.5 block text-xs text-[#8b95a7]">
                              {[row.selected_size, row.selected_color].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-[#f8fafc]">{row.quantity}</td>
                    <td className="px-5 py-3 tabular-nums text-[#8b95a7]">{formatLkr(row.unit_price)}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-[#f8fafc]">{formatLkr(row.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Timeline */}
        <Card title="Activity Timeline">
          <div className="space-y-0">
            {timeline.map((evt, idx) => (
              <div key={evt.label} className="relative flex gap-4 pb-6 last:pb-0">
                {idx < timeline.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-px bg-[#263145]" />
                )}
                <div className={`relative flex h-6 w-6 flex-none items-center justify-center rounded-full ${evt.active ? "bg-[#34d399]/20" : "bg-[#263145]"}`}>
                  <div className={`h-2 w-2 rounded-full ${evt.active ? "bg-[#34d399]" : "bg-[#8b95a7]/40"}`} />
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={`text-sm font-medium ${evt.active ? "text-[#f8fafc]" : "text-[#8b95a7]/50"}`}>{evt.label}</p>
                  <p className="text-xs text-[#8b95a7]">
                    {evt.time ? fmtDateTime(evt.time) : "Pending"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Admin Notes */}
        <Card title="Internal Notes" badge={notesSaved && <span className="text-xs font-medium text-[#34d399]">Saved!</span>} className="no-print">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes about this order…"
            rows={4}
            className="w-full rounded-lg border border-[#263145] bg-[#182238] px-4 py-3 text-sm text-[#f8fafc] placeholder-[#8b95a7]/50 transition focus:border-[#d8b84f]/60 focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <Btn variant="secondary" onClick={saveNotes}>Save notes</Btn>
          </div>
        </Card>
      </div>
    </>
  );
}
