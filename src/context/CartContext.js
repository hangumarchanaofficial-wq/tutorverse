import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { syncCart, syncWishlist } from "../services/orderApi";
import { fetchServerCart, fetchServerWishlist } from "../services/customerApi";

const CartContext = createContext();

/* ── helpers ── */
const loadFromStorage = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded – silently ignore */ }
};

const cartItemKey = (item) =>
    `${item.id}::${item.selectedSize || ""}::${item.selectedColor || ""}`;

const mergeCartItems = (a = [], b = []) => {
    const map = new Map();
    for (const list of [a, b]) {
        for (const item of list) {
            const key = cartItemKey(item);
            const existing = map.get(key);
            if (existing) {
                existing.quantity = Math.min(99, (existing.quantity || 1) + (item.quantity || 1));
            } else {
                map.set(key, { ...item, quantity: Math.min(99, item.quantity || 1) });
            }
        }
    }
    return [...map.values()];
};

const mergeWishlistItems = (a = [], b = []) => {
    const map = new Map();
    for (const list of [a, b]) {
        for (const item of list) {
            map.set(String(item.id), { ...item });
        }
    }
    return [...map.values()];
};

/* ── cart reducer ── */
const cartReducer = (state, action) => {
    switch (action.type) {
        case "REPLACE_ITEMS":
            return { ...state, items: Array.isArray(action.payload) ? action.payload : [] };
        case "ADD_ITEM": {
            const existing = state.items.find(
                (item) =>
                    item.id === action.payload.id &&
                    item.selectedSize === action.payload.selectedSize &&
                    item.selectedColor === action.payload.selectedColor
            );
            if (existing) {
                return {
                    ...state,
                    items: state.items.map((item) =>
                        item.id === existing.id &&
                        item.selectedSize === existing.selectedSize &&
                        item.selectedColor === existing.selectedColor
                            ? { ...item, quantity: Math.min(99, item.quantity + action.payload.quantity) }
                            : item
                    ),
                };
            }
            return { ...state, items: [...state.items, { ...action.payload }] };
        }
        case "REMOVE_ITEM":
            return {
                ...state,
                items: state.items.filter((_, index) => index !== action.payload),
            };
        case "UPDATE_QUANTITY":
            return {
                ...state,
                items: state.items.map((item, index) =>
                    index === action.payload.index
                        ? { ...item, quantity: Math.max(1, Math.min(99, action.payload.quantity)) }
                        : item
                ),
            };
        case "CLEAR_CART":
            return { ...state, items: [] };
        default:
            return state;
    }
};

/* ── wishlist reducer ── */
const wishlistReducer = (state, action) => {
    switch (action.type) {
        case "REPLACE_ITEMS":
            return { ...state, items: Array.isArray(action.payload) ? action.payload : [] };
        case "TOGGLE_WISHLIST": {
            const exists = state.items.find((i) => i.id === action.payload.id);
            if (exists) {
                return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
            }
            return { ...state, items: [...state.items, action.payload] };
        }
        case "REMOVE_WISHLIST":
            return { ...state, items: state.items.filter((i) => i.id !== action.payload) };
        case "CLEAR_WISHLIST":
            return { ...state, items: [] };
        default:
            return state;
    }
};

/* ── provider ── */
export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartState, cartDispatch] = useReducer(cartReducer, {
        items: loadFromStorage("tw_cart", []),
    });

    const [wishlistState, wishlistDispatch] = useReducer(wishlistReducer, {
        items: loadFromStorage("tw_wishlist", []),
    });

    /* coupon */
    const [coupon, setCoupon] = useState(() => loadFromStorage("tw_coupon", null));

    /* toast state */
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = "cart") => {
        setToast({ message, type, id: Date.now() });
    }, []);

    const hideToast = useCallback(() => setToast(null), []);

    /* one-time hydration once we know who the user is */
    const hydratedFor = useRef(null);
    useEffect(() => {
        if (!user?.uid) {
            hydratedFor.current = null;
            return;
        }
        if (hydratedFor.current === user.uid) return;
        hydratedFor.current = user.uid;

        let cancelled = false;
        Promise.all([
            fetchServerCart().catch(() => ({ items: [] })),
            fetchServerWishlist().catch(() => ({ items: [] })),
        ]).then(([cartRes, wishRes]) => {
            if (cancelled) return;
            const merged = mergeCartItems(cartRes?.items || [], cartState.items);
            cartDispatch({ type: "REPLACE_ITEMS", payload: merged });

            const wlMerged = mergeWishlistItems(wishRes?.items || [], wishlistState.items);
            wishlistDispatch({ type: "REPLACE_ITEMS", payload: wlMerged });
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    /* persist cart */
    useEffect(() => {
        saveToStorage("tw_cart", cartState.items);
        if (user?.uid) {
            syncCart(cartState.items).catch(() => null);
        }
    }, [cartState.items, user?.uid]);

    useEffect(() => {
        saveToStorage("tw_wishlist", wishlistState.items);
        if (user?.uid) {
            syncWishlist(wishlistState.items).catch(() => null);
        }
    }, [wishlistState.items, user?.uid]);

    useEffect(() => {
        saveToStorage("tw_coupon", coupon);
    }, [coupon]);

    /* ── cart actions ── */
    const addToCart = useCallback(
        (item) => {
            cartDispatch({ type: "ADD_ITEM", payload: item });
            showToast(`"${item.title}" added to cart`, "cart");
        },
        [showToast]
    );

    const removeFromCart = useCallback((index) => {
        cartDispatch({ type: "REMOVE_ITEM", payload: index });
    }, []);

    const updateQuantity = useCallback((index, quantity) => {
        cartDispatch({ type: "UPDATE_QUANTITY", payload: { index, quantity } });
    }, []);

    const clearCart = useCallback(() => {
        cartDispatch({ type: "CLEAR_CART" });
        setCoupon(null);
    }, []);

    /* ── wishlist actions ── */
    const toggleWishlist = useCallback(
        (product) => {
            const exists = wishlistState.items.find((i) => i.id === product.id);
            wishlistDispatch({ type: "TOGGLE_WISHLIST", payload: product });
            showToast(
                exists ? `Removed from wishlist` : `"${product.title}" added to wishlist`,
                "wishlist"
            );
        },
        [wishlistState.items, showToast]
    );

    const removeFromWishlist = useCallback((id) => {
        wishlistDispatch({ type: "REMOVE_WISHLIST", payload: id });
    }, []);

    const isInWishlist = useCallback(
        (id) => wishlistState.items.some((i) => i.id === id),
        [wishlistState.items]
    );

    const clearWishlist = useCallback(() => {
        wishlistDispatch({ type: "CLEAR_WISHLIST" });
    }, []);

    /* ── coupon actions ── */
    const applyCoupon = useCallback((c) => {
        setCoupon(c ? { code: c.code, type: c.type, value: Number(c.value) || 0 } : null);
    }, []);

    const removeCoupon = useCallback(() => setCoupon(null), []);

    /* ── computed ── */
    const cartCount = cartState.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const cartSubtotal = cartState.items.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 0),
        0
    );
    const cartSavings = cartState.items.reduce(
        (sum, item) =>
            sum + (item.originalPrice ? (Number(item.originalPrice) - Number(item.price)) * (item.quantity || 0) : 0),
        0
    );
    const wishlistCount = wishlistState.items.length;

    const couponDiscount = !coupon
        ? 0
        : coupon.type === "percentage"
            ? Math.min(cartSubtotal, (cartSubtotal * coupon.value) / 100)
            : Math.min(cartSubtotal, coupon.value);

    const FREE_SHIPPING_THRESHOLD = 10000; // LKR
    const SHIPPING_FEE = 500; // LKR flat fee under threshold
    const shippingFee = cartState.items.length === 0 ? 0 : cartSubtotal - couponDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const cartTotal = Math.max(0, cartSubtotal - couponDiscount) + shippingFee;

    return (
        <CartContext.Provider
            value={{
                /* cart */
                items: cartState.items,
                cartCount,
                cartSubtotal,
                cartSavings,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                /* wishlist */
                wishlistItems: wishlistState.items,
                wishlistCount,
                toggleWishlist,
                removeFromWishlist,
                isInWishlist,
                clearWishlist,
                /* coupon + totals */
                coupon,
                applyCoupon,
                removeCoupon,
                couponDiscount,
                shippingFee,
                cartTotal,
                freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
                /* toast */
                toast,
                hideToast,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};
