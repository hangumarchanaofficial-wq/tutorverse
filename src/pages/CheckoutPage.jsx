import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder, validateCoupon } from "../services/orderApi";
import { downloadMyInvoice } from "../services/customerApi";
import { formatLkr } from "../lib/format";

const CheckoutPage = () => {
    const navigate = useNavigate();
    const {
        items,
        cartCount,
        cartSubtotal,
        cartSavings,
        clearCart,
        coupon,
        applyCoupon,
        removeCoupon,
        couponDiscount,
        shippingFee,
        cartTotal,
    } = useCart();
    const { user } = useAuth();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        apartment: "",
        city: "",
        province: "",
        postalCode: "",
        country: "Sri Lanka",
    });
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [placedOrder, setPlacedOrder] = useState(null);
    const [placedPayment, setPlacedPayment] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [couponInput, setCouponInput] = useState("");
    const [couponError, setCouponError] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);

    const idempotencyKeyRef = useRef(null);
    const payhereFormRef = useRef(null);

    useEffect(() => {
        if (!idempotencyKeyRef.current) {
            const c = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            idempotencyKeyRef.current = `tw_${c}`;
        }
    }, []);

    useEffect(() => {
        if (user) {
            setForm((prev) => ({
                ...prev,
                email: prev.email || user.email || "",
                firstName: prev.firstName || (user.displayName ? user.displayName.split(" ")[0] : ""),
                lastName: prev.lastName || (user.displayName ? user.displayName.split(" ").slice(1).join(" ") : ""),
            }));
        }
    }, [user]);

    const updateForm = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    };

    const validate = () => {
        const e = {};
        if (!form.firstName.trim()) e.firstName = "First name is required";
        if (!form.lastName.trim()) e.lastName = "Last name is required";
        if (!form.email.trim()) e.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
        if (!form.phone.trim()) e.phone = "Phone is required";
        if (!form.address.trim()) e.address = "Address is required";
        if (!form.city.trim()) e.city = "City is required";
        if (!form.postalCode.trim()) e.postalCode = "Postal code is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleApplyCoupon = async (e) => {
        e?.preventDefault();
        const code = couponInput.trim().toUpperCase();
        if (!code) return;
        setCouponError("");
        setCouponLoading(true);
        try {
            const res = await validateCoupon(code);
            applyCoupon(res.coupon);
            setCouponInput("");
        } catch (err) {
            setCouponError(err.message || "Invalid coupon");
        } finally {
            setCouponLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!validate()) return;
        if (!user?.uid) {
            setSubmitError("Please log in before placing an order.");
            return;
        }
        setSubmitError("");
        setIsSubmitting(true);
        try {
            const payload = {
                items: items.map((item) => ({
                    product_id: Number(item.id),
                    quantity: Number(item.quantity),
                    selected_size: item.selectedSize || null,
                    selected_color: item.selectedColor || null,
                })),
                shipping: form,
                payment_method: paymentMethod,
                coupon_code: coupon?.code || null,
            };
            const result = await createOrder(payload, { idempotencyKey: idempotencyKeyRef.current });
            setPlacedOrder(result.order || null);
            setPlacedPayment(result.payment || null);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            setSubmitError(error.message || "Order creation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const downloadInvoice = async () => {
        if (!placedOrder) return;
        setDownloading(true);
        try {
            const blob = await downloadMyInvoice(placedOrder.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${placedOrder.invoice_number || `order-${placedOrder.id}`}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            setSubmitError(e.message || "Invoice download failed.");
        } finally {
            setDownloading(false);
        }
    };

    /* PayHere card flow: backend returns { provider:"payhere", checkout_url, fields } */
    useEffect(() => {
        if (placedPayment?.provider === "payhere" && placedPayment.checkout_url && placedPayment.fields) {
            const t = setTimeout(() => payhereFormRef.current?.submit(), 800);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [placedPayment]);

    const InputField = ({ label, name, type = "text", placeholder, half, autoComplete }) => (
        <div className={half ? "flex-1 min-w-0" : ""}>
            <label className="block text-xs font-semibold text-navy-950 mb-1.5">{label}</label>
            <input
                type={type}
                value={form[name]}
                onChange={(e) => updateForm(name, e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={`w-full h-11 rounded-xl border-2 bg-white px-3.5 text-sm text-navy-950 placeholder:text-stone-400 transition-all focus:outline-none focus:ring-2 ${errors[name] ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-stone-200 focus:border-brand-gold focus:ring-brand-gold/20"}`}
            />
            {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
        </div>
    );

    /* ── Order Placed Success ── */
    if (placedOrder) {
        const orderNumber = placedOrder.order_number || `TW-${placedOrder.id}`;
        const total = Number(placedOrder.total_amount || cartTotal);
        const paymentInstruction =
            placedOrder.payment_method === "cod"
                ? "Pay in cash when the courier delivers your parcel."
                : placedOrder.payment_method === "bank"
                    ? "Bank transfer instructions will be shared via WhatsApp shortly."
                    : placedPayment?.provider === "payhere"
                        ? "Redirecting you to PayHere…"
                        : "Card payment is being processed.";

        return (
            <div className="min-h-screen bg-brand-cream">
                <div className="border-b border-stone-200/60 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-3.5">
                        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-500">
                            <Link to="/" className="hover:text-navy-950 transition-colors">Home</Link>
                            <svg className="h-3 w-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span className="font-medium text-navy-950">Order Confirmed</span>
                        </nav>
                    </div>
                </div>

                <div className="mx-auto max-w-2xl px-4 py-12 md:py-20 text-center">
                    <div className="rounded-3xl border border-stone-200/60 bg-white p-8 sm:p-12 shadow-premium">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-green/10 mb-6">
                            <svg className="h-10 w-10 text-brand-green-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-navy-950 font-display mb-2">Order Placed Successfully!</h1>
                        <p className="text-stone-500 text-sm mb-1">Order number</p>
                        <p className="text-lg font-bold text-navy-950 font-mono mb-2">{orderNumber}</p>
                        {placedOrder.invoice_number && (
                            <p className="text-xs text-stone-500 mb-4">Invoice <span className="font-mono">{placedOrder.invoice_number}</span> · Total {formatLkr(total)}</p>
                        )}
                        <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto mb-6">
                            {paymentInstruction}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                type="button"
                                onClick={downloadInvoice}
                                disabled={downloading}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-950 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                            >
                                {downloading ? "Preparing…" : "Download invoice"}
                            </button>
                            <Link
                                to="/account"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-navy-950 hover:border-brand-gold/40"
                                onClick={() => clearCart()}
                            >
                                View my orders
                            </Link>
                            <button
                                type="button"
                                onClick={() => { clearCart(); navigate("/"); }}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-navy-950 hover:border-brand-gold/40"
                            >
                                Continue shopping
                            </button>
                        </div>

                        {placedPayment?.provider === "payhere" && placedPayment.checkout_url && placedPayment.fields && (
                            <form ref={payhereFormRef} method="POST" action={placedPayment.checkout_url} className="hidden">
                                {Object.entries(placedPayment.fields).map(([k, v]) => (
                                    <input key={k} type="hidden" name={k} value={String(v ?? "")} />
                                ))}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ── Redirect if cart is empty ── */
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-brand-cream">
                <div className="border-b border-stone-200/60 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-3.5">
                        <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-500">
                            <Link to="/" className="hover:text-navy-950 transition-colors">Home</Link>
                            <svg className="h-3 w-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span className="font-medium text-navy-950">Checkout</span>
                        </nav>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-cream mb-5">
                        <svg className="h-10 w-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-navy-950 mb-2">Your cart is empty</h3>
                    <p className="text-sm text-stone-500 mb-6">Add some items before checking out.</p>
                    <Link to="/category" className="rounded-full bg-navy-950 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800 transition-colors shadow-premium-lg">Browse Products</Link>
                </div>
            </div>
        );
    }

    /* ── Main Checkout ── */
    return (
        <div className="min-h-screen bg-brand-cream">
            <div className="border-b border-stone-200/60 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-3.5">
                    <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-500">
                        <Link to="/" className="hover:text-navy-950 transition-colors">Home</Link>
                        <svg className="h-3 w-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <Link to="/cart" className="hover:text-navy-950 transition-colors">Cart</Link>
                        <svg className="h-3 w-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="font-medium text-navy-950">Checkout</span>
                    </nav>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
                    {/* ── Left: Forms ── */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-stone-200/60 bg-white shadow-premium overflow-hidden">
                            <div className="border-b border-stone-100 bg-brand-cream px-5 py-4 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-950 text-white text-xs font-bold">1</div>
                                <h2 className="text-sm font-bold text-navy-950">Shipping Details</h2>
                            </div>
                            <div className="p-5 sm:p-6 space-y-4">
                                <div className="flex gap-4">
                                    <InputField label="First name" name="firstName" placeholder="John" half autoComplete="given-name" />
                                    <InputField label="Last name" name="lastName" placeholder="Doe" half autoComplete="family-name" />
                                </div>
                                <div className="flex gap-4">
                                    <InputField label="Email" name="email" type="email" placeholder="john@example.com" half autoComplete="email" />
                                    <InputField label="Phone" name="phone" type="tel" placeholder="+94 77 123 4567" half autoComplete="tel" />
                                </div>
                                <InputField label="Street address" name="address" placeholder="123 Main Street" autoComplete="street-address" />
                                <InputField label="Apartment, suite, etc. (optional)" name="apartment" placeholder="Apt 4B" autoComplete="address-line2" />
                                <div className="flex gap-4">
                                    <InputField label="City" name="city" placeholder="Colombo" half autoComplete="address-level2" />
                                    <InputField label="Province / State" name="province" placeholder="Western" half autoComplete="address-level1" />
                                </div>
                                <div className="flex gap-4">
                                    <InputField label="Postal code" name="postalCode" placeholder="00100" half autoComplete="postal-code" />
                                    <div className="flex-1 min-w-0">
                                        <label className="block text-xs font-semibold text-navy-950 mb-1.5">Country</label>
                                        <select value={form.country} onChange={(e) => updateForm("country", e.target.value)} className="w-full h-11 rounded-xl border-2 border-stone-200 bg-white px-3.5 text-sm text-navy-950 transition-all focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20">
                                            {["Sri Lanka", "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "Japan", "Singapore", "UAE", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-stone-200/60 bg-white shadow-premium overflow-hidden">
                            <div className="border-b border-stone-100 bg-brand-cream px-5 py-4 flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-950 text-white text-xs font-bold">2</div>
                                <h2 className="text-sm font-bold text-navy-950">Payment Method</h2>
                            </div>
                            <div className="p-5 sm:p-6 space-y-3">
                                {[
                                    { id: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
                                    { id: "bank", label: "Bank Transfer", desc: "Direct transfer to our bank account", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                                    { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, Amex via PayHere/Stripe", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${paymentMethod === method.id ? "border-navy-950 bg-navy-950/[0.02] shadow-sm" : "border-stone-200 hover:border-stone-300"}`}
                                    >
                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${paymentMethod === method.id ? "bg-navy-950 text-white" : "bg-brand-cream text-stone-500"}`}>
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={method.icon} /></svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-navy-950">{method.label}</p>
                                            <p className="text-xs text-stone-500">{method.desc}</p>
                                        </div>
                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === method.id ? "border-navy-950" : "border-stone-300"}`}>
                                            {paymentMethod === method.id && <div className="h-2.5 w-2.5 rounded-full bg-navy-950" />}
                                        </div>
                                    </button>
                                ))}

                                {paymentMethod === "card" && (
                                    <div className="mt-4 rounded-xl border border-stone-200 bg-brand-cream p-4 text-xs text-stone-700 leading-relaxed">
                                        <p className="font-semibold text-navy-950 mb-1">Secure card checkout</p>
                                        After placing the order, you will be redirected to our payment provider to enter your card details on a PCI-compliant page. We never see or store your full card number.
                                    </div>
                                )}

                                {paymentMethod === "bank" && (
                                    <div className="mt-4 rounded-xl border border-stone-200 bg-brand-cream p-4">
                                        <p className="text-xs font-semibold text-navy-950 mb-2">Bank Transfer Details</p>
                                        <div className="space-y-1.5 text-xs text-stone-600">
                                            <p><span className="font-medium text-navy-950">Bank:</span> Bank of Ceylon</p>
                                            <p><span className="font-medium text-navy-950">Account:</span> TWOWAY CEYLON PVT LTD</p>
                                            <p><span className="font-medium text-navy-950">Account No:</span> 0012-3456-7890</p>
                                            <p><span className="font-medium text-navy-950">Branch:</span> Colombo Main</p>
                                        </div>
                                        <p className="mt-3 text-[11px] text-stone-500">Please use your order number as the payment reference. Confirmation via WhatsApp after transfer.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Order Summary ── */}
                    <div className="lg:sticky lg:top-28 space-y-4">
                        <div className="rounded-2xl border border-stone-200/60 bg-white shadow-premium overflow-hidden">
                            <div className="border-b border-stone-100 bg-brand-cream px-5 py-4">
                                <h2 className="text-sm font-bold text-navy-950">Order Summary ({cartCount} items)</h2>
                            </div>
                            <div className="p-5">
                                <div className="space-y-3 max-h-[280px] overflow-y-auto scrollbar-hide mb-4">
                                    {items.map((item, i) => (
                                        <div key={`${item.id}-${i}`} className="flex gap-3">
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-stone-100 bg-brand-cream">
                                                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-navy-950 line-clamp-2 leading-snug">{item.title}</p>
                                                {(item.selectedSize || item.selectedColor) && (
                                                    <p className="text-[10px] text-stone-400 mt-0.5">{[item.selectedColor, item.selectedSize].filter(Boolean).join(" · ")}</p>
                                                )}
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-[11px] text-stone-500">Qty: {item.quantity}</span>
                                                    <span className="text-xs font-bold text-navy-950">{formatLkr(Number(item.price) * Number(item.quantity))}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Coupon */}
                                <div className="rounded-xl border border-stone-200/80 bg-brand-cream/40 p-3 mb-4">
                                    {coupon ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-gold-dark">Coupon applied</p>
                                                <p className="font-mono text-sm font-semibold text-navy-950">{coupon.code}</p>
                                            </div>
                                            <button onClick={() => removeCoupon()} className="text-xs font-semibold text-stone-500 hover:text-red-500">Remove</button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                                            <label className="block text-[11px] font-semibold text-navy-950">Coupon code</label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={couponInput}
                                                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                    placeholder="WELCOME10"
                                                    className="flex-1 h-9 rounded-lg border border-stone-200 bg-white px-2.5 text-xs font-mono uppercase focus:border-brand-gold focus:outline-none"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!couponInput || couponLoading}
                                                    className="h-9 rounded-lg bg-navy-950 px-3 text-[11px] font-bold text-white disabled:opacity-50"
                                                >
                                                    {couponLoading ? "…" : "Apply"}
                                                </button>
                                            </div>
                                            {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}
                                        </form>
                                    )}
                                </div>

                                <div className="space-y-2.5 border-t border-stone-100 pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-600">Subtotal</span>
                                        <span className="font-semibold text-navy-950">{formatLkr(cartSubtotal)}</span>
                                    </div>
                                    {cartSavings > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-green-dark">Savings</span>
                                            <span className="font-semibold text-brand-green-dark">-{formatLkr(cartSavings)}</span>
                                        </div>
                                    )}
                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-brand-gold-dark">Coupon</span>
                                            <span className="font-semibold text-brand-gold-dark">-{formatLkr(couponDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-600">Shipping</span>
                                        <span className={`font-semibold ${shippingFee === 0 ? "text-brand-green-dark" : "text-navy-950"}`}>{shippingFee === 0 ? "FREE" : formatLkr(shippingFee)}</span>
                                    </div>
                                    <div className="border-t border-stone-100 pt-3 flex justify-between">
                                        <span className="text-base font-bold text-navy-950">Total</span>
                                        <span className="text-xl font-bold text-navy-950">{formatLkr(cartTotal)}</span>
                                    </div>
                                </div>

                                {submitError && <p className="mt-3 text-xs text-red-500">{submitError}</p>}
                                <button onClick={handlePlaceOrder} disabled={isSubmitting} className="mt-5 w-full rounded-xl bg-navy-950 py-3.5 text-sm font-bold text-white transition-all hover:bg-navy-800 shadow-premium-lg hover:shadow-premium-xl flex items-center justify-center gap-2 disabled:opacity-60">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    {isSubmitting ? "Placing Order..." : `Place Order — ${formatLkr(cartTotal)}`}
                                </button>

                                <p className="mt-3 text-center text-[11px] text-stone-400 leading-relaxed">
                                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        </div>

                        <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-navy-900 hover:text-brand-gold-dark transition-colors">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                            Back to Cart
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
