import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleCheck,
  Copy,
  Tags,
  TrendingUp,
  Truck,
} from "lucide-react";
import {
  PageHeader,
  StatCard,
  StatusBadge,
  Input,
  Select,
  Btn,
  ActionMenu,
  ConfirmDialog,
  EmptyState,
  formatLkr,
  formatNum,
  fmtDate,
  useToast,
} from "../../admin/components/ui";
import { coupons as mockCoupons } from "../../admin/data/mockData";
import {
  fetchAdminCoupons,
  createAdminCoupon,
  patchAdminCoupon,
  deleteAdminCoupon,
} from "../../services/adminApi";

const TYPE_OPTIONS = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed Amount" },
  { value: "free_delivery", label: "Free Delivery" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "disabled", label: "Disabled" },
];

const SHOW_OPTIONS = [10, 25, 50].map((n) => ({ value: String(n), label: String(n) }));

const panelCls =
  "rounded-xl border border-[#263145] bg-[#121b2e] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.08)]";

function randomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "TWO";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const emptyForm = {
  code: "",
  type: "percentage",
  value: "",
  minOrder: "",
  maxDiscount: "",
  usageLimit: "",
  startDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
  isActive: true,
};

export default function CouponsList() {
  const toast = useToast();
  const [list, setList] = useState(mockCoupons);
  const [filter, setFilter] = useState("all");
  const [codeSearch, setCodeSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAdminCoupons();
        const arr = Array.isArray(res) ? res : (res?.items || []);
        if (arr.length > 0) setList(arr);
      } catch {
        /* fallback to mock */
      }
    })();
  }, []);

  const now = Date.now();

  const couponStatus = React.useCallback((c) => {
    if (!c.isActive) return "disabled";
    if (new Date(c.expiryDate).getTime() < now) return "expired";
    return "active";
  }, [now]);

  const kpis = useMemo(() => {
    const statuses = list.map((c) => couponStatus(c));
    const active = statuses.filter((s) => s === "active").length;
    const expired = statuses.filter((s) => s === "expired").length;
    const freeDelivery = list.filter((c) => c.type === "free_delivery").length;
    const mostUsed = list.reduce(
      (best, c) => ((c.usedCount || 0) > (best?.usedCount || 0) ? c : best),
      null
    );
    return [
      {
        label: "Total Coupons",
        value: formatNum(list.length),
        icon: <Tags className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Active",
        value: formatNum(active),
        variant: "success",
        icon: <CircleCheck className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Expired",
        value: formatNum(expired),
        variant: "danger",
        icon: <CalendarX className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Free Delivery",
        value: formatNum(freeDelivery),
        icon: <Truck className="h-4 w-4" strokeWidth={2} />,
      },
      {
        label: "Most Used",
        value: mostUsed?.code || "—",
        helpText: mostUsed ? `${mostUsed.usedCount || 0} uses` : "",
        icon: <TrendingUp className="h-4 w-4" strokeWidth={2} />,
      },
    ];
  }, [list, couponStatus]);

  const searchFiltered = useMemo(() => {
    const q = codeSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => String(c.code || "").toLowerCase().includes(q));
  }, [list, codeSearch]);

  const filtered = useMemo(() => {
    if (filter === "all") return searchFiltered;
    return searchFiltered.filter((c) => couponStatus(c) === filter);
  }, [searchFiltered, filter, couponStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, codeSearch, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast("Coupon code is required", "error");
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value) || 0,
      minOrder: Number(form.minOrder) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      usageLimit: Number(form.usageLimit) || 0,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
      isActive: form.isActive,
      usedCount: 0,
    };
    try {
      const created = await createAdminCoupon(payload);
      setList((prev) => [{ id: "CP" + Date.now(), ...payload, createdAt: new Date().toISOString(), ...created }, ...prev]);
      toast("Coupon created");
    } catch {
      setList((prev) => [{ id: "CP" + Date.now(), ...payload, createdAt: new Date().toISOString() }, ...prev]);
      toast("Coupon created (offline)");
    }
    setForm({ ...emptyForm });
    setShowForm(false);
  };

  const handleToggle = async (coupon) => {
    const next = !coupon.isActive;
    try {
      await patchAdminCoupon(coupon.id, { isActive: next });
    } catch {
      /* offline */
    }
    setList((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, isActive: next } : c)));
    toast(next ? "Coupon enabled" : "Coupon disabled");
  };

  const handleDuplicate = (coupon) => {
    setForm({
      code: coupon.code + "_COPY",
      type: coupon.type,
      value: String(coupon.value || ""),
      minOrder: String(coupon.minOrder || ""),
      maxDiscount: String(coupon.maxDiscount || ""),
      usageLimit: String(coupon.usageLimit || ""),
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: "",
      isActive: true,
    });
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminCoupon(deleteTarget.id);
    } catch {
      /* offline */
    }
    setList((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast("Coupon deleted");
    setDeleteTarget(null);
  };

  const daysUntil = (iso) => {
    if (!iso) return null;
    return Math.ceil((new Date(iso).getTime() - now) / 864e5);
  };

  return (
    <div className="admin-products-page admin-coupons-page space-y-6">
      <PageHeader
        title="Coupons"
        subtitle="Dashboard · Marketing · Coupons"
        actions={
          <Btn variant="primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Create Coupon"}
          </Btn>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className={panelCls}>
          <h3 className="mb-4 text-sm font-bold text-[#f8fafc]">New Coupon</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Input
                label="Code"
                value={form.code}
                onChange={(e) => handleField("code", e.target.value.toUpperCase())}
                placeholder="e.g. SAVE20"
              />
              <button
                type="button"
                onClick={() => handleField("code", randomCode())}
                className="mt-1 text-[11px] font-semibold text-[#d8b84f] hover:underline"
              >
                Generate Random
              </button>
            </div>
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => handleField("type", e.target.value)}
              options={TYPE_OPTIONS}
            />
            <Input
              label="Value"
              type="number"
              value={form.value}
              onChange={(e) => handleField("value", e.target.value)}
              placeholder={form.type === "percentage" ? "e.g. 10" : "e.g. 500"}
            />
            <Input
              label="Min Order (LKR)"
              type="number"
              value={form.minOrder}
              onChange={(e) => handleField("minOrder", e.target.value)}
            />
            <Input
              label="Max Discount (LKR)"
              type="number"
              value={form.maxDiscount}
              onChange={(e) => handleField("maxDiscount", e.target.value)}
            />
            <Input
              label="Usage Limit"
              type="number"
              value={form.usageLimit}
              onChange={(e) => handleField("usageLimit", e.target.value)}
            />
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => handleField("startDate", e.target.value)}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={form.expiryDate}
              onChange={(e) => handleField("expiryDate", e.target.value)}
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-[#f8fafc]">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleField("isActive", e.target.checked)}
                className="rounded border-[#263145] bg-[#182238]"
              />
              Active
            </label>
            <Btn variant="primary" onClick={handleSave}>
              Save Coupon
            </Btn>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48 min-w-[10rem]">
          <Input
            placeholder="Search code…"
            value={codeSearch}
            onChange={(e) => setCodeSearch(e.target.value)}
          />
        </div>
        <Select label="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} options={FILTER_OPTIONS} />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No coupons found" description="Create a new coupon to get started." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#263145] bg-[#121b2e]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[#263145] bg-[#0f1726] text-[11px] font-semibold uppercase tracking-wider text-[#8b95a7]">
                <tr>
                  {["Code", "Type", "Value", "Min Order", "Max Discount", "Usage", "Start", "Expiry", "Status", ""].map(
                    (h, i) => (
                      <th key={i} className="whitespace-nowrap px-4 py-3">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263145]/60">
                {paged.map((c) => {
                  const status = couponStatus(c);
                  const days = daysUntil(c.expiryDate);
                  const usagePct = c.usageLimit ? Math.min(100, ((c.usedCount || 0) / c.usageLimit) * 100) : 0;
                  return (
                    <tr key={c.id} className="transition hover:bg-[#182238]/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-[#182238] px-2 py-0.5 font-mono text-xs text-[#d8b84f]">
                            {c.code}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(c.code);
                              toast("Copied!");
                            }}
                            className="rounded p-1 text-[#8b95a7] hover:bg-[#263145]/50 hover:text-[#f8fafc]"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize text-[#f8fafc]">{c.type.replace("_", " ")}</td>
                      <td className="px-4 py-3 tabular-nums text-[#f8fafc]">
                        {c.type === "percentage"
                          ? `${c.value}%`
                          : c.type === "free_delivery"
                            ? "Free"
                            : formatLkr(c.value)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[#8b95a7]">{formatLkr(c.minOrder)}</td>
                      <td className="px-4 py-3 tabular-nums text-[#8b95a7]">{formatLkr(c.maxDiscount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs tabular-nums text-[#f8fafc]">
                            {c.usedCount ?? 0}/{c.usageLimit || "∞"}
                          </span>
                          {c.usageLimit > 0 && (
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#263145]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${usagePct}%`,
                                  background: usagePct > 80 ? "#f87171" : usagePct > 50 ? "#f59e0b" : "#34d399",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#8b95a7]">{fmtDate(c.startDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="text-xs text-[#8b95a7]">{fmtDate(c.expiryDate)}</div>
                        {days !== null && (
                          <div
                            className={`text-[10px] font-semibold ${days > 0 ? "text-[#34d399]" : "text-[#f87171]"}`}
                          >
                            {days > 0 ? `${days}d left` : `Expired ${Math.abs(days)}d ago`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3">
                        <ActionMenu
                          items={[
                            { label: c.isActive ? "Disable" : "Enable", onClick: () => handleToggle(c) },
                            { label: "Duplicate to Form", onClick: () => handleDuplicate(c) },
                            { divider: true },
                            { label: "Delete", danger: true, onClick: () => setDeleteTarget(c) },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > 10 && (
            <div className="flex flex-col gap-3 border-t border-[#263145] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-[#8b95a7]">
                  Show{" "}
                  <span className="mx-1 font-semibold tabular-nums text-[#f8fafc]">{paged.length}</span>
                  of {filtered.length}
                </span>
                <div className="w-20">
                  <Select
                    value={String(pageSize)}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    options={SHOW_OPTIONS}
                  />
                </div>
              </div>
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
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon "${deleteTarget?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
