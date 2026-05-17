import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

const slides = [
    {
        badge: "Trusted by 10,000+ businesses",
        headline: "Discover Quality Products",
        description: "Explore thousands of products from Sri Lanka's most trusted multi-sector enterprise.",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=600&fit=crop",
        cta: "Shop Now",
        ctaLink: "/category",
    },
    {
        badge: "Flash Sale — Up to 40% Off",
        headline: "Unbeatable Deals Today",
        description: "Limited-time offers on electronics, fashion, home essentials and more.",
        image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=600&fit=crop",
        cta: "View Deals",
        ctaLink: "/category?collection=flash-deals",
    },
    {
        badge: "New Season Collection",
        headline: "Fresh Arrivals Landed",
        description: "Be the first to explore our newest products — curated for quality and style.",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=600&fit=crop",
        cta: "Explore New",
        ctaLink: "/category?sort=newest",
    },
];

const stats = [
    { value: "50K+", label: "Products" },
    { value: "120+", label: "Countries" },
    { value: "20+", label: "Years" },
    { value: "99%", label: "Satisfaction" },
];

const Hero = () => {
    const [current, setCurrent] = useState(0);
    const [touchStart, setTouchStart] = useState(null);

    const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), []);
    const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), []);

    useEffect(() => {
        const timer = setInterval(next, 6000);
        return () => clearInterval(timer);
    }, [next]);

    const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
    const handleTouchEnd = (e) => {
        if (touchStart === null) return;
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
        setTouchStart(null);
    };

    const slide = slides[current];

    return (
        <section
            className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-[#0d1520]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute right-0 top-0 h-72 w-72 -translate-y-1/3 translate-x-1/4 rounded-full bg-brand-gold/8 blur-3xl sm:h-[600px] sm:w-[600px]" />
                <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/3 rounded-full bg-brand-green/6 blur-3xl sm:h-[400px] sm:w-[400px]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 py-8 sm:py-14 md:py-20 lg:py-24">
                {/* Mobile Hero Image */}
                <div className="relative mb-6 overflow-hidden rounded-2xl sm:hidden">
                    <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-white/10">
                        <img src={slide.image} alt="" className="h-full w-full object-cover transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-navy-950/20 to-transparent" />
                    </div>
                    {/* Floating discount badge */}
                    <div className="absolute bottom-3 right-3 rounded-xl bg-brand-gold/90 px-3 py-1.5 backdrop-blur-sm">
                        <span className="text-xs font-bold text-navy-950">Up to 40% Off</span>
                    </div>
                </div>

                <div className="flex gap-5">
                    <div className="flex-1 min-w-0">
                        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10 lg:items-center">
                            {/* Text Content */}
                            <div className="space-y-4 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/[0.08] px-3 py-1.5 backdrop-blur-sm sm:px-5 sm:py-2.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-gold animate-pulse" />
                                    <span className="text-[10px] font-medium tracking-wide text-brand-gold-light sm:text-sm">{slide.badge}</span>
                                </div>

                                <h1 className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                                    {slide.headline.split(" ").map((word, i) => {
                                        const highlights = ["Quality", "Deals", "Arrivals"];
                                        return highlights.includes(word) ? (
                                            <span key={i} className="text-gradient">{word} </span>
                                        ) : (
                                            <span key={i}>{word} </span>
                                        );
                                    })}
                                </h1>

                                <p className="mx-auto max-w-xs text-sm leading-relaxed text-stone-400 sm:max-w-xl sm:text-lg lg:mx-0">{slide.description}</p>

                                <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3 lg:justify-start">
                                    <Link to={slide.ctaLink} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-6 py-3 text-sm font-semibold text-navy-950 shadow-lg shadow-brand-gold/20 transition-all hover:-translate-y-0.5 sm:w-auto sm:px-8 sm:py-4">
                                        <span>{slide.cta}</span>
                                        <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </Link>
                                    <Link to="/category" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 sm:w-auto sm:px-8 sm:py-4">
                                        Explore Categories
                                    </Link>
                                </div>

                                {/* Slide Indicators */}
                                <div className="flex items-center justify-center gap-2 pt-1 lg:justify-start">
                                    {slides.map((_, idx) => (
                                        <button key={idx} onClick={() => setCurrent(idx)} className={"h-2 rounded-full transition-all duration-500 " + (idx === current ? "w-8 bg-brand-gold" : "w-2 bg-white/20 hover:bg-white/40")} />
                                    ))}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-2 pt-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-8 lg:justify-start">
                                    {stats.map((stat) => (
                                        <div key={stat.label} className="text-center lg:text-left">
                                            <div className="text-lg font-bold text-white sm:text-2xl">{stat.value}</div>
                                            <div className="text-[9px] font-medium uppercase tracking-wider text-brand-gold/60 sm:text-xs">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Desktop Right Visual */}
                            <div className="relative hidden lg:block">
                                <div className="relative mx-auto aspect-square max-w-md">
                                    <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-brand-gold/10" />
                                    <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-gold/10 to-brand-green/5 blur-2xl" />
                                    <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rotate-3 overflow-hidden rounded-3xl border-2 border-brand-gold/20 shadow-premium-xl transition-all duration-700">
                                        <img src={slide.image} alt="TWOWAY CEYLON" className="h-full w-full object-cover transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/20 to-transparent" />
                                    </div>
                                    <div className="absolute right-0 top-8 z-10 w-48 rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-premium-xl ring-1 ring-black/5">
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green/10 text-sm">🌿</div>
                                            <div><p className="text-[10px] text-stone-500">Sustainable</p><p className="text-xs font-semibold text-navy-950">Eco Certified</p></div>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full w-[92%] rounded-full bg-gradient-to-r from-brand-green to-brand-green-light" /></div>
                                    </div>
                                    <div className="absolute bottom-12 left-0 z-10 w-52 rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-premium-xl ring-1 ring-black/5">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-xs font-semibold text-navy-950">Sales Growth</p>
                                            <span className="rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-bold text-brand-gold-dark">+34%</span>
                                        </div>
                                        <div className="flex h-10 items-end gap-1">
                                            {[40,55,35,65,50,75,60,85,70,95,80,90].map((h, i) => (<div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-brand-gold to-brand-gold-light" style={{ height: h + "%", opacity: 0.4 + i / 20 }} />))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Tiles (Desktop XL only) */}
                    <div className="hidden xl:flex flex-col gap-4 w-64 flex-shrink-0">
                        {[
                            { title: "Fashion", subtitle: "Up to 35% off", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=200&fit=crop", link: "/category/womens-clothing" },
                            { title: "Electronics", subtitle: "New arrivals", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=200&fit=crop", link: "/category/electronics" },
                        ].map((tile) => (
                            <Link key={tile.title} to={tile.link} className="group relative flex-1 overflow-hidden rounded-2xl ring-1 ring-white/10 hover:ring-brand-gold/30 transition-all duration-300">
                                <img src={tile.image} alt={tile.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/40 to-navy-950/20" />
                                <div className="relative flex flex-col justify-end h-full p-5">
                                    <h3 className="text-lg font-bold text-white font-display">{tile.title}</h3>
                                    <p className="text-sm text-brand-gold/80 font-medium">{tile.subtitle}</p>
                                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/60 group-hover:text-brand-gold transition-colors">Shop now <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute -bottom-px left-0 right-0 leading-none">
                <svg viewBox="0 0 1440 60" fill="none" className="block h-auto w-full"><path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#FAF7F2" /></svg>
            </div>
        </section>
    );
};

export default Hero;
