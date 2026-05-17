import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const CartToast = () => {
    const { toast, hideToast } = useCart();
    const [visible, setVisible] = useState(false);
    const [current, setCurrent] = useState(null);

    useEffect(() => {
        if (toast) {
            setCurrent(toast);
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(() => hideToast(), 350);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast, hideToast]);

    if (!current) return null;

    const isCart = current.type === "cart";

    return (
        <div
            className={`fixed top-20 right-4 z-[9999] max-w-sm w-full transition-all duration-350 ${
                visible
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0"
            }`}
        >
            <div className="flex items-start gap-3 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-premium-xl backdrop-blur-xl">
                {/* Icon */}
                <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                        isCart
                            ? "bg-brand-green/10 text-brand-green-dark"
                            : "bg-red-50 text-red-500"
                    }`}
                >
                    {isCart ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-950 leading-snug line-clamp-2">
                        {current.message}
                    </p>
                    {isCart && (
                        <Link
                            to="/cart"
                            onClick={() => { setVisible(false); hideToast(); }}
                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-gold-dark hover:text-brand-gold transition-colors"
                        >
                            View Cart
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    )}
                </div>

                {/* Close */}
                <button
                    onClick={() => { setVisible(false); hideToast(); }}
                    className="flex-shrink-0 p-1 text-stone-400 hover:text-stone-600 transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default CartToast;
