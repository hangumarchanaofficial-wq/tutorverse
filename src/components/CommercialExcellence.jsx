import React from "react";

export default function CommercialExcellence() {
    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Legacy &amp; Vision</p>
            <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Text */}
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                        20+ Years of <br /> Commercial Excellence
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                        TWOWAY CEYLON stands at the intersection of Sri Lanka's rich heritage and the future of
                        global trade. We believe in "Practical Modernism" — utilizing centuries-old organic
                        practices while incorporating cutting-edge supply chain technology.
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-8">
                        Our commitment to sustainability isn't just a policy, it's our foundational principle.
                        From farm to construction site, we ensure ethical sourcing and carbon-conscious logistics.
                    </p>

                    {/* Stats */}
                    <div className="flex gap-12">
                        <div>
                            <p className="text-3xl font-bold text-teal-800">500+</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Products Catalogued</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-teal-800">30+</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Countries Reached</p>
                        </div>
                    </div>
                </div>

                {/* Image */}
                <div className="relative">
                    <img
                        src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80"
                        alt="Sri Lankan artisan crafting pottery"
                        className="w-full h-80 md:h-[420px] object-cover rounded-2xl"
                    />
                    {/* Badge overlay */}
                    <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg max-w-[240px]">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-green-700 font-medium">Recognized as the leader in</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">
                            Sustainable Sri Lankan Exports since 2005
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
