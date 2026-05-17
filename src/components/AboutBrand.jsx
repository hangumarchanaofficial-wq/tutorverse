import React from "react";

const AboutBrand = () => {
    return (
        <section className="py-16 md:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Image Side */}
                    <div className="relative">
                        <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-premium-xl ring-1 ring-black/5">
                            <img
                                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop"
                                alt="TWOWAY CEYLON Headquarters"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/40 via-transparent to-transparent" />
                        </div>

                        {/* Floating Stats Card */}
                        <div className="absolute -bottom-6 -right-4 md:right-8 bg-white rounded-2xl shadow-premium-xl p-5 w-52 ring-1 ring-black/5">
                            <div className="text-3xl font-extrabold text-gradient font-display">20+</div>
                            <div className="text-sm text-stone-500 font-medium">Years of Excellence</div>
                            <div className="mt-3 flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-brand-gold to-brand-gold-light"
                                    />
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-brand-cream flex items-center justify-center text-[10px] font-bold text-brand-gold-dark">
                                    +1K
                                </div>
                            </div>
                            <p className="text-[10px] text-stone-400 mt-2">Happy Partners</p>
                        </div>

                        {/* Decorative element */}
                        <div className="absolute -top-4 -left-4 w-24 h-24 bg-brand-gold/10 rounded-2xl -z-10" />
                        <div className="absolute -bottom-3 -left-3 w-16 h-16 border-2 border-brand-gold/20 rounded-xl -z-10" />
                    </div>

                    {/* Content Side */}
                    <div>
                        <p className="text-sm font-semibold text-brand-gold uppercase tracking-widest mb-3">
                            About TWOWAY CEYLON
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold text-navy-950 mb-6 leading-tight font-display">
                            Building Sustainable Futures Since{" "}
                            <span className="text-gradient">2003</span>
                        </h2>
                        <div className="space-y-4 text-stone-600 leading-relaxed">
                            <p>
                                TWOWAY CEYLON is Sri Lanka's premier multi-sector enterprise,
                                delivering quality products and services across agriculture,
                                construction, manufacturing, and general commerce. With over two
                                decades of industry expertise, we've built a reputation for
                                reliability, innovation, and unwavering commitment to quality.
                            </p>
                            <p>
                                Our mission is rooted in sustainability — from eco-friendly
                                agricultural practices to green manufacturing processes. We
                                believe that business growth and environmental responsibility go
                                hand in hand, and every product we offer reflects this philosophy.
                            </p>
                        </div>

                        {/* Key Points */}
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            {[
                                { icon: "🌱", text: "Sustainable sourcing & manufacturing" },
                                { icon: "🏆", text: "ISO certified quality standards" },
                                { icon: "🌍", text: "Exports to 120+ countries" },
                                { icon: "🤝", text: "10,000+ trusted partnerships" },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-3 p-3.5 bg-brand-cream rounded-xl border border-stone-200/50 hover:border-brand-gold/20 hover:shadow-premium transition-all duration-300"
                                >
                                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                                    <span className="text-sm font-medium text-navy-800">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <button className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-navy-950 to-navy-800 hover:from-navy-800 hover:to-navy-700 text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-premium-lg group">
                            <span>Learn More About Us</span>
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutBrand;
