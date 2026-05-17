import React from "react";
import { Link } from "react-router-dom";

const banners = [
    { title: "Season Sale", subtitle: "Up to 40% off on fashion & accessories", cta: "Shop the Sale", link: "/category/womens-clothing", bg: "from-brand-gold/20 via-brand-gold/10 to-transparent", accent: "text-brand-gold-dark", btnBg: "bg-gradient-to-r from-brand-gold to-brand-gold-dark text-navy-950", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=300&fit=crop" },
    { title: "Tech Week", subtitle: "Best deals on electronics & gadgets", cta: "Explore Tech", link: "/category/electronics", bg: "from-blue-500/15 via-indigo-500/10 to-transparent", accent: "text-blue-700", btnBg: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&h=300&fit=crop" },
];

const PromoBanner = () => {
    return (
        <section className="bg-brand-cream py-6 sm:py-10 md:py-14">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 md:gap-5">
                    {banners.map((banner) => (
                        <Link key={banner.title} to={banner.link} className="group relative overflow-hidden rounded-xl ring-1 ring-stone-200/60 hover:ring-brand-gold/30 hover:shadow-card-hover transition-all duration-500 sm:rounded-2xl">
                            <div className={"absolute inset-0 bg-gradient-to-r " + banner.bg} />
                            <img src={banner.image} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-25 transition-opacity duration-500 group-hover:scale-105" />
                            <div className="relative flex min-h-[140px] flex-col justify-center p-4 sm:min-h-[200px] sm:p-8 md:p-10">
                                <p className={"mb-1 text-[9px] font-semibold uppercase tracking-[0.22em] sm:mb-2 sm:text-[11px] " + banner.accent}>{banner.title}</p>
                                <h3 className="mb-3 max-w-[200px] font-display text-lg font-bold text-navy-950 sm:mb-4 sm:max-w-xs sm:text-2xl md:text-3xl">{banner.subtitle}</h3>
                                <div>
                                    <span className={"inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold shadow-lg transition-all group-hover:-translate-y-0.5 sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm " + banner.btnBg}>
                                        {banner.cta}
                                        <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PromoBanner;
