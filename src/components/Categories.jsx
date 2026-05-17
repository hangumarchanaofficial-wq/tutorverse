import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../services/productApi";

const HARDCODED_CATEGORIES = [
    { name: "Men's", slug: "mens-clothing", image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&h=300&fit=crop", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M12 2L8 6H4v4l2 2v8h12v-8l2-2V6h-4l-4-4z" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { name: "Women's", slug: "womens-clothing", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M12 2a3 3 0 013 3v1H9V5a3 3 0 013-3zM7 8h10l1 4H6l1-4zm1 4v7a2 2 0 002 2h4a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { name: "Electronics", slug: "electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" strokeLinecap="round"/></svg>) },
    { name: "Home", slug: "home-kitchen", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { name: "Beauty", slug: "beauty-health", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M9 2h6v6a3 3 0 01-6 0V2zm3 8v12M8 22h8" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { name: "Sports", slug: "sports-outdoors", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=300&fit=crop", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3c2.5 3 4 6 4 9s-1.5 6-4 9M12 3c-2.5 3-4 6-4 9s1.5 6 4 9M3 12h18" strokeLinecap="round"/></svg>) },
    { name: "Jewelry", slug: "jewelry-accessories", image: "https://images.pexels.com/photos/8105118/pexels-photo-8105118.jpeg?cs=srgb&dl=pexels-solodsha-8105118.jpg&fm=jpg", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M12 22c4.418 0 8-3.582 8-8a8 8 0 00-16 0c0 4.418 3.582 8 8 8z"/><path d="M12 2l3 5H9l3-5z" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
    { name: "Toys", slug: "toys-games", image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 7h4M12 5v4M10 15h.01M14 15h.01M10 18h.01M14 18h.01" strokeLinecap="round"/></svg>) },
    { name: "Bags", slug: "bags-luggage", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M4 13h16" strokeLinecap="round"/></svg>) },
    { name: "Grocery", slug: "food-grocery", image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&h=300&fit=crop", icon: (<svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></svg>) },
];

const localDataBySlug = Object.fromEntries(
    HARDCODED_CATEGORIES.map((c) => [c.slug, c])
);

const Categories = () => {
    const scrollRef = useRef(null);
    const scroll = (dir) => { if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 320, behavior: "smooth" }); };

    const [categories, setCategories] = useState(HARDCODED_CATEGORIES);

    const loadCategories = useCallback(async () => {
        try {
            const apiCats = await fetchCategories();
            if (!apiCats || apiCats.length === 0) return;
            const merged = apiCats.map((ac) => {
                const local = localDataBySlug[ac.slug] || {};
                return {
                    name: ac.name,
                    slug: ac.slug,
                    image: local.image || "",
                    icon: local.icon || null,
                };
            });
            return merged;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        loadCategories().then((result) => {
            if (!cancelled && result) setCategories(result);
        });
        return () => { cancelled = true; };
    }, [loadCategories]);

    return (
        <section className="relative hidden overflow-hidden bg-navy-950 py-12 md:py-18 sm:block">
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(200,169,81,0.5) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl -translate-y-1/2" />

            <div className="relative mx-auto max-w-7xl px-3 sm:px-4">
                <div className="mb-8 flex items-end justify-between">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">Shop by Category</p>
                        <h2 className="font-display text-3xl font-bold text-white md:text-4xl">Popular Categories</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-brand-gold flex items-center justify-center transition-all ring-1 ring-white/10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                        <button onClick={() => scroll(1)} className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-brand-gold flex items-center justify-center transition-all ring-1 ring-white/10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                        <Link to="/category" className="ml-3 group flex items-center gap-2 text-sm font-semibold text-brand-gold/80 hover:text-brand-gold transition-colors">View All<svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></Link>
                    </div>
                </div>

                {/* Desktop: scrollable image cards */}
                <div ref={scrollRef} className="flex -mx-4 gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory hide-scrollbar scrollbar-hide">
                    {categories.map((cat) => (
                        <Link key={cat.slug} to={"/category/" + cat.slug} className="group relative aspect-[3/4] w-[180px] flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-1 ring-white/10 transition-all duration-500 hover:ring-brand-gold/30 snap-start md:w-[200px]">
                            <img src={cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/75 via-navy-950/25 to-navy-950/20" />
                            <div className="relative flex h-full items-center justify-center p-5">
                                <div className="rounded-full border border-white/15 bg-navy-950/35 px-5 py-3 backdrop-blur-md shadow-[0_12px_40px_rgba(5,10,20,0.35)] transition-all duration-300 group-hover:border-brand-gold/35">
                                    <h3 className="text-center font-display text-lg font-semibold leading-tight text-white md:text-[1.35rem]">{cat.name}</h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Categories;
