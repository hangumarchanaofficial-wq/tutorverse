import React from "react";

const Footer = () => {
    const footerLinks = {
        Company: [{ label: "About Us", href: "#" }, { label: "Our Story", href: "#" }, { label: "Careers", href: "#" }, { label: "Sustainability", href: "#" }],
        "Customer Service": [{ label: "Help Center", href: "#" }, { label: "Shipping & Delivery", href: "#" }, { label: "Returns & Refunds", href: "#" }, { label: "Contact Us", href: "#" }],
        "Quick Links": [{ label: "Flash Deals", href: "#" }, { label: "New Arrivals", href: "#" }, { label: "Best Sellers", href: "#" }, { label: "Sell on TWOWAY", href: "#" }],
        Legal: [{ label: "Privacy Policy", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "Cookie Policy", href: "#" }],
    };

    const socialLinks = [
        { name: "Facebook", href: "#", icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>) },
        { name: "Instagram", href: "#", icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" /></svg>) },
        { name: "Twitter", href: "#", icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>) },
        { name: "YouTube", href: "#", icon: (<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>) },
    ];

    const paymentMethods = ["Visa", "Mastercard", "PayPal", "Stripe"];

    return (
        <footer className="bg-navy-950 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
            <div className="max-w-7xl mx-auto px-3 pt-10 pb-6 sm:px-4 sm:pt-16 sm:pb-8 relative">
                <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-6 lg:gap-6">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-3 lg:col-span-2">
                        <div className="flex items-center gap-2.5 mb-4 sm:gap-3 sm:mb-5">
                            <div className="w-9 h-9 bg-gradient-to-br from-navy-800 to-navy-950 rounded-xl flex items-center justify-center ring-1 ring-brand-gold/20 shadow-lg sm:w-11 sm:h-11"><span className="text-brand-gold font-bold text-xs tracking-wider sm:text-sm">TW</span></div>
                            <div><h3 className="text-base font-bold font-display sm:text-lg">TWOWAY</h3><p className="text-[9px] font-semibold text-brand-gold uppercase tracking-[0.25em] -mt-0.5 sm:text-[10px]">CEYLON</p></div>
                        </div>
                        <p className="text-white/40 text-xs leading-relaxed mb-4 max-w-xs sm:text-sm sm:mb-6">Sri Lanka's premier multi-sector enterprise delivering quality products to 120+ countries.</p>
                        <div className="space-y-2 mb-4 sm:space-y-3 sm:mb-6">
                            <div className="flex items-center gap-2.5 text-xs text-white/40 sm:text-sm"><svg className="w-3.5 h-3.5 text-brand-gold/60 flex-shrink-0 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Colombo 07, Sri Lanka</div>
                            <div className="flex items-center gap-2.5 text-xs text-white/40 sm:text-sm"><svg className="w-3.5 h-3.5 text-brand-gold/60 flex-shrink-0 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>hello@twowayceylon.com</div>
                            <div className="flex items-center gap-2.5 text-xs text-white/40 sm:text-sm"><svg className="w-3.5 h-3.5 text-brand-gold/60 flex-shrink-0 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>+94 11 234 5678</div>
                        </div>
                        <div className="flex items-center gap-2">
                            {socialLinks.map((s) => (<a key={s.name} href={s.href} aria-label={s.name} className="w-8 h-8 bg-white/[0.06] hover:bg-brand-gold/20 rounded-lg flex items-center justify-center text-white/40 hover:text-brand-gold transition-all ring-1 ring-white/[0.06] sm:w-9 sm:h-9">{s.icon}</a>))}
                        </div>
                    </div>
                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-xs font-bold text-white/80 mb-3 uppercase tracking-wider sm:text-sm sm:mb-4">{title}</h4>
                            <ul className="space-y-2 sm:space-y-2.5">
                                {links.map((link) => (<li key={link.label}><a href={link.href} className="text-xs text-white/30 hover:text-brand-gold transition-colors sm:text-sm">{link.label}</a></li>))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="border-t border-white/[0.06] mt-8 pt-6 sm:mt-12 sm:pt-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
                        <p className="text-white/25 text-[10px] sm:text-sm">© 2025 TWOWAY CEYLON. All rights reserved.</p>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-white/25 text-[10px] mr-1 sm:text-xs">We accept:</span>
                            {paymentMethods.map((m) => (<div key={m} className="h-6 px-2 bg-white/[0.06] rounded flex items-center justify-center text-[9px] font-bold text-white/35 ring-1 ring-white/[0.06] sm:h-7 sm:px-3 sm:text-[10px]">{m}</div>))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
