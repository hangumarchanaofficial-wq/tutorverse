import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { validateCoupon } from "../services/orderApi";
import { formatLkr } from "../lib/format";

const CartPage = () => {
    const {
        items,
        cartCount,
        cartSubtotal,
        cartSavings,
        removeFromCart,
        updateQuantity,
        clearCart,
        coupon,
        applyCoupon,
        removeCoupon,
        couponDiscount,
        shippingFee,
        cartTotal,
        freeShippingThreshold,
    } = useCart();
    const [removingIndex, setRemovingIndex] = useState(null);
    const [customerNote, setCustomerNote] = useState("");
    const [couponInput, setCouponInput] = useState("");
    const [couponError, setCouponError] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);

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

    const handleRemove = (index) => {
        setRemovingIndex(index);
        setTimeout(() => {
            removeFromCart(index);
            setRemovingIndex(null);
        }, 300);
    };

    return (
        <div className="min-h-screen bg-brand-cream">
            {/* Breadcrumb */}
            <div className="border-b border-stone-200/60 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-3.5">
                    <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-500">
                        <Link to="/" className="hover:text-navy-950 transition-colors">Home</Link>
                        <svg className="h-3 w-3 flex-shrink-0 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="font-medium text-navy-950">Shopping Cart</span>
                    </nav>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold-dark mb-1.5">
                        <span className="h-px w-6 bg-brand-gold/50" />
                        Your Cart
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-navy-950 font-display">
                            Shopping Cart
                            {cartCount > 0 && (
                                <span className="ml-2 text-lg sm:text-xl font-normal text-stone-400">
                                    ({cartCount} {cartCount === 1 ? "item" : "items"})
                                </span>
                            )}
                        </h1>
                        {items.length > 0 && (
                            <button onClick={clearCart} className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-red-500 transition-colors hover:text-red-600 self-start sm:self-auto">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Clear Cart
                            </button>
                        )}
                    </div>
                </div>

                {items.length === 0 ? (
                    <section className="relative overflow-hidden rounded-[2rem] border border-stone-200/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(200,169,81,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.06),_transparent_28%)]" />
                        <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-brand-gold/10 blur-3xl" />
                        <div className="absolute -right-12 bottom-8 h-44 w-44 rounded-full bg-navy-950/5 blur-3xl" />

                        <div className="relative grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-center lg:px-12 lg:py-14">
                            <div className="max-w-xl">
                                <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-gold-dark">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                                    Cart Preview
                                </span>

                                <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-200/70 bg-gradient-to-br from-brand-cream to-white shadow-[0_16px_40px_rgba(200,169,81,0.15)]">
                                    <svg className="h-8 w-8 text-brand-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                    </svg>
                                </div>

                                <h2 className="mt-6 max-w-md font-display text-3xl font-bold leading-[1.05] tracking-tight text-navy-950 sm:text-4xl">
                                    Your cart is empty, but the best pieces are already waiting.
                                </h2>
                                <p className="mt-4 max-w-lg text-sm leading-7 text-stone-600 sm:text-base">
                                    Start with our curated catalogue and build an order with premium products, verified suppliers, and fast international fulfillment.
                                </p>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link to="/category" className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-950 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-navy-800 hover:shadow-[0_18px_36px_rgba(15,23,42,0.22)]">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                        </svg>
                                        Continue Shopping
                                    </Link>
                                    <Link to="/category?collection=new-arrivals" className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-semibold text-navy-950 transition-all hover:border-brand-gold/40 hover:bg-brand-cream/70">
                                        Explore New Arrivals
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                </div>

                                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                    {[
                                        { value: "Verified", label: "Supplier network" },
                                        { value: "Fast", label: "Global dispatch" },
                                        { value: "Secure", label: "Buyer protection" },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-2xl border border-stone-200/70 bg-white/80 px-4 py-3 backdrop-blur-sm">
                                            <p className="text-sm font-bold text-navy-950">{item.value}</p>
                                            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-stone-400">{item.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative mx-auto w-full max-w-[360px]">
                                <div className="absolute inset-x-10 top-6 h-32 rounded-full bg-brand-gold/20 blur-3xl" />
                                <div className="relative overflow-hidden rounded-[2rem] border border-stone-200/70 bg-[linear-gradient(180deg,#fffdf9_0%,#f6f1e8_100%)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
                                    <div className="flex items-center justify-between border-b border-stone-200/70 pb-4">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Ready When You Are</p>
                                            <p className="mt-1 text-lg font-bold text-navy-950">Curated Purchase Flow</p>
                                        </div>
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-950 text-white shadow-lg">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-5">
                                        {[
                                            { title: "Discover products", note: "Browse category highlights and new arrivals" },
                                            { title: "Build your order", note: "Add preferred items, variants, and quantities" },
                                            { title: "Checkout smoothly", note: "Review totals and confirm with confidence" },
                                        ].map((step, index) => (
                                            <div key={step.title} className="flex gap-3 rounded-2xl border border-white/80 bg-white/80 p-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-xs font-bold text-brand-gold-dark">
                                                    0{index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-navy-950">{step.title}</p>
                                                    <p className="mt-1 text-xs leading-5 text-stone-500">{step.note}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 rounded-2xl bg-navy-950 px-4 py-4 text-white">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Premium Service</p>
                                        <p className="mt-2 text-sm leading-6 text-white/85">
                                            Free shipping over LKR 10,000, clean checkout flow, and supplier-backed fulfillment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_400px]">
                        {/* Left: Item List */}
                        <div className="space-y-3 sm:space-y-4">
                            <div className="hidden rounded-xl border border-stone-200/60 bg-white px-5 py-3 shadow-premium md:grid md:grid-cols-[minmax(0,1fr)_120px_140px_100px_40px] md:items-center md:gap-4">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">Product</span>
                                <span className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">Price</span>
                                <span className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">Quantity</span>
                                <span className="text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">Total</span>
                                <span />
                            </div>

                            {items.map((item, index) => (
                                <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${index}`} className={`rounded-2xl border border-stone-200/60 bg-white shadow-premium transition-all duration-300 ${removingIndex === index ? "scale-95 opacity-0" : ""}`}>
                                    {/* Mobile Layout */}
                                    <div className="flex gap-3 p-3 sm:p-4 md:hidden">
                                        <Link to={`/product/${item.id}`} className="flex-shrink-0">
                                            <div className="h-24 w-24 overflow-hidden rounded-xl border border-stone-100 bg-brand-cream"><img src={item.image} alt={item.title} className="h-full w-full object-cover" /></div>
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-green-dark">{item.category}</p>
                                            <Link to={`/product/${item.id}`}><h3 className="text-sm font-semibold text-navy-950 leading-snug line-clamp-2 hover:text-navy-800 transition-colors">{item.title}</h3></Link>
                                            {(item.selectedSize || item.selectedColor) && <p className="mt-0.5 text-[11px] text-stone-400">{[item.selectedColor, item.selectedSize].filter(Boolean).join(" · ")}</p>}
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-bold text-navy-950">{formatLkr(item.price)}</span>
                                                    {item.originalPrice > item.price && <span className="text-xs text-stone-400 line-through">{formatLkr(item.originalPrice)}</span>}
                                                </div>
                                                <button onClick={() => handleRemove(index)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex h-9 items-center rounded-lg border border-stone-200 overflow-hidden">
                                                    <button onClick={() => updateQuantity(index, item.quantity - 1)} className="flex h-full w-9 items-center justify-center text-navy-900 hover:bg-brand-cream transition-colors"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg></button>
                                                    <span className="flex h-full w-10 items-center justify-center border-x border-stone-200 text-sm font-semibold text-navy-950">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(index, item.quantity + 1)} className="flex h-full w-9 items-center justify-center text-navy-900 hover:bg-brand-cream transition-colors"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg></button>
                                                </div>
                                                <span className="text-sm font-bold text-navy-950">{formatLkr(item.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop Layout */}
                                    <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_120px_140px_100px_40px] md:items-center md:gap-4 md:px-5 md:py-4">
                                        <div className="flex items-center gap-4">
                                            <Link to={`/product/${item.id}`} className="flex-shrink-0"><div className="h-20 w-20 overflow-hidden rounded-xl border border-stone-100 bg-brand-cream"><img src={item.image} alt={item.title} className="h-full w-full object-cover" /></div></Link>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-semibold uppercase tracking-wider text-brand-green-dark">{item.category}</p>
                                                <Link to={`/product/${item.id}`}><h3 className="text-sm font-semibold text-navy-950 leading-snug line-clamp-2 hover:text-navy-800 transition-colors">{item.title}</h3></Link>
                                                {(item.selectedSize || item.selectedColor) && <p className="mt-0.5 text-[11px] text-stone-400">{[item.selectedColor, item.selectedSize].filter(Boolean).join(" · ")}</p>}
                                                {item.discount > 0 && <span className="mt-1 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500">-{item.discount}%</span>}
                                            </div>
                                        </div>
                                        <div className="text-center"><span className="text-sm font-bold text-navy-950">{formatLkr(item.price)}</span>{item.originalPrice > item.price && <p className="text-xs text-stone-400 line-through">{formatLkr(item.originalPrice)}</p>}</div>
                                        <div className="flex justify-center">
                                            <div className="flex h-10 items-center rounded-xl border border-stone-200 overflow-hidden">
                                                <button onClick={() => updateQuantity(index, item.quantity - 1)} className="flex h-full w-10 items-center justify-center text-navy-900 hover:bg-brand-cream transition-colors"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg></button>
                                                <span className="flex h-full w-12 items-center justify-center border-x border-stone-200 text-sm font-semibold text-navy-950">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(index, item.quantity + 1)} className="flex h-full w-10 items-center justify-center text-navy-900 hover:bg-brand-cream transition-colors"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg></button>
                                            </div>
                                        </div>
                                        <div className="text-right"><span className="text-sm font-bold text-navy-950">{formatLkr(item.price * item.quantity)}</span></div>
                                        <button onClick={() => handleRemove(index)} className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    </div>
                                </div>
                            ))}

                            <Link to="/category" className="inline-flex items-center gap-2 text-sm font-medium text-navy-900 transition-colors hover:text-brand-gold-dark">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
                                Continue Shopping
                            </Link>
                        </div>

                        {/* Right: Order Summary */}
                        <div className="lg:sticky lg:top-28">
                            <div className="rounded-2xl border border-stone-200/60 bg-white shadow-premium overflow-hidden">
                                <div className="border-b border-stone-100 bg-brand-cream px-5 py-4">
                                    <h2 className="text-sm font-bold text-navy-950">Order Summary</h2>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between text-sm"><span className="text-stone-600">Subtotal ({cartCount} items)</span><span className="font-semibold text-navy-950">{formatLkr(cartSubtotal)}</span></div>
                                        {cartSavings > 0 && <div className="flex justify-between text-sm"><span className="text-brand-green-dark">Discount savings</span><span className="font-semibold text-brand-green-dark">-{formatLkr(cartSavings)}</span></div>}
                                        {couponDiscount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-brand-gold-dark">Coupon ({coupon?.code})</span>
                                                <span className="font-semibold text-brand-gold-dark">-{formatLkr(couponDiscount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm"><span className="text-stone-600">Shipping</span><span className={`font-semibold ${shippingFee === 0 ? "text-brand-green-dark" : "text-navy-950"}`}>{shippingFee === 0 ? "FREE" : formatLkr(shippingFee)}</span></div>
                                    </div>

                                    {shippingFee > 0 && (
                                        <div className="rounded-xl bg-brand-cream px-3.5 py-2.5">
                                            <div className="flex items-center gap-2 text-xs text-stone-600">
                                                <svg className="h-4 w-4 flex-shrink-0 text-brand-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                Add <span className="font-semibold text-navy-950">{formatLkr(freeShippingThreshold - (cartSubtotal - couponDiscount))}</span> more for free shipping
                                            </div>
                                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-200"><div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${Math.min(100, ((cartSubtotal - couponDiscount) / freeShippingThreshold) * 100)}%` }} /></div>
                                        </div>
                                    )}

                                    {/* Coupon */}
                                    <div className="rounded-xl border border-stone-200/80 bg-brand-cream/40 p-3">
                                        {coupon ? (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold-dark">Coupon applied</p>
                                                    <p className="font-mono text-sm font-semibold text-navy-950">{coupon.code}</p>
                                                </div>
                                                <button onClick={() => removeCoupon()} className="text-xs font-semibold text-stone-500 hover:text-red-500">Remove</button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                                                <label className="block text-xs font-semibold text-navy-950">Have a coupon code?</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={couponInput}
                                                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                        placeholder="WELCOME10"
                                                        className="flex-1 h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-mono uppercase focus:border-brand-gold focus:outline-none"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={!couponInput || couponLoading}
                                                        className="h-10 rounded-lg bg-navy-950 px-4 text-xs font-bold text-white disabled:opacity-50"
                                                    >
                                                        {couponLoading ? "…" : "Apply"}
                                                    </button>
                                                </div>
                                                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                                            </form>
                                        )}
                                    </div>

                                    <div className="border-t border-stone-100 pt-4">
                                        <div className="flex justify-between"><span className="text-base font-bold text-navy-950">Total</span><span className="text-xl font-bold text-navy-950">{formatLkr(cartTotal)}</span></div>
                                    </div>

                                    {/* Customer Note */}
                                    <div>
                                        <label className="block text-xs font-semibold text-navy-950 mb-1.5">Order note (optional)</label>
                                        <textarea value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} placeholder="Any special instructions..." rows={2} className="w-full rounded-xl border border-stone-200 bg-brand-cream px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-stone-400 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20 resize-none" />
                                    </div>

                                    {/* Proceed to Checkout */}
                                    <Link to="/checkout" className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-950 py-3.5 text-sm font-bold text-white transition-all hover:bg-navy-800 shadow-premium-lg hover:shadow-premium-xl">
                                        Proceed to Checkout
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </Link>

                                    <p className="text-center text-[11px] text-stone-400 leading-relaxed">Checkout securely to create your order in the TWOWAY backend and continue with payment.</p>

                                    {/* Trust Badges */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                                        {[
                                            { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "Secure" },
                                            { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", label: "Easy Returns" },
                                            { icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", label: "Fast Shipping" },
                                            { icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", label: "24/7 Support" },
                                        ].map((badge) => (
                                            <div key={badge.label} className="flex items-center gap-2 rounded-lg bg-brand-cream px-2.5 py-2">
                                                <svg className="h-3.5 w-3.5 flex-shrink-0 text-brand-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={badge.icon} /></svg>
                                                <span className="text-[11px] font-medium text-stone-600">{badge.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
