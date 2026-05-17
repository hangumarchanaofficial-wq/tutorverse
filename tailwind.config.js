/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                navy: {
                    50: "#f0f1f5",
                    100: "#d8dbe5",
                    200: "#b4baca",
                    300: "#8d96af",
                    400: "#6b7694",
                    500: "#4e5a7a",
                    600: "#3d4766",
                    700: "#2d3550",
                    800: "#1e253c",
                    900: "#111827",
                    950: "#0a0f1a",
                },
                brand: {
                    green: "#0D9F6E",
                    "green-dark": "#057A55",
                    "green-light": "#31C48D",
                    gold: "#C8A951",
                    "gold-dark": "#B8952E",
                    "gold-light": "#DFC475",
                    cream: "#FAF7F2",
                    "cream-dark": "#F3EDE3",
                },
                accent: {
                    copper: "#B87333",
                    bronze: "#A0785A",
                    charcoal: "#2C2C2C",
                    pearl: "#F5F0EB",
                    slate: "#64748B",
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
                display: [
                    '"Cormorant Garamond"',
                    "system-ui",
                    "-apple-system",
                    "serif",
                ],
            },
            boxShadow: {
                premium:
                    "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
                "premium-lg":
                    "0 4px 6px rgba(0,0,0,0.04), 0 10px 40px rgba(0,0,0,0.08)",
                "premium-xl":
                    "0 8px 16px rgba(0,0,0,0.06), 0 20px 60px rgba(0,0,0,0.1)",
                "card-hover":
                    "0 8px 30px rgba(200,169,81,0.12), 0 4px 12px rgba(0,0,0,0.06)",
                "gold-glow": "0 0 20px rgba(200,169,81,0.15)",
                "inner-glow":
                    "inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.1)",
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-out",
                "slide-up": "slideUp 0.6s ease-out",
                "pulse-slow": "pulse 3s ease-in-out infinite",
                shimmer: "shimmer 2s linear infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
        },
    },
    plugins: [],
};
