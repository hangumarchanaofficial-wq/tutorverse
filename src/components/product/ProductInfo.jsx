import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { formatLkr } from "../../lib/format";

const StarRating = ({ rating, size = "h-4 w-4" }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className={`${size} ${star <= Math.floor(rating) ? "text-brand-gold" : "text-stone-200"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const ProductInfo = ({ product }) => {
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const [selectedSize, setSelectedSize] = useState(product.sizes?.find((s) => s.inStock) || null);
    const [selectedColor, setSelectedColor] = useState(product.colors?.find((c) => c.inStock) || null);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    const currentPrice = Number(selectedSize?.price ?? product.price ?? 0);
    const currentOriginalPrice = Number(
        selectedSize?.originalPrice ?? product.originalPrice ?? product.original_price ?? 0
    );
    const savings = Math.max(0, currentOriginalPrice - currentPrice);

    const buildCartItem = () => ({
        id: product.id,
        title: product.title,
        price: currentPrice,
        originalPrice: currentOriginalPrice,
        discount: product.discount,
        image: product.images?.[0] || product.image,
        category: product.category,
        quantity: quantity,
        selectedSize: selectedSize?.name || null,
        selectedColor: selectedColor?.name || null,
        inStock: product.inStock,
    });

    const handleAddToCart = () => {
        addToCart(buildCartItem());
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2200);
    };

    const handleBuyNow = () => {
        addToCart(buildCartItem());
        navigate("/cart");
    };

    return (
        <aside className="space-y-4 pb-24 lg:sticky lg:top-24 lg:pb-0">
            <div className="overflow-hidden rounded-[28px] border border-stone-200/70 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                {/* Title + Price */}
                <div className="space-y-4 border-b border-stone-100 px-5 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-medium uppercase tracking-[0.15em] text-stone-400">
                    <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-brand-green-dark font-semibold">{product.brand}</span>
                    <span>{product.category}</span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-navy-950">{product.title}</h1>
                {product.subtitle && <p className="text-sm leading-relaxed text-stone-600">{product.subtitle}</p>}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                        <StarRating rating={product.rating} />
                        <span className="font-semibold text-navy-950">{product.rating}</span>
                    </div>
                    <span className="text-stone-400">({product.reviews} reviews)</span>
                    <span className="h-1 w-1 rounded-full bg-stone-300" />
                    <span className="font-medium text-brand-green-dark">{product.reviews > 100 ? "500+ sold" : `${product.reviews} sold`}</span>
                </div>
                <div className="space-y-3">
                    <div className="flex flex-wrap items-end gap-2.5">
                        <span className="text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">{formatLkr(currentPrice)}</span>
                        {currentOriginalPrice > currentPrice && (
                            <>
                                <span className="text-lg text-stone-400 line-through">{formatLkr(currentOriginalPrice)}</span>
                                {product.discount > 0 && (
                                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500">{product.discount}% OFF</span>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                        {savings > 0 && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">You save {formatLkr(savings)}</span>
                        )}
                        {product.deliveryInfo?.freeShipping && (
                            <span className="rounded-full bg-brand-cream px-3 py-1.5 font-medium text-stone-700">Free shipping over LKR 10,000</span>
                        )}
                    </div>
                </div>
                </div>

            {/* Variants + Actions */}
            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
                {product.colors?.length > 0 && (
                    <div>
                        <p className="mb-2.5 text-sm font-semibold text-navy-950">Color <span className="ml-1 font-normal text-stone-500">{selectedColor?.name || "Select"}</span></p>
                        <div className="flex items-center gap-2.5">
                            {product.colors.map((color) => (
                                <button key={color.name} onClick={() => color.inStock && setSelectedColor(color)} disabled={!color.inStock} title={color.name} className={`relative h-10 w-10 rounded-full border-2 transition-all ${selectedColor?.name === color.name ? "border-navy-950 ring-2 ring-brand-gold/25" : "border-stone-200 hover:border-stone-400"} ${!color.inStock ? "cursor-not-allowed opacity-30" : ""}`}>
                                    <span className="absolute inset-1 rounded-full" style={{ backgroundColor: color.hex }} />
                                    {selectedColor?.name === color.name && (
                                        <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-sm">
                                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {product.sizes?.length > 0 && (
                    <div>
                        <p className="mb-2.5 text-sm font-semibold text-navy-950">Size <span className="ml-1 font-normal text-stone-500">{selectedSize?.name || "Select"}</span></p>
                        <div className="flex flex-wrap gap-2">
                            {product.sizes.map((size) => (
                                <button key={size.name} onClick={() => size.inStock && setSelectedSize(size)} disabled={!size.inStock} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${selectedSize?.name === size.name ? "border-navy-950 bg-navy-950 text-white shadow-sm" : size.inStock ? "border-stone-200 bg-white text-navy-950 hover:border-stone-400" : "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300 line-through"}`}>
                                    {size.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="space-y-3.5 border-t border-stone-100 pt-5">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-navy-950">Quantity</p>
                        <div className="flex h-11 items-center overflow-hidden rounded-xl border border-stone-200">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-full w-11 items-center justify-center text-navy-900 transition-colors hover:bg-brand-cream">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                            </button>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)))} className="h-full w-12 border-x border-stone-200 bg-transparent text-center text-sm font-semibold text-navy-950 focus:outline-none" />
                            <button onClick={() => setQuantity(Math.min(99, quantity + 1))} className="flex h-full w-11 items-center justify-center text-navy-900 transition-colors hover:bg-brand-cream">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                            </button>
                        </div>
                    </div>
                    <div>
                        <button onClick={handleAddToCart} className={`hidden w-full rounded-xl px-5 py-3.5 text-sm font-bold transition-all sm:block ${addedToCart ? "bg-brand-green text-white shadow-sm" : "bg-navy-950 text-white hover:bg-navy-800 shadow-premium-lg hover:shadow-premium-xl"}`}>
                            {addedToCart ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    Added to Cart!
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                                    Add to Cart — {formatLkr(currentPrice * quantity)}
                                </span>
                            )}
                        </button>
                    </div>
                    <button onClick={handleBuyNow} className="hidden w-full rounded-xl border-2 border-brand-gold bg-transparent px-5 py-3.5 text-sm font-bold text-brand-gold-dark transition-all hover:bg-brand-gold hover:text-navy-950 sm:block">
                        Buy Now
                    </button>
                </div>
            </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md sm:hidden">
                <div className="mx-auto flex max-w-7xl items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Total</p>
                        <p className="truncate text-lg font-bold text-navy-950">{formatLkr(currentPrice * quantity)}</p>
                    </div>
                    <button onClick={handleAddToCart} className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${addedToCart ? "bg-brand-green text-white" : "bg-navy-950 text-white"}`}>
                        {addedToCart ? "Added" : "Add to Cart"}
                    </button>
                    <button onClick={handleBuyNow} className="rounded-xl border-2 border-brand-gold px-4 py-3 text-sm font-bold text-brand-gold-dark">
                        Buy
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default ProductInfo;
