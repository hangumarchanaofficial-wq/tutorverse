import React, { useState } from "react";

const Newsletter = () => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email) { setIsSubmitted(true); setTimeout(() => setIsSubmitted(false), 3000); setEmail(""); }
    };

    return (
        <section className="bg-brand-cream py-8 sm:py-12 md:py-20">
            <div className="max-w-7xl mx-auto px-3 sm:px-4">
                <div className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-[#0d1520] rounded-2xl sm:rounded-3xl overflow-hidden ring-1 ring-brand-gold/10">
                    <div className="absolute top-0 left-1/4 w-72 h-72 bg-brand-gold/8 rounded-full blur-3xl sm:w-96 sm:h-96" />
                    <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-brand-green/5 rounded-full blur-3xl sm:w-64 sm:h-64" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(200,169,81,0.4) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
                    <div className="relative px-4 py-8 text-center sm:px-6 sm:py-12 md:px-12 md:py-20">
                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gold/15 ring-1 ring-brand-gold/20 sm:mb-6 sm:h-16 sm:w-16 sm:rounded-2xl">
                            <svg className="w-6 h-6 text-brand-gold sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <h2 className="mb-3 font-display text-xl font-bold text-white sm:mb-4 sm:text-3xl md:text-4xl">Stay in the Loop</h2>
                        <p className="mx-auto mb-5 max-w-xs text-xs leading-relaxed text-white/50 sm:mb-8 sm:max-w-xl sm:text-lg">Subscribe to get exclusive deals, new product alerts, and insights delivered to your inbox.</p>
                        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
                            <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full h-12 px-4 bg-white/[0.08] border border-white/15 rounded-xl text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-transparent text-sm backdrop-blur-sm sm:h-13 sm:px-5 sm:rounded-full" required />
                                <button type="submit" className="h-12 px-6 bg-gradient-to-r from-brand-gold to-brand-gold-dark hover:from-brand-gold-dark hover:to-accent-copper text-navy-950 font-semibold rounded-xl text-sm transition-all duration-300 shadow-lg shadow-brand-gold/20 flex items-center justify-center gap-2 flex-shrink-0 sm:h-13 sm:px-8 sm:rounded-full">
                                    {isSubmitted ? (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Subscribed!</>) : (<>Subscribe<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>)}
                                </button>
                            </div>
                        </form>
                        <p className="text-white/20 text-[10px] mt-3 sm:text-xs sm:mt-4">No spam, unsubscribe any time. We respect your privacy.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Newsletter;
