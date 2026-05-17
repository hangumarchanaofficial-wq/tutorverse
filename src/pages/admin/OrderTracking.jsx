import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { orders as mockOrders } from "../../admin/data/mockData";

const CARRIER = ["CityExpress", "Prompt Logistics", "Lanka Post", "DHL", "—"];

export default function OrderTracking() {
  const rows = useMemo(
    () =>
      [...mockOrders].map((o, i) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.customerName,
        status: o.orderStatus,
        carrier: CARRIER[i % CARRIER.length],
        updated: o.updatedAt || o.createdAt,
      })),
    []
  );

  return (
    <div className="space-y-5 admin-products-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-[#f8fafc]">Order Tracking</h1>
        <p className="text-xs text-[#98a2b3] sm:text-right">
          Dashboard &gt; Order &gt; Order Tracking
        </p>
      </div>

      <div className="admin-panel overflow-hidden rounded-2xl border border-[#1f232b] bg-[#06070a]">
        <div className="border-b border-[#1f232b] px-4 py-3">
          <p className="text-sm text-[#98a2b3]">
            Shipment and status overview. Open an order for full timeline and notes.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table min-w-full text-left text-sm">
            <thead className="bg-[#090b10] text-[11px] font-semibold text-[#98a2b3]">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Carrier</th>
                <th className="px-4 py-3 font-medium">Last update</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#1f232b] odd:bg-[#06070a] even:bg-[#111319] hover:bg-[#141822]"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-[#fe7a2f]">{r.orderNumber}</td>
                  <td className="px-4 py-2.5 text-[#e5e7eb]">{r.customer}</td>
                  <td className="px-4 py-2.5 text-[#c1c7d0]">{r.status}</td>
                  <td className="px-4 py-2.5 text-[#98a2b3]">{r.carrier}</td>
                  <td className="px-4 py-2.5 text-xs text-[#8b95a7]">
                    {r.updated?.slice?.(0, 16)?.replace("T", " ") ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      to={`/admin/orders/${r.id}`}
                      className="text-xs font-semibold text-[#fe7a2f] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
