import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { allProducts } from "../data/dummyData";
import { fetchProducts } from "../services/productApi";
import { normalizeProducts } from "../lib/normalizeProduct";

const BestSellers = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        let on = true;
        fetchProducts({ best_seller: "true", limit: 12 })
            .then((rows) => {
                if (!on) return;
                const normalized = normalizeProducts(rows);
                if (normalized.length) {
                    setItems(normalized);
                } else {
                    const fallback = [...allProducts].sort((a, b) => b.reviews - a.reviews).slice(0, 6);
                    setItems(normalizeProducts(fallback));
                }
            })
            .catch(() => {
                if (!on) return;
                const fallback = [...allProducts].sort((a, b) => b.reviews - a.reviews).slice(0, 6);
                setItems(normalizeProducts(fallback));
            });
        return () => {
            on = false;
        };
    }, []);

    return (
        <section className="bg-brand-cream py-8 sm:py-12 md:py-18">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                <div className="mb-4 flex items-end justify-between sm:mb-8">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1 sm:gap-2 sm:mb-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse sm:w-2 sm:h-2" />
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-600 sm:text-sm">Trending</p>
                        </div>
                        <h2 className="font-display text-xl font-bold text-navy-950 sm:text-3xl md:text-4xl">Best Sellers</h2>
                    </div>
                    <Link to="/category?sort=popular" className="group flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-950 transition-colors sm:text-sm sm:gap-2">
                        View All
                        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:hidden">
                    {items.slice(0, 4).map((product) => (
                        <ProductCard key={product.id} product={{ ...product, badge: product.badge || "Best Seller" }} />
                    ))}
                </div>
                <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4 md:gap-5 lg:grid-cols-5">
                    {items.slice(0, 5).map((product) => (
                        <ProductCard key={product.id} product={{ ...product, badge: product.badge || "Best Seller" }} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BestSellers;
