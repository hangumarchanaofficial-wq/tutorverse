import React from "react";

const features = [
    {
        icon: (<svg className="h-6 w-6 sm:h-8 sm:w-8" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="15.5" stroke="currentColor" strokeWidth="1.8" /><path d="M24 15v9l6 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 10l3 3M34 10l-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
        eyebrow: "Legacy", title: "20+ Years Experience",
        description: "Two decades of sector knowledge across agriculture, trade, sourcing, and industrial supply.",
        accent: "text-brand-gold-dark", surface: "bg-brand-cream", ring: "ring-brand-cream-dark",
    },
    {
        icon: (<svg className="h-6 w-6 sm:h-8 sm:w-8" viewBox="0 0 48 48" fill="none"><path d="M24 8l12 4.8v10.8c0 7-4.9 12.4-12 15.4-7.1-3-12-8.4-12-15.4V12.8L24 8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="m18.5 24 4 4 7-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>),
        eyebrow: "Assurance", title: "Trusted Quality",
        description: "Documented standards, tighter quality control, and consistent product performance.",
        accent: "text-brand-green", surface: "bg-emerald-50", ring: "ring-emerald-100",
    },
    {
        icon: (<svg className="h-6 w-6 sm:h-8 sm:w-8" viewBox="0 0 48 48" fill="none"><path d="M31 13c-8.5 1.7-13 8.1-14 16.5 8.6-.4 14.6-4.8 17-13.5-3.2.2-5.1-1.2-3-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M17 31c1.7-2.5 4.6-4.8 8.8-6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M14 35h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>),
        eyebrow: "Responsibility", title: "Sustainable Practices",
        description: "Responsible sourcing and lower-impact operations for long-term resilience.",
        accent: "text-teal-600", surface: "bg-teal-50", ring: "ring-teal-100",
    },
    {
        icon: (<svg className="h-6 w-6 sm:h-8 sm:w-8" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="14.5" stroke="currentColor" strokeWidth="1.8" /><path d="M10 24h28M24 9.5c4.4 4.8 6.7 9.6 6.7 14.5s-2.3 9.7-6.7 14.5c-4.4-4.8-6.7-9.6-6.7-14.5S19.6 14.3 24 9.5Z" stroke="currentColor" strokeWidth="1.8" /></svg>),
        eyebrow: "Network", title: "Global Reach",
        description: "A reliable export and logistics network serving buyers across 120+ countries.",
        accent: "text-blue-600", surface: "bg-blue-50", ring: "ring-blue-100",
    },
];

const WhyChooseUs = () => {
    return (
        <section className="relative overflow-hidden bg-white py-8 sm:py-12 md:py-18">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-cream/50 to-transparent" />
            <div className="relative mx-auto max-w-7xl px-3 sm:px-4">
                <div className="mx-auto mb-6 max-w-3xl text-center sm:mb-12">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-gold sm:mb-3 sm:text-sm">Our Advantages</p>
                    <h2 className="font-display text-xl font-extrabold tracking-tight text-navy-950 sm:text-3xl md:text-4xl">Why Choose TWOWAY CEYLON</h2>
                    <p className="mt-3 text-xs leading-relaxed text-stone-500 sm:mt-4 sm:text-base">Multi-sector experience with disciplined quality standards and export-ready execution.</p>
                </div>
                {/* Mobile: 2-col compact grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:hidden">
                    {features.map((f) => (
                        <article key={f.title} className="relative overflow-hidden rounded-xl border border-stone-200/60 bg-white p-3.5 shadow-premium">
                            <div className={"mb-3 inline-flex rounded-xl p-2.5 ring-1 " + f.surface + " " + f.ring + " " + f.accent}>{f.icon}</div>
                            <p className={"mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] " + f.accent}>{f.eyebrow}</p>
                            <h3 className="font-display text-sm font-bold leading-tight text-navy-950">{f.title}</h3>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-stone-500">{f.description}</p>
                        </article>
                    ))}
                </div>
                {/* Desktop */}
                <div className="hidden sm:grid sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
                    {features.map((f) => (
                        <article key={f.title} className="group relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white p-7 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-stone-200 to-transparent transition-all duration-300 group-hover:via-brand-gold" />
                            <div className={"mb-5 inline-flex rounded-2xl p-4 ring-1 " + f.surface + " " + f.ring + " " + f.accent}>{f.icon}</div>
                            <p className={"mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] " + f.accent}>{f.eyebrow}</p>
                            <h3 className="font-display text-xl font-bold leading-tight text-navy-950 sm:text-2xl">{f.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-stone-500 sm:leading-relaxed">{f.description}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
