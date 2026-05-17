import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  PageHeader, StatusBadge, Select, Input, Btn, useToast,
  formatLkr, fmtDate,
} from "../../admin/components/ui";
import { invoices } from "../../admin/data/mockData";

const STATUS_OPTIONS = ["ALL", "generated", "sent", "paid", "overdue", "cancelled"];

export default function InvoicesList() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (statusFilter !== "ALL") list = list.filter((inv) => inv.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.orderNumber?.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [statusFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        badge={<span className="rounded-full bg-[#d8b84f]/15 px-2.5 py-0.5 text-xs font-semibold text-[#d8b84f]">{invoices.length}</span>}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Input placeholder="Search invoice #, order, customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-40">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s === "ALL" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1) }))}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#263145] bg-[#121b2e]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
            <tr>
              <th className="px-4 py-3">Invoice No</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263145]/60">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-sm text-[#8b95a7]">No invoices found</td></tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="transition hover:bg-[#182238]">
                  <td className="px-4 py-3 font-semibold text-[#d8b84f] font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${inv.orderId}`} className="text-[#60a5fa] hover:underline">{inv.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-[#f8fafc]">{inv.customerName}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-[#f8fafc] whitespace-nowrap">{formatLkr(inv.amount)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-[#182238] px-2 py-0.5 text-[11px] font-medium text-[#8b95a7]">{inv.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-xs text-[#8b95a7] whitespace-nowrap">{fmtDate(inv.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Btn variant="ghost" size="xs" onClick={() => toast?.("PDF generated")}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        PDF
                      </Btn>
                      <Btn variant="ghost" size="xs" onClick={() => toast?.("Invoice downloaded")}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </Btn>
                      <Btn variant="ghost" size="xs" onClick={() => toast?.("Printing…")}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      </Btn>
                      <Btn variant="ghost" size="xs" onClick={() => toast?.("Invoice sent to customer")}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
