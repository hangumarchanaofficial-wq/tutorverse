import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { allProducts } from "../data/dummyData";
import { fetchProductById } from "../services/productApi";
import { normalizeProduct } from "../lib/normalizeProduct";

const STORAGE_KEY = "tw_recently_viewed";
const MAX_ITEMS = 20;

export function trackProductView(productId) {
    if (!productId) return;
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const filtered = stored.filter((id) => String(id) !== String(productId));
        filtered.unshift(String(productId));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
    } catch {
        // localStorage unavailable
    }
}

function getRecentIds() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

const fallbackProducts = allProducts.filter((_, i) => [2, 5, 8, 13, 18, 21].includes(i)).slice(0, 6);

const RecentlyViewed = () => {
    const [recentProducts, setRecentProducts] = useState(fallbackProducts);

    const loadRecent = useCallback(async () => {
        const ids = getRecentIds();
        if (ids.length === 0) return;

        try {
            const results = await Promise.all(
                ids.slice(0, 6).map((id) =>
                    fetchProductById(id).then(normalizeProduct).catch(() => null)
                )
            );
            const valid = results.filter(Boolean);
            if (valid.length > 0) setRecentProducts(valid);
        } catch {
            // keep fallback
        }
    }, []);

    useEffect(() => {
        let active = true;
        loadRecent().then(() => { if (!active) return; });
        return () => { active = false; };
    }, [loadRecent]);

    return (
        <section className="bg-brand-cream py-8 sm:py-12 md:py-18">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                <div className="mb-4 flex items-end justify-between sm:mb-8">
                    <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-slate sm:mb-2 sm:text-sm">Personalized</p>
                        <h2 className="font-display text-xl font-bold text-navy-950 sm:text-3xl md:text-4xl">Recommended For You</h2>
                    </div>
                    <Link to="/category" className="group flex items-center gap-1.5 text-xs font-semibold text-accent-slate hover:text-navy-950 transition-colors sm:text-sm sm:gap-2">
                        See More
                        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                </div>
                {/* Mobile: 4 items */}
                <div className="grid grid-cols-2 gap-2.5 sm:hidden">
                    {recentProducts.slice(0, 4).map((product) => (<ProductCard key={product.id} product={product} />))}
                </div>
                {/* Desktop: 5 items */}
                <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4 md:gap-5 lg:grid-cols-5">
                    {recentProducts.slice(0, 5).map((product) => (<ProductCard key={product.id} product={product} />))}
                </div>
            </div>
        </section>
    );
};

export default RecentlyViewed;
