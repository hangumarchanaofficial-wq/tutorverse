import React from "react";

const trustItems = [
    {
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
        ),
        title: "Free Shipping",
        desc: "Orders over $50",
    },
    {
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
        title: "30-Day Returns",
        desc: "Hassle-free",
    },
    {
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: "Secure Pay",
        desc: "SSL encrypted",
    },
    {
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        title: "24/7 Support",
        desc: "Always here",
    },
];

const TrustBar = () => {
    const marqueeItems = [...trustItems, ...trustItems];

    return (
        <section className="border-b border-stone-100 bg-white">
            <div className="trustbar-mask max-w-7xl mx-auto overflow-hidden px-3 sm:px-4">
                <div className="trustbar-marquee flex w-max items-center gap-3 py-2.5 sm:gap-6 sm:py-3">
                    {marqueeItems.map((item, index) => (
                        <div
                            key={`${item.title}-${index}`}
                            aria-hidden={index >= trustItems.length}
                            className="flex min-w-fit flex-shrink-0 items-center gap-2 rounded-2xl border border-stone-100/80 bg-white px-2.5 py-1.5 sm:gap-3 sm:px-3 sm:py-2"
                        >
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-cream text-brand-gold sm:h-10 sm:w-10 sm:rounded-xl">
                                {item.icon}
                            </div>
                            <div className="min-w-0 pr-1 sm:pr-2">
                                <p className="whitespace-nowrap text-xs font-semibold leading-tight text-navy-950 sm:text-sm">{item.title}</p>
                                <p className="whitespace-nowrap text-[10px] leading-tight text-stone-400 sm:mt-0.5 sm:text-xs">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustBar;
