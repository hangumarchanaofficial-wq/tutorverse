import React, { useCallback, useEffect, useState } from "react";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  fetchAdminCoupons,
  patchAdminCoupon,
} from "../../services/adminApi";

const emptyDraft = {
  code: "",
  type: "percentage",
  value: "",
  is_active: true,
  expires_at: "",
};

function formatExpiry(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
}

function expiryCountdown(iso) {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso) - new Date()) / 86400000);
  if (diff > 0) return { text: `Expires in ${diff}d`, color: diff <= 3 ? "text-amber-400" : "text-white/50" };
  if (diff === 0) return { text: "Expires today", color: "text-amber-400" };
  return { text: `Expired ${Math.abs(diff)}d ago`, color: "text-red-400" };
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/[0.06] bg-[#111827] p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm text-white/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-xl bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1]">Cancel</button>
          <button onClick={onConfirm} className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-400 shadow-2xl backdrop-blur-sm">
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {message}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} title="Copy code" className="rounded-md p-1 text-white/30 hover:text-brand-gold hover:bg-white/[0.06] transition-colors">
      {copied ? (
        <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export default function AdminCoupons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  const load = useCallback(() => {
    setError("");
    setLoading(true);
    return fetchAdminCoupons()
      .then((res) => setItems(res.items || []))
      .catch((e) => setError(e.message || "Failed to load coupons"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = items.filter((c) => c.is_active && !(c.expires_at && new Date(c.expires_at) < new Date())).length;
  const expiredCount = items.filter((c) => c.expires_at && new Date(c.expires_at) < new Date()).length;

  const submitCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createAdminCoupon({
        code: draft.code.trim().toUpperCase(),
        type: draft.type,
        value: Number(draft.value),
        is_active: draft.is_active,
        expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : null,
      });
      setDraft(emptyDraft);
      setToast("Coupon created successfully");
      await load();
    } catch (err) {
      setError(err.message || "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (row) => {
    setSavingId(row.id);
    setError("");
    try {
      const updated = await patchAdminCoupon(row.id, { is_active: !row.is_active });
      setItems((prev) => prev.map((c) => (c.id === row.id ? updated : c)));
      setToast(row.is_active ? "Coupon disabled" : "Coupon enabled");
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    try {
      await deleteAdminCoupon(deleteTarget.id);
      setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setToast("Coupon deleted");
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  const duplicateCoupon = (row) => {
    setDraft({
      code: row.code + "-COPY",
      type: row.type,
      value: String(row.value),
      is_active: true,
      expires_at: row.expires_at ? row.expires_at.split("T")[0] : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const SkeletonRows = () =>
    Array.from({ length: 4 }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: 7 }).map((__, j) => (
          <td key={j} className="px-4 py-3"><div className="h-4 w-20 bg-white/[0.06] animate-pulse rounded" /></td>
        ))}
      </tr>
    ));

  const SkeletonCards = () =>
    Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#111827] p-5">
        <div className="h-6 w-24 bg-white/[0.06] animate-pulse rounded mb-3" />
        <div className="h-4 w-32 bg-white/[0.06] animate-pulse rounded mb-2" />
        <div className="h-4 w-20 bg-white/[0.06] animate-pulse rounded" />
      </div>
    ));

  const stats = [
    { label: "Total", value: items.length, color: "text-white" },
    { label: "Active", value: activeCount, color: "text-emerald-400" },
    { label: "Expired", value: expiredCount, color: "text-red-400" },
    { label: "Total discount", value: "—", color: "text-white/40" },
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete coupon"
        message={`Delete coupon ${deleteTarget?.code}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <div>
        <h1 className="font-display text-2xl font-bold text-white">Coupons</h1>
        <p className="mt-1 text-sm text-white/40">
          Codes are validated server-side at checkout. Inactive or expired coupons cannot be applied.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#111827] p-4">
            <p className="text-xs font-medium text-white/40">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={submitCreate}
        className="grid gap-3 rounded-2xl border border-white/[0.06] bg-[#111827] p-5 shadow-premium sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="lg:col-span-2">
          <label className="text-xs font-medium text-white/40">Code</label>
          <div className="mt-1 flex gap-2">
            <input
              required
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
              placeholder="WELCOME10"
              className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm font-mono uppercase text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
            />
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, code: generateCode() }))}
              title="Generate random code"
              className="shrink-0 rounded-xl bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-white/60 hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Type</label>
          <select
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
            className="mt-1 w-full rounded-xl bg-[#111827] border border-white/[0.1] px-3 py-2 text-sm text-white focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed (LKR)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Value</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={draft.value}
            onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
            placeholder={draft.type === "percentage" ? "10" : "500"}
            className="mt-1 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-white/40">Expires</label>
          <input
            type="date"
            value={draft.expires_at}
            onChange={(e) => setDraft((d) => ({ ...d, expires_at: e.target.value }))}
            className="mt-1 w-full rounded-xl bg-white/[0.05] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/30"
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-1 text-sm text-white/70">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
            className="rounded border-white/20 bg-white/[0.05] text-brand-gold focus:ring-brand-gold/30"
          />
          Active
        </label>
        <div className="sm:col-span-2 lg:col-span-6">
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-brand-gold px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-brand-gold-light disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating…" : "Create coupon"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setViewMode("table")}
          className={`rounded-lg p-2 transition-colors ${viewMode === "table" ? "bg-white/[0.1] text-white" : "text-white/30 hover:text-white/60"}`}
          title="Table view"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={() => setViewMode("cards")}
          className={`rounded-lg p-2 transition-colors ${viewMode === "cards" ? "bg-white/[0.1] text-white" : "text-white/30 hover:text-white/60"}`}
          title="Card view"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827] shadow-premium">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <SkeletonRows />
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06]">
                          <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white/70">No coupons yet</p>
                          <p className="mt-1 text-xs text-white/40">Create your first coupon using the form above</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((row) => {
                    const expired = row.expires_at && new Date(row.expires_at) < new Date();
                    const countdown = expiryCountdown(row.expires_at);
                    return (
                      <tr key={row.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-white">{row.code}</span>
                            <CopyButton text={row.code} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/70 capitalize">{row.type}</td>
                        <td className="px-4 py-3 font-medium text-white">
                          {row.type === "percentage" ? `${Number(row.value)}%` : `LKR ${Number(row.value).toLocaleString()}`}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white/70">{formatExpiry(row.expires_at)}</p>
                            {countdown && <p className={`text-[11px] ${countdown.color}`}>{countdown.text}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-white/30">—</td>
                        <td className="px-4 py-3">
                          {expired ? (
                            <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">Expired</span>
                          ) : row.is_active ? (
                            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">Active</span>
                          ) : (
                            <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-white/40">Off</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => duplicateCoupon(row)}
                              title="Duplicate"
                              className="rounded-lg bg-white/[0.06] p-1.5 text-white/40 border border-white/[0.1] hover:bg-white/[0.1] hover:text-white/80 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(row)}
                              disabled={savingId === row.id}
                              className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
                            >
                              {row.is_active ? "Disable" : "Enable"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(row)}
                              className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <SkeletonCards />
          ) : items.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#111827] py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06]">
                <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/70">No coupons yet</p>
                <p className="mt-1 text-xs text-white/40">Create your first coupon using the form above</p>
              </div>
            </div>
          ) : (
            items.map((row) => {
              const expired = row.expires_at && new Date(row.expires_at) < new Date();
              const countdown = expiryCountdown(row.expires_at);
              return (
                <div key={row.id} className="group rounded-2xl border border-white/[0.06] bg-[#111827] p-5 hover:border-white/[0.12] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-white">{row.code}</span>
                      <CopyButton text={row.code} />
                    </div>
                    {expired ? (
                      <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">Expired</span>
                    ) : row.is_active ? (
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">Active</span>
                    ) : (
                      <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-white/40">Off</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-brand-gold">
                      {row.type === "percentage" ? `${Number(row.value)}%` : `LKR ${Number(row.value).toLocaleString()}`}
                    </span>
                    <span className="text-xs text-white/40 capitalize">{row.type}</span>
                  </div>
                  <div className="mt-2 text-xs text-white/50">
                    {formatExpiry(row.expires_at) !== "—" ? `Expires: ${formatExpiry(row.expires_at)}` : "No expiration"}
                    {countdown && <span className={` · ${countdown.color}`}>{countdown.text}</span>}
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-white/[0.06] pt-4">
                    <button onClick={() => duplicateCoupon(row)} className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/60 border border-white/[0.1] hover:bg-white/[0.1] transition-colors">Duplicate</button>
                    <button onClick={() => toggleActive(row)} disabled={savingId === row.id} className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/80 border border-white/[0.1] hover:bg-white/[0.1] disabled:opacity-50 transition-colors">
                      {row.is_active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => setDeleteTarget(row)} className="ml-auto rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
