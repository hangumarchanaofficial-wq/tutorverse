import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { fetchCategories } from "../services/productApi";

/* ── SVG category icons ─────────────────────────────────────────── */
const catIcons = {
    "mens-clothing": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 2L8 6H4v4l2 2v8h12v-8l2-2V6h-4l-4-4z" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    "home-kitchen": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    "womens-clothing": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 2a3 3 0 013 3v1H9V5a3 3 0 013-3zM7 8h10l1 4H6l1-4zm1 4v7a2 2 0 002 2h4a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    "electronics": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" strokeLinecap="round"/></svg>),
    "sports-outdoors": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3c2.5 3 4 6 4 9s-1.5 6-4 9M12 3c-2.5 3-4 6-4 9s1.5 6 4 9M3 12h18" strokeLinecap="round"/></svg>),
    "jewelry-accessories": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 22c4.418 0 8-3.582 8-8a8 8 0 00-16 0c0 4.418 3.582 8 8 8z"/><path d="M12 2l3 5H9l3-5z" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    "beauty-health": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M9 2h6v6a3 3 0 01-6 0V2zm3 8v12M8 22h8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    "toys-games": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 7h4M12 5v4M10 15h.01M14 15h.01M10 18h.01M14 18h.01" strokeLinecap="round"/></svg>),
    "bags-luggage": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M4 13h16" strokeLinecap="round"/></svg>),
    "automotive": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M5 17h14M7 17l1-5h8l1 5M7 12l1-4h8l1 4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/></svg>),
    "food-grocery": (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></svg>),
};
const fallbackIcon = (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const getCatIcon = (slug) => catIcons[slug] || fallbackIcon;

const HARDCODED_CATEGORIES = [
    { name: "Men's Clothing", slug: "mens-clothing", subcategories: ["T-Shirts","Shirts","Pants","Jeans","Jackets","Suits","Sweaters"] },
    { name: "Home & Kitchen", slug: "home-kitchen", subcategories: ["Cookware","Dinnerware","Kitchen Appliances","Home Decor","Bedding","Storage"] },
    { name: "Women's Clothing", slug: "womens-clothing", subcategories: ["Dresses","Tops","Blouses","Skirts","Pants","Outerwear","Knitwear"] },
    { name: "Electronics", slug: "electronics", subcategories: ["Computers","TVs","Audio","Cameras","Gaming","Wearables"] },
    { name: "Sports & Outdoors", slug: "sports-outdoors", subcategories: ["Exercise Equipment","Outdoor Recreation","Team Sports","Cycling","Camping"] },
    { name: "Jewelry & Accessories", slug: "jewelry-accessories", subcategories: ["Necklaces","Rings","Earrings","Bracelets","Watches","Sunglasses"] },
    { name: "Beauty & Health", slug: "beauty-health", subcategories: ["Skincare","Makeup","Hair Care","Fragrance","Bath & Body","Vitamins"] },
    { name: "Toys & Games", slug: "toys-games", subcategories: ["Action Figures","Board Games","Puzzles","Building Sets","Dolls","RC Toys"] },
    { name: "Bags & Luggage", slug: "bags-luggage", subcategories: ["Backpacks","Handbags","Suitcases","Travel Bags","Wallets"] },
    { name: "Automotive", slug: "automotive", subcategories: ["Car Parts","Car Accessories","Tools","Oils & Fluids","Car Electronics"] },
    { name: "Food & Grocery", slug: "food-grocery", subcategories: ["Snacks","Beverages","Pantry Staples","Organic Foods","Spices","Ceylon Tea"] },
];

const localCatDataBySlug = Object.fromEntries(
    HARDCODED_CATEGORIES.map((c) => [c.slug, c])
);

const quickNavLinks = [
    { name: "Flash Deals", highlight: true, query: { collection: "flash-deals" } },
    { name: "New In", query: { collection: "new-arrivals" } },
    { name: "Best Sellers", query: { collection: "best-sellers" } },
    { name: "Electronics", slug: "electronics" },
    { name: "Fashion", query: { collection: "fashion" } },
    { name: "Home", query: { collection: "home-garden" } },
    { name: "Beauty", slug: "beauty-health" },
    { name: "Sports", slug: "sports-outdoors" },
];

/* Featured visual categories for mobile drawer (image grid) */
const featuredVisualCats = [
    { name: "Fashion", slug: "womens-clothing", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop", gradient: "from-rose-500/80" },
    { name: "Electronics", slug: "electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop", gradient: "from-blue-600/80" },
    { name: "Home", slug: "home-kitchen", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop", gradient: "from-amber-600/80" },
    { name: "Beauty", slug: "beauty-health", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop", gradient: "from-pink-500/80" },
    { name: "Sports", slug: "sports-outdoors", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&h=200&fit=crop", gradient: "from-emerald-600/80" },
    { name: "Jewelry", slug: "jewelry-accessories", image: "https://images.pexels.com/photos/8105118/pexels-photo-8105118.jpeg?w=200&h=200&fit=crop", gradient: "from-violet-600/80" },
];

const normalizeSlug = (v = "") => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const buildRoute = ({ slug, query } = {}) => { const s = new URLSearchParams(Object.entries(query || {}).filter(([, v]) => v)).toString(); return (slug ? "/category/" + slug : "/category") + (s ? "?" + s : ""); };

/* ── Icon components ─── */
const IconMenu = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>);
const IconX = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18"/></svg>);
const IconSearch = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg>);
const IconCart = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>);
const IconUser = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconHeart = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>);
const IconChevron = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="m9 18 6-6-6-6"/></svg>);
const IconMapPin = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const IconStore = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></svg>);
const IconHeadphones = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>);
const IconGlobe = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>);
const IconPackage = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path strokeLinecap="round" d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>);
const IconTag = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1.5"/></svg>);
const IconFlash = ({ className }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>);

const Navbar = () => {
    const navigate = useNavigate();
    const { cartCount = 0, wishlistCount = 0 } = useCart();
    const { isAdmin, user } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [megaOpen, setMegaOpen] = useState(false);
    const [allCategories, setAllCategories] = useState(HARDCODED_CATEGORIES);
    const [activeCategory, setActiveCategory] = useState(HARDCODED_CATEGORIES[0]);
    const [mobileView, setMobileView] = useState("main"); /* main | categories | subcategory */
    const [selectedMobileCat, setSelectedMobileCat] = useState(null);
    const megaRef = useRef(null);
    const megaTimer = useRef(null);

    const loadCategories = useCallback(async () => {
        try {
            const apiCats = await fetchCategories();
            if (!apiCats || apiCats.length === 0) return;
            const merged = apiCats.map((ac) => {
                const local = localCatDataBySlug[ac.slug] || {};
                return {
                    name: ac.name,
                    slug: ac.slug,
                    subcategories: local.subcategories || [],
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
            if (!cancelled && result) {
                setAllCategories(result);
                setActiveCategory(result[0]);
            }
        });
        return () => { cancelled = true; };
    }, [loadCategories]);

    useEffect(() => { const h = () => setIsScrolled(window.scrollY > 12); window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []);
    useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [mobileOpen]);
    useEffect(() => { const h = (e) => { if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    useEffect(() => { const h = (e) => { if (e.key === "Escape") { setMobileOpen(false); setMegaOpen(false); } }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, []);

    const closeMobile = () => { setMobileOpen(false); setMobileView("main"); setSelectedMobileCat(null); };
    const megaEnter = () => { clearTimeout(megaTimer.current); setMegaOpen(true); };
    const megaLeave = () => { megaTimer.current = setTimeout(() => setMegaOpen(false), 140); };
    const go = ({ slug, query } = {}) => { navigate(buildRoute({ slug, query })); closeMobile(); setMegaOpen(false); };

    const handleSearch = (e) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) { navigate("/category"); closeMobile(); return; }
        const norm = normalizeSlug(q);
        const match = allCategories.find((c) => c.slug === norm || c.name.toLowerCase() === q.toLowerCase());
        navigate(match ? buildRoute({ slug: match.slug }) : buildRoute({ query: { q } }));
        closeMobile();
    };

    const openSubcategory = (cat) => { setSelectedMobileCat(cat); setMobileView("subcategory"); };

    return (
        <header className="sticky top-0 z-50">
            {/* ─── DESKTOP UTILITY BAR ─── */}
            <div className="hidden border-b border-navy-900/50 bg-navy-950 text-[11px] text-white/60 lg:block">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><IconMapPin className="h-3 w-3 text-brand-gold/70" />Ship to Sri Lanka &amp; 120+ countries</span>
                        <span className="h-3 w-px bg-white/10" />
                        <span className="text-brand-gold-light/80">Free shipping on orders over </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1.5 hover:text-brand-gold transition-colors"><IconStore className="h-3 w-3" />Sell on TWOWAY</button>
                        <button className="flex items-center gap-1.5 hover:text-brand-gold transition-colors"><IconHeadphones className="h-3 w-3" />Help</button>
                        <span className="h-3 w-px bg-white/10" />
                        <span className="flex items-center gap-1.5"><IconGlobe className="h-3 w-3" />EN / LKR</span>
                    </div>
                </div>
            </div>

            {/* ─── MAIN NAV BAR ─── */}
            <nav className={"transition-all duration-300 " + (isScrolled ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]" : "bg-white")}>
                <div className="mx-auto max-w-7xl px-3 sm:px-4">
                    <div className="flex h-14 items-center gap-2 sm:h-16 lg:grid lg:h-[72px] lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:items-center lg:gap-6">
                        <Link to="/" className="flex items-center lg:justify-self-start" onClick={closeMobile}>
                            <div className="block"><p className="font-display text-[15px] font-bold leading-none tracking-tight text-navy-950 sm:text-lg">TWOWAY</p><p className="text-[7px] font-semibold uppercase tracking-[0.3em] text-brand-gold/80 sm:text-[9px]">CEYLON</p></div>
                        </Link>
                        {/* Desktop search */}
                        <div className="hidden lg:block">
                            <form onSubmit={handleSearch} className="mx-auto w-full max-w-3xl">
                                <div className="flex h-11 items-center rounded-full border border-stone-200 bg-stone-50/80 transition-all focus-within:border-brand-gold/40 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(200,169,81,0.08)]">
                                    <IconSearch className="ml-4 h-4 w-4 text-stone-400" />
                                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products, brands, categories..." className="h-full flex-1 bg-transparent px-3 text-sm text-navy-950 placeholder:text-stone-400 focus:outline-none" />
                                    <button type="submit" className="mr-1 h-8 rounded-full bg-navy-950 px-5 text-xs font-semibold text-white hover:bg-navy-800 transition-colors">Search</button>
                                </div>
                            </form>
                        </div>
                        {/* Right icons */}
                        <div className="ml-auto flex items-center gap-0.5 sm:gap-1 lg:ml-0 lg:justify-self-end lg:gap-1">
                            <div className="hidden lg:flex items-center gap-0.5">
                                <Link to={user ? "/account" : "/login"} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-navy-700 hover:bg-stone-50 transition-colors"><IconUser className="h-[18px] w-[18px]" /><span>{user ? "Account" : "Sign In"}</span></Link>
                            </div>
                            <Link to="/category" className="relative hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl text-navy-700 hover:bg-stone-50 transition-colors" aria-label="Wishlist">
                                <IconHeart className="h-[20px] w-[20px]" />
                                {wishlistCount > 0 && (<span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{wishlistCount > 9 ? "9+" : wishlistCount}</span>)}
                            </Link>
                            <button onClick={() => { setMobileOpen(true); setMobileView("main"); }} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-navy-700 hover:bg-stone-50 transition-colors lg:hidden" aria-label="Menu"><IconMenu className="h-[20px] w-[20px]" /></button>
                            <Link to="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-navy-700 hover:bg-stone-50 transition-colors" aria-label="Cart">
                                <IconCart className="h-[20px] w-[20px]" />
                                {cartCount > 0 && (<span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-gold px-1 text-[9px] font-bold text-navy-950">{cartCount > 99 ? "99+" : cartCount}</span>)}
                            </Link>
                        </div>
                    </div>
                    {/* Mobile search */}
                    <div className="pb-3 lg:hidden">
                        <form onSubmit={handleSearch}>
                            <div className="flex h-11 items-center rounded-full border border-stone-200/80 bg-stone-50/60 px-1 transition-all focus-within:border-brand-gold/30 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(200,169,81,0.06)]">
                                <IconSearch className="ml-3 h-4 w-4 flex-shrink-0 text-stone-400" />
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products, brands, categories" className="h-full flex-1 bg-transparent px-2.5 text-[13px] text-navy-950 placeholder:text-stone-400 focus:outline-none" />
                                <button type="submit" className="mr-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy-950 text-white active:bg-navy-800 transition-colors"><IconSearch className="h-3.5 w-3.5" /></button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ─── DESKTOP MEGA-MENU BAR ─── */}
                <div className="hidden border-t border-stone-100 lg:block" ref={megaRef}>
                    <div className="mx-auto grid max-w-7xl grid-cols-[220px_minmax(0,1fr)_220px] items-center px-4">
                        <div className="relative justify-self-start" onMouseEnter={megaEnter} onMouseLeave={megaLeave}>
                            <button className={"inline-flex h-11 items-center gap-2 px-4 text-sm font-semibold transition-colors " + (megaOpen ? "bg-navy-950 text-white rounded-t-xl" : "text-navy-950 hover:text-brand-gold-dark")}>
                                <IconMenu className="h-4 w-4" />All Departments
                                <svg className={"h-3.5 w-3.5 transition-transform " + (megaOpen ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="m6 9 6 6 6-6"/></svg>
                            </button>
                            {megaOpen && (
                                <div className="absolute left-0 top-full z-50 flex w-[880px] overflow-hidden rounded-b-2xl rounded-tr-2xl border border-stone-200 bg-white shadow-premium-xl" onMouseEnter={megaEnter} onMouseLeave={megaLeave}>
                                    <div className="w-[260px] border-r border-stone-100 bg-stone-50/60 p-2">
                                        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Departments</p>
                                        <div className="max-h-[440px] space-y-0.5 overflow-y-auto scrollbar-hide">
                                            {allCategories.map((c) => (
                                                <button key={c.slug} onMouseEnter={() => setActiveCategory(c)} onClick={() => go({ slug: c.slug })} className={"flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors " + (activeCategory.slug === c.slug ? "bg-white font-semibold text-navy-950 shadow-sm" : "text-stone-600 hover:bg-white")}>
                                                    <span className={activeCategory.slug === c.slug ? "text-brand-gold-dark" : "text-stone-400"}>{getCatIcon(c.slug)}</span>
                                                    <span className="truncate flex-1">{c.name}</span>
                                                    <IconChevron className="h-3.5 w-3.5 text-stone-300 flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 p-6">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Browse</p>
                                        <h3 className="mt-1.5 text-xl font-bold text-navy-950">{activeCategory.name}</h3>
                                        <div className="mt-5 grid grid-cols-3 gap-2">
                                            {activeCategory.subcategories.map((sub) => (
                                                <button key={sub} onClick={() => go({ slug: activeCategory.slug, query: { sub: normalizeSlug(sub) } })} className="rounded-xl border border-stone-100 px-3 py-2.5 text-left text-sm text-stone-600 transition-colors hover:border-brand-gold/20 hover:bg-brand-cream hover:text-navy-950">{sub}</button>
                                            ))}
                                        </div>
                                        <Link to={"/category/" + activeCategory.slug} onClick={() => setMegaOpen(false)} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-gold-dark hover:text-brand-gold transition-colors">View all {activeCategory.name}<IconChevron className="h-3.5 w-3.5" /></Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex min-w-0 items-center justify-center">
                            <div className="mr-3 h-6 w-px bg-stone-200" />
                            <div className="flex items-center justify-center gap-0.5 overflow-x-auto hide-scrollbar scrollbar-hide">
                                {quickNavLinks.map((l) => (<button key={l.name} onClick={() => go(l)} className={"flex-shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors " + (l.highlight ? "text-red-600 hover:bg-red-50 font-semibold" : "text-navy-700 hover:bg-stone-50 hover:text-navy-950")}>{l.name}</button>))}
                            </div>
                        </div>
                        <div />
                    </div>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ─── PREMIUM MOBILE DRAWER ─── (Amazon/ASOS/NET-A-PORTER) */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeMobile} style={{ animation: "fadeIn .2s ease" }} />

                    {/* Drawer panel */}
                    <div className="absolute inset-y-0 left-0 flex w-full max-w-full flex-col bg-white shadow-[8px_0_30px_rgba(0,0,0,0.12)]" style={{ animation: "slideInLeft .28s cubic-bezier(.22,1,.36,1)" }}>

                        {/* ── HEADER: Profile area ── */}
                        <div className="flex-shrink-0 bg-gradient-to-br from-navy-950 via-navy-900 to-[#0d1520] px-5 pb-5 pt-safe-top">
                            <div className="flex items-center justify-between pt-4 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-gold/10 ring-2 ring-brand-gold/20">
                                        <IconUser className="h-5 w-5 text-brand-gold" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{user ? `Hi, ${(user.displayName || user.email || "").split(" ")[0] || "there"}` : "Welcome"}</p>
                                        <Link to={user ? "/account" : "/login"} onClick={closeMobile} className="text-xs text-brand-gold hover:text-brand-gold-light transition-colors">
                                            {user ? "View account" : "Sign In / Register"}
                                        </Link>
                                    </div>
                                </div>
                                <button onClick={closeMobile} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all">
                                    <IconX className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Quick action row */}
                            <div className="mt-1 grid grid-cols-4 gap-2">
                                {[
                                    { icon: IconPackage, label: "Orders", to: user ? "/account" : "/login" },
                                    { icon: IconHeart, label: "Wishlist", to: "/category", count: wishlistCount },
                                    { icon: IconCart, label: "Cart", to: "/cart", count: cartCount },
                                    { icon: IconTag, label: "Coupons", to: "/category?collection=flash-deals" },
                                ].map((a) => (
                                    <Link key={a.label} to={a.to} onClick={closeMobile} className="group relative flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.07] py-2.5 transition-colors hover:bg-white/[0.12]">
                                        <div className="relative">
                                            <a.icon className="h-5 w-5 text-white/70 group-hover:text-brand-gold transition-colors" />
                                            {a.count > 0 && (<span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-gold px-1 text-[8px] font-bold text-navy-950">{a.count > 9 ? "9+" : a.count}</span>)}
                                        </div>
                                        <span className="text-[10px] font-medium text-white/50">{a.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* ── SCROLLABLE BODY ── */}
                        <div className="flex-1 overflow-y-auto overscroll-contain">

                            {/* === MAIN VIEW === */}
                            {mobileView === "main" && (
                                <div>
                                    {/* Promotional banner */}
                                    <div className="mx-4 mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-gold/10 via-brand-cream to-brand-gold/5 p-4 ring-1 ring-brand-gold/15">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-gold to-brand-gold-dark shadow-sm">
                                                <IconFlash className="h-5 w-5 text-navy-950" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-navy-950">Flash Sale Live!</p>
                                                <p className="text-[10px] text-stone-500">Up to 65% off — limited time deals</p>
                                            </div>
                                            <button onClick={() => { go({ query: { collection: "flash-deals" } }); }} className="flex-shrink-0 rounded-full bg-navy-950 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-navy-800 transition-colors">Shop</button>
                                        </div>
                                    </div>

                                    {/* Visual category grid */}
                                    <div className="px-4 pt-5">
                                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Shop by Category</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {featuredVisualCats.map((vc) => (
                                                <button key={vc.slug} onClick={() => go({ slug: vc.slug })} className="group relative aspect-square overflow-hidden rounded-2xl">
                                                    <img src={vc.image} alt={vc.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                                    <div className={"absolute inset-0 bg-gradient-to-t " + vc.gradient + " to-transparent"} />
                                                    <div className="absolute inset-x-0 bottom-0 p-2">
                                                        <p className="text-[11px] font-bold text-white drop-shadow-sm">{vc.name}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Browse all button */}
                                    <div className="px-4 pt-3">
                                        <button onClick={() => setMobileView("categories")} className="flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5 text-sm font-semibold text-navy-950 transition-all hover:border-brand-gold/20 hover:shadow-sm active:bg-stone-50">
                                            <span className="flex items-center gap-2.5">
                                                <IconMenu className="h-4 w-4 text-stone-400" />
                                                All Categories
                                            </span>
                                            <IconChevron className="h-4 w-4 text-stone-400" />
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="mx-4 my-4 h-px bg-stone-100" />

                                    {/* Quick links */}
                                    <div className="px-4 pb-2">
                                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400">Quick Links</p>
                                        <div className="space-y-0.5">
                                            {[
                                                { icon: IconFlash, label: "Flash Deals", highlight: true, query: { collection: "flash-deals" } },
                                                { icon: IconTag, label: "New Arrivals", query: { collection: "new-arrivals" } },
                                                { icon: IconHeart, label: "Best Sellers", query: { collection: "best-sellers" } },
                                                { icon: IconStore, label: "Sell on TWOWAY", to: "/category" },
                                                { icon: IconHeadphones, label: "Help & Support", to: "/category" },
                                            ].map((item) => (
                                                <button key={item.label} onClick={() => { if (item.to) { navigate(item.to); closeMobile(); } else go(item); }} className={"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-stone-50 active:bg-stone-100 " + (item.highlight ? "font-semibold text-red-600" : "font-medium text-navy-800")}>
                                                    <item.icon className={"h-[18px] w-[18px] " + (item.highlight ? "text-red-500" : "text-stone-400")} />
                                                    {item.label}
                                                    <IconChevron className="ml-auto h-3.5 w-3.5 text-stone-300" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bottom spacing */}
                                    <div className="h-6" />
                                </div>
                            )}

                            {/* === ALL CATEGORIES VIEW === */}
                            {mobileView === "categories" && (
                                <div>
                                    {/* Back header */}
                                    <button onClick={() => setMobileView("main")} className="sticky top-0 z-10 flex w-full items-center gap-3 border-b border-stone-100 bg-white/95 px-4 py-3.5 text-left backdrop-blur-sm">
                                        <svg className="h-4 w-4 text-stone-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="m15 18-6-6 6-6"/></svg>
                                        <span className="text-sm font-semibold text-navy-950">All Categories</span>
                                    </button>
                                    <div className="py-2">
                                        {allCategories.map((c) => (
                                            <button key={c.slug} onClick={() => openSubcategory(c)} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-stone-50 active:bg-stone-100">
                                                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-cream text-stone-500">
                                                    {getCatIcon(c.slug)}
                                                </span>
                                                <span className="flex-1 text-sm font-medium text-navy-900">{c.name}</span>
                                                <IconChevron className="h-4 w-4 text-stone-300" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* === SUBCATEGORY VIEW === */}
                            {mobileView === "subcategory" && selectedMobileCat && (
                                <div>
                                    <button onClick={() => setMobileView("categories")} className="sticky top-0 z-10 flex w-full items-center gap-3 border-b border-stone-100 bg-white/95 px-4 py-3.5 text-left backdrop-blur-sm">
                                        <svg className="h-4 w-4 text-stone-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="m15 18-6-6 6-6"/></svg>
                                        <span className="text-sm font-semibold text-navy-950">{selectedMobileCat.name}</span>
                                    </button>
                                    {/* View all button */}
                                    <button onClick={() => go({ slug: selectedMobileCat.slug })} className="flex w-full items-center gap-3 border-b border-stone-100 px-5 py-3.5 text-left bg-brand-cream/40">
                                        <span className="text-sm font-bold text-brand-gold-dark">View All {selectedMobileCat.name}</span>
                                        <IconChevron className="ml-auto h-4 w-4 text-brand-gold-dark" />
                                    </button>
                                    <div className="py-2">
                                        {selectedMobileCat.subcategories.map((sub) => (
                                            <button key={sub} onClick={() => go({ slug: selectedMobileCat.slug, query: { sub: normalizeSlug(sub) } })} className="flex w-full items-center px-5 py-3 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50 hover:text-navy-950 active:bg-stone-100">
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── FOOTER ── */}
                        <div className="flex-shrink-0 border-t border-stone-100 bg-stone-50/50 px-5 py-3">
                            <div className="flex items-center justify-between text-[11px] text-stone-400">
                                <div className="flex items-center gap-1.5">
                                    <IconGlobe className="h-3.5 w-3.5" />
                                    <span>EN / LKR</span>
                                </div>
                                <span>&copy; 2025 TWOWAY CEYLON</span>
                            </div>
                        </div>
                    </div>

                    {/* CSS animations inline */}
                    <style>{"\
                        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }\
                        @keyframes slideInLeft { from { transform: translateX(-100%) } to { transform: translateX(0) } }\
                    "}</style>
                </div>
            )}
        </header>
    );
};

export default Navbar;
