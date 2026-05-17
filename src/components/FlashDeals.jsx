import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { flashDeals } from "../data/dummyData";
import { useCart } from "../context/CartContext";
import { fetchProducts } from "../services/productApi";
import { normalizeProduct } from "../lib/normalizeProduct";

const FLASH_DEAL_FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&auto=format&q=80";

/* Map known broken Unsplash IDs to working replacements */
const IMAGE_FIXES = {
    "photo-AhIQL2CKq7g": "https://images.unsplash.com/photo-1515562141589-67f0d569b6d2?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-cdNM-XJh4K8": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-lFQV2lt7qcw": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-T29AcrDfWsY": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-VzBlp8rl5h8": "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-1596568001804-49ef57de7a02": "https://images.unsplash.com/photo-1596568001804-49ef57de7a02?w=600&h=600&fit=crop&auto=format&q=80",
};

function fixImageUrl(url) {
    if (!url) return FLASH_DEAL_FALLBACK_IMAGE;
    for (const [broken, fixed] of Object.entries(IMAGE_FIXES)) {
        if (url.includes(broken)) return fixed;
    }
    return url;
}

const CountdownTimer = ({ hours, minutes, seconds }) => {
    const [time, setTime] = useState({ h: hours, m: minutes, s: seconds });
    useEffect(() => {
        const timer = setInterval(() => {
            setTime((prev) => {
                let { h, m, s } = prev;
                if (s > 0) s -= 1;
                else if (m > 0) { m -= 1; s = 59; }
                else if (h > 0) { h -= 1; m = 59; s = 59; }
                return { h, m, s };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const pad = (n) => String(n).padStart(2, "0");
    return (
        <div className="flex items-center gap-1">
            {[{ v: pad(time.h), l: "HRS" }, { v: pad(time.m), l: "MIN" }, { v: pad(time.s), l: "SEC" }].map((u, i) => (
                <React.Fragment key={i}>
                    <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 font-mono text-xs font-bold text-navy-950 shadow-inner-glow sm:h-9 sm:w-9 sm:text-sm md:h-12 md:w-12 md:text-xl">{u.v}</div>
                        <span className="mt-0.5 text-[7px] font-medium text-brand-gold/60 sm:text-[8px] md:text-[9px]">{u.l}</span>
                    </div>
                    {i < 2 && <span className="mb-3 text-sm font-bold text-brand-gold/40 sm:text-base md:text-lg">:</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

const DealCard = ({ deal }) => {
    const { addToCart } = useCart();
    const [justAdded, setJustAdded] = useState(false);
    const resolvedImage = fixImageUrl(deal.image);
    const [imageSrc, setImageSrc] = useState(resolvedImage);
    const viewerCount = React.useMemo(() => Math.floor(Math.random() * 40 + 10), []);

    useEffect(() => {
        setImageSrc(fixImageUrl(deal.image));
    }, [deal.image]);

    const handleGrabDeal = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({ id: deal.id, title: deal.title, price: deal.price, originalPrice: deal.originalPrice, discount: deal.discount, image: deal.image, category: deal.category || "Flash Deal", quantity: 1, selectedSize: null, selectedColor: null, inStock: true });
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1500);
    };

    return (
        <div className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.07] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-brand-gold/20 hover:bg-white/[0.12]">
            <Link to={"/product/" + deal.id} className="block">
                <div className="relative aspect-square overflow-hidden">
                    <img
                        src={imageSrc}
                        alt={deal.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            setImageSrc(FLASH_DEAL_FALLBACK_IMAGE);
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/30 to-transparent" />
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <span className="rounded-lg bg-gradient-to-r from-brand-gold to-brand-gold-dark px-2 py-0.5 text-[9px] font-bold text-navy-950 shadow-lg sm:px-3 sm:py-1.5 sm:text-xs">-{deal.discount}% OFF</span>
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 sm:bottom-3 sm:left-3 sm:px-2.5 sm:py-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[9px] text-white/80 font-medium sm:text-[10px]">{viewerCount} viewing</span>
                    </div>
                </div>
            </Link>
            <div className="p-3 sm:p-4">
                <Link to={"/product/" + deal.id}><h3 className="mb-2 line-clamp-2 text-xs font-semibold leading-snug text-white transition-colors hover:text-brand-gold sm:mb-3 sm:text-sm">{deal.title}</h3></Link>
                <div className="mb-2 flex items-baseline gap-1.5 sm:mb-3 sm:gap-2">
                    <span className="text-base font-bold text-white sm:text-xl">$ {deal.price.toFixed(2)}</span>
                    <span className="text-[10px] text-white/30 line-through sm:text-sm">$ {deal.originalPrice.toFixed(2)}</span>
                </div>
                <div className="mb-2 sm:mb-3">
                    <div className="flex justify-between text-[10px] text-white/40 mb-1 sm:text-xs sm:mb-1.5">
                        <span><span className="text-brand-gold font-semibold">{deal.sold}</span> sold</span>
                        <span>{deal.total - deal.sold} left</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden sm:h-2">
                        <div className="h-full bg-gradient-to-r from-brand-gold to-brand-gold-light rounded-full transition-all duration-1000" style={{ width: ((deal.sold / deal.total) * 100) + "%" }} />
                    </div>
                </div>
                <button onClick={handleGrabDeal} className={"w-full rounded-xl py-2 text-[11px] font-bold transition-all duration-300 shadow-lg sm:py-2.5 sm:text-sm " + (justAdded ? "bg-brand-green text-white shadow-brand-green/15" : "bg-gradient-to-r from-brand-gold to-brand-gold-dark hover:from-brand-gold-dark hover:to-accent-copper text-navy-950 shadow-brand-gold/15")}>
                    {justAdded ? (<span className="flex items-center justify-center gap-1"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Added!</span>) : "Grab Deal"}
                </button>
            </div>
        </div>
    );
};

const FlashDeals = () => {
    const [deals, setDeals] = useState(flashDeals);

    const loadDeals = useCallback(async () => {
        try {
            const raw = await fetchProducts({ limit: 8 });
            const normalized = raw.map(normalizeProduct).filter(Boolean);
            const discounted = normalized.filter(
                (p) => p.discount > 0 || (p.originalPrice != null && p.originalPrice > p.price)
            );
            if (discounted.length === 0) return;

            const mapped = discounted.map((p) => {
                const sold = p.salesCount || Math.floor(Math.random() * 80 + 20);
                const total = sold + (p.stockQty || Math.floor(Math.random() * 50 + 10));
                return {
                    id: p.id,
                    title: p.title,
                    price: p.price,
                    originalPrice: p.originalPrice ?? p.price,
                    discount: p.discount || Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100),
                    image: p.image,
                    sold,
                    total,
                    category: p.category || "Flash Deal",
                };
            });
            setDeals(mapped);
        } catch {
            // keep dummyData fallback
        }
    }, []);

    useEffect(() => {
        let active = true;
        loadDeals().then(() => { if (!active) return; });
        return () => { active = false; };
    }, [loadDeals]);

    return (
        <section className="bg-brand-cream py-8 sm:py-12 md:py-18">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-[#0d1520] rounded-2xl sm:rounded-3xl overflow-hidden relative ring-1 ring-brand-gold/10">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-brand-gold/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 sm:w-96 sm:h-96" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 sm:w-64 sm:h-64" />
                    <div className="relative p-4 sm:p-6 md:p-10">
                        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6 md:mb-8 md:flex-row md:items-center md:gap-6">
                            <div className="flex items-center gap-2.5 sm:gap-4">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-gold to-brand-gold-dark shadow-lg shadow-brand-gold/25 sm:h-12 sm:w-12 sm:rounded-2xl md:h-14 md:w-14">
                                    <svg className="w-5 h-5 text-navy-950 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div>
                                    <h2 className="font-display text-lg font-bold text-white sm:text-2xl md:text-3xl">Flash Deals</h2>
                                    <p className="mt-0.5 text-[10px] text-white/50 sm:text-sm hidden sm:block">Limited-time offers — grab before they're gone!</p>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                <CountdownTimer hours={5} minutes={23} seconds={41} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {deals.map((deal) => (<DealCard key={deal.id} deal={deal} />))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FlashDeals;
