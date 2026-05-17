import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { allProducts } from "../data/dummyData";
import { fetchProducts } from "../services/productApi";
import { normalizeProducts } from "../lib/normalizeProduct";

const categoryMap = {
    all: "All",
    fashion: "Fashion",
    electronics: "Electronics",
    home: "Home",
    beauty: "Beauty",
    food: "Food",
};

const matchers = {
    all: () => true,
    fashion: (p) => /clothing|fashion|shoes|bag|accessor|jewelry/i.test(`${p.category} ${p.categorySlug}`),
    electronics: (p) => /electronics|computer|phone|gaming/i.test(`${p.category} ${p.categorySlug}`),
    home: (p) => /home|kitchen|furniture|appliance/i.test(`${p.category} ${p.categorySlug}`),
    beauty: (p) => /beauty|health|skincare|wellness/i.test(`${p.category} ${p.categorySlug}`),
    food: (p) => /food|grocery|snack|tea/i.test(`${p.category} ${p.categorySlug}`),
};

const dedupeByTitle = (items) => {
    const seen = new Set();
    return items.filter((p) => {
        const key = String(p.title).toLowerCase().replace(/\s[-–]\s.+$/, "").trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const FeaturedProducts = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [items, setItems] = useState([]);

    useEffect(() => {
        let on = true;
        fetchProducts({ featured: "true", limit: 24 })
            .then((rows) => {
                if (!on) return;
                const normalized = normalizeProducts(rows);
                if (normalized.length > 0) {
                    setItems(normalized);
                } else {
                    setItems(normalizeProducts(allProducts));
                }
            })
            .catch(() => {
                if (on) setItems(normalizeProducts(allProducts));
            });
        return () => {
            on = false;
        };
    }, []);

    const filtered = dedupeByTitle(items.filter(matchers[activeTab] || (() => true)));

    return (
        <section className="bg-white py-8 sm:py-12 md:py-18">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                <div className="mb-4 text-center sm:mb-8">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-gold sm:mb-2 sm:text-sm">Curated Selection</p>
                    <h2 className="mb-2 font-display text-xl font-bold text-navy-950 sm:mb-3 sm:text-3xl md:text-4xl">Featured Products</h2>
                    <p className="mx-auto max-w-xs text-xs leading-relaxed text-stone-500 sm:max-w-2xl sm:text-base">Handpicked products chosen for quality, value, and satisfaction.</p>
                </div>

                <div className="mb-4 flex justify-center sm:mb-8">
                    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-stone-200/50 bg-brand-cream p-1 shadow-premium hide-scrollbar scrollbar-hide sm:rounded-2xl sm:p-1.5">
                        {Object.entries(categoryMap).map(([key, label]) => (
                            <button key={key} onClick={() => setActiveTab(key)} className={"flex-shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-300 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-sm " + (activeTab === key ? "bg-navy-950 text-brand-gold shadow-lg" : "text-stone-500 hover:text-navy-800 hover:bg-white")}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:hidden">
                    {filtered.slice(0, 4).map((product) => (<ProductCard key={product.id} product={product} />))}
                </div>
                <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
                    {filtered.slice(0, 10).map((product) => (<ProductCard key={product.id} product={product} />))}
                </div>

                <div className="mt-6 text-center sm:mt-10">
                    <Link to="/category" className="inline-flex items-center gap-2 rounded-full border border-stone-200/50 bg-white px-5 py-2.5 text-xs font-semibold text-navy-900 shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-premium-lg sm:px-8 sm:py-3.5 sm:text-sm">
                        View All Products
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
