import React, { useState } from "react";

const badgeStyles = {
    "Best Seller": "bg-amber-100 text-amber-800",
    "Top Rated": "bg-blue-100 text-blue-700",
    Popular: "bg-violet-100 text-violet-700",
    Premium: "bg-navy-950 text-brand-gold",
    Eco: "bg-emerald-100 text-emerald-700",
    New: "bg-rose-100 text-rose-700",
};

const buildFallbackImage = (title) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
            <rect width="1200" height="1200" fill="#faf7f2"/>
            <rect x="220" y="220" width="760" height="760" rx="48" fill="#ffffff" stroke="#e5e1d8" stroke-width="4"/>
            <circle cx="600" cy="500" r="110" fill="none" stroke="#c8a951" stroke-width="14"/>
            <path d="M520 690h160" stroke="#0b1f3a" stroke-width="18" stroke-linecap="round"/>
            <text x="600" y="800" font-family="Arial,sans-serif" font-size="38" fill="#334155" text-anchor="middle">${title}</text>
            <text x="600" y="855" font-family="Arial,sans-serif" font-size="28" fill="#94a3b8" text-anchor="middle">Image unavailable</text>
        </svg>
    `)}`;

const ImageGallery = ({ images = [], title, badge, discount }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const safeImages = images.length ? images : [buildFallbackImage(title)];
    const fallbackImage = buildFallbackImage(title);

    const moveBy = (delta) => {
        setActiveIndex((prev) => (prev + delta + safeImages.length) % safeImages.length);
    };

    return (
        <>
            <div>
                <div className="overflow-hidden rounded-[28px] border border-stone-200/60 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                    <div className="relative aspect-[0.95] sm:aspect-square bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(250,247,242,0.82)_55%,_rgba(244,239,229,0.9))]">
                        {/* Badges */}
                        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-1.5 sm:left-5 sm:top-5">
                            {discount ? (
                                <span className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                                    -{discount}%
                                </span>
                            ) : null}
                            {badge ? (
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${badgeStyles[badge] || "bg-stone-100 text-stone-700"}`}>
                                    {badge}
                                </span>
                            ) : null}
                        </div>

                        {/* Expand */}
                        <button
                            onClick={() => setLightboxOpen(true)}
                            className="absolute right-4 top-4 z-10 hidden h-10 w-10 items-center justify-center rounded-xl border border-stone-200/60 bg-white/90 text-navy-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white sm:flex"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </button>

                        {/* Arrows */}
                        {safeImages.length > 1 && (
                            <>
                                <button
                                    onClick={() => moveBy(-1)}
                                    className="absolute left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/60 bg-white/90 text-navy-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white sm:flex"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => moveBy(1)}
                                    className="absolute right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200/60 bg-white/90 text-navy-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white sm:flex"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Image */}
                        <button className="block h-full w-full p-5 sm:p-8 md:p-10" onClick={() => setLightboxOpen(true)}>
                            <img
                                src={safeImages[activeIndex]}
                                alt={`${title} - ${activeIndex + 1}`}
                                className="h-full w-full object-contain transition-opacity duration-300"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackImage; }}
                            />
                        </button>

                        {/* Counter */}
                        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/88 px-3 py-1.5 text-xs font-medium text-navy-950 shadow-sm backdrop-blur-sm sm:left-auto sm:right-4 sm:translate-x-0">
                            <span>{activeIndex + 1}/{safeImages.length}</span>
                            {safeImages.length > 1 && (
                                <div className="flex items-center gap-1 sm:hidden">
                                    {safeImages.map((_, index) => (
                                        <span key={index} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-4 bg-navy-950" : "w-1.5 bg-stone-300"}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/95 p-4 sm:p-6" onClick={() => setLightboxOpen(false)}>
                    <button className="absolute right-4 top-4 sm:right-6 sm:top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {safeImages.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); moveBy(-1); }} className="absolute left-4 sm:left-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); moveBy(1); }} className="absolute right-4 sm:right-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}

                    <img
                        src={safeImages[activeIndex]}
                        alt={title}
                        className="max-h-[85vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackImage; }}
                    />

                    {/* Lightbox counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                        {activeIndex + 1} / {safeImages.length}
                    </div>
                </div>
            )}
        </>
    );
};

export default ImageGallery;
