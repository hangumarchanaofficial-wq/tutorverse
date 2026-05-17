import React, { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    downloadMyInvoice,
    fetchMe,
    fetchMyOrders,
    patchMe,
} from "../services/customerApi";
import { formatLkr, formatDateTime } from "../lib/format";

const STATUS_COLORS = {
    pending: "bg-amber-100 text-amber-800",
    processing: "bg-sky-100 text-sky-800",
    completed: "bg-brand-green/15 text-brand-green-dark",
    cancelled: "bg-red-100 text-red-700",
};

function StatusPill({ status }) {
    const cls = STATUS_COLORS[status] || "bg-stone-100 text-stone-700";
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
            {status}
        </span>
    );
}

function PaymentPill({ status }) {
    if (!status) return null;
    const map = {
        paid: "bg-brand-green/15 text-brand-green-dark",
        pending: "bg-amber-100 text-amber-800",
        failed: "bg-red-100 text-red-700",
        refunded: "bg-stone-200 text-stone-700",
    };
    const cls = map[status] || "bg-stone-100 text-stone-700";
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
            {status}
        </span>
    );
}

export default function AccountPage() {
    const { user, loading, logout } = useAuth();
    const location = useLocation();

    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [error, setError] = useState("");

    const [draft, setDraft] = useState({ full_name: "", phone: "" });
    const [saving, setSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState("");
    const [downloadingId, setDownloadingId] = useState(null);

    const load = useCallback(async () => {
        setError("");
        setLoadingProfile(true);
        setLoadingOrders(true);
        try {
            const [me, ord] = await Promise.all([
                fetchMe().catch((e) => {
                    throw e;
                }),
                fetchMyOrders().catch(() => ({ items: [] })),
            ]);
            setProfile(me);
            setDraft({
                full_name: me?.profile?.full_name || "",
                phone: me?.profile?.phone || "",
            });
            setOrders(ord.items || []);
        } catch (e) {
            setError(e.message || "Failed to load account");
        } finally {
            setLoadingProfile(false);
            setLoadingOrders(false);
        }
    }, []);

    useEffect(() => {
        if (!user?.uid) return;
        load();
    }, [user?.uid, load]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-sm text-stone-500">Loading…</div>;
    }
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    const saveProfile = async (e) => {
        e?.preventDefault();
        setSaving(true);
        setSavedMessage("");
        setError("");
        try {
            const updated = await patchMe({
                full_name: draft.full_name.trim() || null,
                phone: draft.phone.trim() || null,
            });
            setProfile((prev) => ({ ...(prev || {}), profile: updated }));
            setSavedMessage("Profile saved.");
        } catch (e) {
            setError(e.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const downloadInvoice = async (order) => {
        setDownloadingId(order.id);
        setError("");
        try {
            const blob = await downloadMyInvoice(order.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${order.invoice_number || `order-${order.id}`}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            setError(e.message || "Invoice download failed");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-brand-cream">
            <div className="border-b border-stone-200/60 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-3.5">
                    <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-500">
                        <Link to="/" className="hover:text-navy-950 transition-colors">Home</Link>
                        <svg className="h-3 w-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="font-medium text-navy-950">My Account</span>
                    </nav>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold-dark">Account</p>
                        <h1 className="mt-1 font-display text-3xl font-bold text-navy-950">{profile?.profile?.full_name || user.displayName || "Welcome"}</h1>
                        <p className="text-sm text-stone-500">{user.email}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="self-start rounded-xl border-2 border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-950 hover:border-red-200 hover:text-red-600"
                    >
                        Sign out
                    </button>
                </div>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">{error}</div>
                )}

                {/* Profile */}
                <section className="rounded-2xl border border-stone-200/60 bg-white p-5 sm:p-6 shadow-premium">
                    <h2 className="font-display text-lg font-bold text-navy-950">Profile</h2>
                    <p className="mt-1 text-sm text-stone-500">Used to greet you and pre-fill checkout.</p>

                    {loadingProfile ? (
                        <p className="mt-4 text-sm text-stone-500">Loading…</p>
                    ) : (
                        <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-xs font-semibold text-navy-950">Full name</label>
                                <input
                                    value={draft.full_name}
                                    onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))}
                                    className="mt-1 w-full rounded-xl border-2 border-stone-200 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none"
                                    maxLength={160}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-navy-950">Phone</label>
                                <input
                                    value={draft.phone}
                                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                                    className="mt-1 w-full rounded-xl border-2 border-stone-200 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none"
                                    maxLength={40}
                                />
                            </div>
                            <div className="sm:col-span-2 flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                                >
                                    {saving ? "Saving…" : "Save profile"}
                                </button>
                                {savedMessage && <span className="text-sm text-brand-green-dark">{savedMessage}</span>}
                            </div>
                        </form>
                    )}
                </section>

                {/* Orders */}
                <section className="rounded-2xl border border-stone-200/60 bg-white shadow-premium">
                    <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                        <h2 className="font-display text-lg font-bold text-navy-950">My orders</h2>
                        <span className="text-xs text-stone-500">{orders.length} order{orders.length === 1 ? "" : "s"}</span>
                    </div>
                    {loadingOrders ? (
                        <p className="px-5 py-8 text-sm text-stone-500">Loading…</p>
                    ) : orders.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <p className="text-sm text-stone-500 mb-4">You haven't placed any orders yet.</p>
                            <Link to="/category" className="inline-flex rounded-xl bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                                Start shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {orders.map((order) => {
                                const items = order.order_items || [];
                                return (
                                    <article key={order.id} className="px-5 py-5 sm:px-6">
                                        <header className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-mono text-sm font-bold text-navy-950">{order.order_number}</p>
                                                    <StatusPill status={order.status} />
                                                    <PaymentPill status={order.payment_status} />
                                                </div>
                                                <p className="mt-1 text-xs text-stone-500">
                                                    {formatDateTime(order.created_at)} · {items.length} item{items.length === 1 ? "" : "s"} · {formatLkr(order.total_amount)}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => downloadInvoice(order)}
                                                    disabled={downloadingId === order.id}
                                                    className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-950 hover:border-brand-gold/40 disabled:opacity-50"
                                                >
                                                    {downloadingId === order.id ? "Preparing…" : "Download invoice"}
                                                </button>
                                            </div>
                                        </header>

                                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                                            {items.slice(0, 4).map((item) => (
                                                <li key={item.id} className="flex items-center justify-between rounded-lg bg-brand-cream/40 px-3 py-2 text-sm">
                                                    <span className="line-clamp-1 text-navy-900">
                                                        {item.product_title}
                                                        {(item.selected_size || item.selected_color) && (
                                                            <span className="ml-1 text-xs text-stone-500">({[item.selected_color, item.selected_size].filter(Boolean).join(" · ")})</span>
                                                        )}
                                                    </span>
                                                    <span className="ml-2 shrink-0 text-xs text-stone-600">×{item.quantity}</span>
                                                </li>
                                            ))}
                                            {items.length > 4 && (
                                                <li className="text-xs text-stone-500 sm:col-span-2">…and {items.length - 4} more item{items.length - 4 === 1 ? "" : "s"}</li>
                                            )}
                                        </ul>

                                        <div className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                                            <p><span className="text-stone-400">Ship to:</span> {order.shipping_address}</p>
                                            <p><span className="text-stone-400">Payment:</span> {order.payment_method}{order.coupon_code ? ` · coupon ${order.coupon_code}` : ""}</p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
