import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  FileCheck,
  FileText,
  Mail,
  Printer,
  Search,
  Send,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Select,
  Input,
  Skeleton,
  SkeletonRows,
  useToast,
  formatLkr,
  fmtDate,
} from "../../admin/components/ui";
import { invoices as mockInvoices } from "../../admin/data/mockData";
import { downloadAdminInvoice } from "../../services/adminApi";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["ALL", "generated", "sent", "paid", "overdue", "cancelled"];
const METHOD_OPTIONS = ["ALL", "PAYHERE", "STRIPE", "COD"];
const cardIconClass = "h-[18px] w-[18px]";

const METHOD_STYLES = {
  PAYHERE: "bg-[#d8b84f]/15 text-[#d8b84f]",
  STRIPE: "bg-[#a78bfa]/15 text-[#a78bfa]",
  COD: "bg-[#8b95a7]/15 text-[#8b95a7]",
};

function PaymentMethodBadge({ method }) {
  const style = METHOD_STYLES[method] || "bg-[#8b95a7]/15 text-[#8b95a7]";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style}`}>
      {method || "—"}
    </span>
  );
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return url;
}

export default function InvoicesList() {
  const toast = useToast();
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState(null);
  const [printUrl, setPrintUrl] = useState(null);

  useEffect(() => {
    let on = true;
    setLoading(true);
    const t = setTimeout(() => {
      if (on) {
        setAllInvoices(mockInvoices);
        setLoading(false);
      }
    }, 280);
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (printUrl) URL.revokeObjectURL(printUrl);
    };
  }, [printUrl]);

  const counts = useMemo(() => {
    const m = { total: allInvoices.length };
    allInvoices.forEach((inv) => {
      m[inv.status] = (m[inv.status] || 0) + 1;
    });
    return m;
  }, [allInvoices]);

  const filtered = useMemo(() => {
    let list = [...allInvoices];
    if (statusFilter !== "ALL") list = list.filter((inv) => inv.status === statusFilter);
    if (methodFilter !== "ALL") list = list.filter((inv) => inv.paymentMethod === methodFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoiceNumber?.toLowerCase().includes(q) ||
          inv.orderNumber?.toLowerCase().includes(q) ||
          inv.customerName?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allInvoices, statusFilter, methodFilter, search]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, methodFilter, search]);

  const setStatusQuick = useCallback((status) => {
    setStatusFilter((prev) => (prev === status ? "ALL" : status));
  }, []);

  const downloadPdf = async (inv) => {
    setDownloadingId(inv.id);
    try {
      const blob = await downloadAdminInvoice(inv.orderId);
      triggerBlobDownload(blob, `${inv.invoiceNumber || `invoice-${inv.orderId}`}.pdf`);
      toast?.("Invoice downloaded");
    } catch {
      toast?.("Invoice download failed — order may not exist in the database yet", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const printInvoice = async (inv) => {
    setDownloadingId(inv.id);
    try {
      const blob = await downloadAdminInvoice(inv.orderId);
      if (printUrl) URL.revokeObjectURL(printUrl);
      const url = URL.createObjectURL(blob);
      setPrintUrl(url);
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) toast?.("Allow pop-ups to print the invoice", "warning");
    } catch {
      toast?.("Could not open invoice for printing", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const actionBtnClass =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#263145] text-[#8b95a7] transition hover:border-[#d8b84f]/50 hover:text-[#d8b84f] disabled:cursor-not-allowed disabled:opacity-40";

  const renderInvoiceActions = (inv, busy) => (
    <div className="flex gap-1">
      <button
        type="button"
        title="Download PDF"
        disabled={busy}
        onClick={() => downloadPdf(inv)}
        className={actionBtnClass}
      >
        <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
      <Link to={`/admin/orders/${inv.orderId}`} title="View order" className={actionBtnClass}>
        <Eye className="h-3.5 w-3.5" strokeWidth={2.2} />
      </Link>
      <button
        type="button"
        title="Print"
        disabled={busy}
        onClick={() => printInvoice(inv)}
        className={actionBtnClass}
      >
        <Printer className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
      <button
        type="button"
        title="Email to customer"
        onClick={() => toast?.(`Invoice ${inv.invoiceNumber} queued for email (demo)`)}
        className={actionBtnClass}
      >
        <Mail className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
    </div>
  );

  return (
    <div className="admin-products-page space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="View and download order invoices"
        badge={
          <span className="rounded-full bg-[#d8b84f]/15 px-2.5 py-0.5 text-xs font-semibold text-[#d8b84f]">
            {allInvoices.length}
          </span>
        }
        actions={
          <div className="rounded-lg border border-[#263145] bg-[#121b2e] px-3 py-2 text-xs">
            <span className="text-[#8b95a7]">Filtered total </span>
            <span className="font-semibold tabular-nums text-[#f8fafc]">{formatLkr(filteredTotal)}</span>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total invoices"
            value={counts.total || 0}
            icon={<FileText className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusFilter("ALL")}
          />
          <StatCard
            label="Generated"
            value={counts.generated || 0}
            icon={<FileCheck className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("generated")}
          />
          <StatCard
            label="Sent"
            value={counts.sent || 0}
            icon={<Send className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("sent")}
          />
          <StatCard
            label="Overdue"
            value={counts.overdue || 0}
            variant="danger"
            icon={<AlertCircle className={cardIconClass} strokeWidth={2.2} />}
            onClick={() => setStatusQuick("overdue")}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative min-w-0 w-full flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b95a7]" />
          <Input
            className="pl-9"
            placeholder="Search invoice #, order, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS.map((s) => ({
              value: s,
              label: s === "ALL" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            label="Method"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            options={METHOD_OPTIONS.map((m) => ({
              value: m,
              label: m === "ALL" ? "All methods" : m,
            }))}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e] shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
        {/* Mobile: invoice, customer, amount, status, actions */}
        <ul className="divide-y divide-[#263145]/60 md:hidden">
          {loading ? (
            Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="space-y-2 px-4 py-3">
                <div className="flex justify-between gap-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-8 w-full max-w-[180px]" />
              </li>
            ))
          ) : paged.length === 0 ? (
            <li className="px-4 py-14 text-center">
              <p className="text-sm font-medium text-[#f8fafc]">No invoices match your filters</p>
              <p className="mt-1 text-xs text-[#8b95a7]">Try a different status or clear the search.</p>
            </li>
          ) : (
            paged.map((inv) => {
              const busy = downloadingId === inv.id;
              return (
                <li key={inv.id} className="space-y-2 px-4 py-3 transition hover:bg-[#182238]/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-[#d8b84f]">{inv.invoiceNumber}</p>
                      <p className="mt-0.5 truncate text-sm font-medium text-[#f8fafc]">{inv.customerName}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={inv.status} />
                      <p className="text-sm font-semibold tabular-nums text-[#f8fafc]">{formatLkr(inv.amount)}</p>
                    </div>
                  </div>
                  {renderInvoiceActions(inv, busy)}
                </li>
              );
            })
          )}
        </ul>

        {/* Desktop: full table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="admin-table min-w-full text-left text-sm">
            <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice No</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263145]/60">
              {loading ? (
                <SkeletonRows cols={8} rows={8} />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <p className="text-sm font-medium text-[#f8fafc]">No invoices match your filters</p>
                    <p className="mt-1 text-xs text-[#8b95a7]">Try a different status or clear the search.</p>
                  </td>
                </tr>
              ) : (
                paged.map((inv) => {
                  const busy = downloadingId === inv.id;
                  return (
                    <tr key={inv.id} className="transition hover:bg-[#182238]/60">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#d8b84f]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${inv.orderId}`}
                          className="font-mono text-xs text-[#60a5fa] hover:underline"
                        >
                          {inv.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#f8fafc]">{inv.customerName}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[#f8fafc]">
                        {formatLkr(inv.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentMethodBadge method={inv.paymentMethod} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#8b95a7]">
                        {fmtDate(inv.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">{renderInvoiceActions(inv, busy)}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="admin-table-pagination border-t border-[#263145]">
            <span className="text-xs font-medium text-[#8b95a7]">
              Show data{" "}
              <span className="mx-2 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
              of {filtered.length}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const navItems =
                  totalPages <= 5
                    ? Array.from({ length: totalPages }, (_, i) => i + 1)
                    : page <= 3
                      ? [1, 2, 3, "end-gap", totalPages]
                      : page >= totalPages - 2
                        ? [1, "start-gap", totalPages - 2, totalPages - 1, totalPages]
                        : [1, "start-gap", page - 1, page, page + 1, "end-gap", totalPages];

                const navButtonClass =
                  "flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
                const ghostStyle =
                  "border-[#263145] bg-[#0f1726] text-[#8b95a7] shadow-sm hover:border-[#d8b84f]/50 hover:bg-[#182238] hover:text-[#f8fafc]";
                const activeStyle =
                  "border-[#d8b84f] bg-[#d8b84f] text-[#070b14] shadow-[0_8px_18px_rgba(216,184,79,0.24)]";

                return (
                  <>
                    <button
                      type="button"
                      aria-label="First page"
                      disabled={page <= 1}
                      onClick={() => setPage(1)}
                      className={`${navButtonClass} ${ghostStyle}`}
                    >
                      <ChevronsLeft className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={`${navButtonClass} ${ghostStyle}`}
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    {navItems.map((item) =>
                      typeof item === "number" ? (
                        <button
                          key={item}
                          type="button"
                          aria-label={`Page ${item}`}
                          onClick={() => setPage(item)}
                          className={`${navButtonClass} ${item === page ? activeStyle : ghostStyle}`}
                        >
                          {item}
                        </button>
                      ) : (
                        <span key={item} className="px-1 text-sm font-semibold text-[#8b95a7]">
                          …
                        </span>
                      )
                    )}
                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={`${navButtonClass} ${ghostStyle}`}
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      aria-label="Last page"
                      disabled={page >= totalPages}
                      onClick={() => setPage(totalPages)}
                      className={`${navButtonClass} ${ghostStyle}`}
                    >
                      <ChevronsRight className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
