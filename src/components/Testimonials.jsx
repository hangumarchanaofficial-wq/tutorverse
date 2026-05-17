import React, { useEffect, useState } from "react";
import { testimonials } from "../data/dummyData";

const Testimonials = () => {
    const avgRating = (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1);
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % testimonials.length);
        }, 4200);

        return () => clearInterval(timer);
    }, []);

    return (
        <section className="bg-white py-8 sm:py-12 md:py-18">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                <div className="mb-5 text-center sm:mb-10">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-gold sm:mb-2 sm:text-sm">Customer Stories</p>
                    <h2 className="mb-3 font-display text-xl font-bold text-navy-950 sm:mb-4 sm:text-3xl md:text-4xl">What Our Customers Say</h2>
                    <div className="mb-2 flex flex-col items-center justify-center gap-1.5 sm:flex-row sm:gap-3">
                        <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map((star) => (
                                <svg key={star} className={"w-4 h-4 sm:w-5 sm:h-5 " + (star <= Math.round(Number(avgRating)) ? "text-brand-gold" : "text-stone-200")} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            ))}
                        </div>
                        <span className="text-base font-bold text-navy-950 sm:text-lg">{avgRating}/5</span>
                        <span className="text-[10px] text-stone-400 sm:text-sm">from 12,847+ reviews</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:mt-3 sm:gap-4">
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-brand-cream rounded-full sm:gap-1.5 sm:px-3 sm:py-1.5">
                            <div className="w-4 h-4 bg-[#00b67a] rounded flex items-center justify-center sm:w-5 sm:h-5"><svg className="w-2.5 h-2.5 text-white sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
                            <span className="text-[10px] font-semibold text-navy-800 sm:text-xs">Trustpilot</span>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-brand-cream rounded-full sm:gap-1.5 sm:px-3 sm:py-1.5">
                            <div className="w-4 h-4 bg-[#4285f4] rounded flex items-center justify-center sm:w-5 sm:h-5"><span className="text-white text-[8px] font-bold sm:text-[10px]">G</span></div>
                            <span className="text-[10px] font-semibold text-navy-800 sm:text-xs">Google Reviews</span>
                        </div>
                    </div>
                </div>

                {/* Mobile: slideshow */}
                <div className="sm:hidden">
                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                        >
                            {testimonials.map((t) => (
                                <div key={t.id} className="w-full flex-shrink-0 px-0.5">
                                    <div className="overflow-hidden rounded-[22px] border border-stone-100 bg-brand-cream p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                                        <div className="mb-2.5 flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (<svg key={i} className={"w-3 h-3 " + (i < t.rating ? "text-brand-gold" : "text-stone-200")} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}
                                        </div>
                                        <p className="mb-4 min-h-[96px] text-sm leading-7 text-stone-600">"{t.text}"</p>
                                        <div className="flex items-center gap-2.5">
                                            <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                                            <div className="min-w-0 flex-1">
                                                <h4 className="truncate text-sm font-bold text-navy-950">{t.name}</h4>
                                                <p className="truncate text-[11px] text-stone-400">{t.location}</p>
                                            </div>
                                            <span className="text-[10px] font-medium text-brand-gold/70">{t.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        {testimonials.map((t, index) => (
                            <button
                                key={t.id}
                                type="button"
                                aria-label={`Go to testimonial ${index + 1}`}
                                onClick={() => setActiveSlide(index)}
                                className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-6 bg-navy-950" : "w-2.5 bg-stone-300"}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Desktop: grid */}
                <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-6">
                    {testimonials.map((t) => (
                        <div key={t.id} className="group relative overflow-hidden rounded-2xl border border-transparent bg-brand-cream p-6 transition-all duration-500 hover:border-brand-gold/15 hover:bg-white hover:shadow-card-hover md:p-8">
                            <div className="absolute inset-0 gold-shine opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="absolute top-6 right-6 text-stone-200 group-hover:text-brand-gold/15 transition-colors duration-500"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg></div>
                            <div className="relative flex items-center gap-0.5 mb-4">
                                {[...Array(5)].map((_, i) => (<svg key={i} className={"w-4 h-4 " + (i < t.rating ? "text-brand-gold" : "text-stone-200")} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}
                            </div>
                            <p className="relative mb-6 text-sm leading-7 text-stone-600 md:text-base md:leading-relaxed">"{t.text}"</p>
                            <div className="relative flex items-center gap-3">
                                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-premium" />
                                <div><h4 className="text-sm font-bold text-navy-950">{t.name}</h4><p className="text-xs text-stone-400">{t.location}</p></div>
                                <span className="ml-auto text-xs text-brand-gold/60 font-medium">{t.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
