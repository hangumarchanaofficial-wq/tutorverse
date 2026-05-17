import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatLkr } from "../lib/format";

/* ─── Known broken Unsplash IDs → working replacements ─── */
const BROKEN_IMAGE_MAP = {
    "photo-lFQV2lt7qcw": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-T29AcrDfWsY": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-VzBlp8rl5h8": "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-AhIQL2CKq7g": "https://images.unsplash.com/photo-1515562141589-67f0d569b6d2?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-cdNM-XJh4K8": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-1589310243389-96a54832213a8": "https://images.unsplash.com/photo-1589310243389-96a5483221a8?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-1586495777744-4413f210062fa": "https://images.unsplash.com/photo-1586495777744-4413f21006af?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-1489824904134-891ab645332f1": "https://images.unsplash.com/photo-1489824904134-891ab64533f1?w=600&h=600&fit=crop&auto=format&q=80",
    "photo-1596568001804-49ef57de7a02": "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?w=600&h=600&fit=crop&auto=format&q=80",
};

const FALLBACK_SVG_FN = (title = "Product") => {
    const label = encodeURIComponent(title.slice(0, 30));
    return "data:image/svg+xml," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
        '<rect width="400" height="400" fill="#F5F0E8"/>' +
        '<text x="200" y="190" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#8B7355" opacity="0.7">' + decodeURIComponent(label) + '</text>' +
        '<text x="200" y="215" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#A0916B" opacity="0.5">Image unavailable</text>' +
        '</svg>'
    );
};

function resolveImage(img) {
    if (!img) return "";
    /* Check the broken-image map first */
    for (const [broken, fixed] of Object.entries(BROKEN_IMAGE_MAP)) {
        if (img.includes(broken)) return fixed;
    }
    if (img.startsWith("http")) return img;
    if (img.startsWith("data:")) return img;
    return "https://images.unsplash.com/" + img + "?w=600&h=600&fit=crop&auto=format&q=80";
}

const StarRating = ({ rating }) => (
    <div className="flex items-center gap-px">
        {[1,2,3,4,5].map((star) => (
            <svg key={star} className={"h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 " + (star <= Math.floor(rating) ? "text-brand-gold" : "text-stone-200")} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        ))}
    </div>
);

const badgeColors = {
    "Best Seller": "bg-amber-100 text-amber-800",
    "Top Rated": "bg-blue-100 text-blue-700",
    Popular: "bg-violet-100 text-violet-700",
    Premium: "bg-navy-950 text-brand-gold",
    Eco: "bg-emerald-100 text-emerald-700",
    New: "bg-rose-100 text-rose-700",
    "Hot Deal": "bg-red-100 text-red-700",
};

const ProductCard = ({ product }) => {
    const [justAdded, setJustAdded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const { addToCart, toggleWishlist, isInWishlist } = useCart();
    const wishlisted = isInWishlist(product.id);

    const productImage = resolveImage(product.image);
    const fallback = FALLBACK_SVG_FN(product.title);

    const handleAddToCart = (e) => {
        e.preventDefault(); e.stopPropagation();
        addToCart({ id: product.id, title: product.title, price: product.price, originalPrice: product.originalPrice, discount: product.discount, image: product.image, category: product.category, quantity: 1, selectedSize: null, selectedColor: null, inStock: product.inStock });
        setJustAdded(true); setTimeout(() => setJustAdded(false), 1500);
    };

    const handleToggleWishlist = (e) => {
        e.preventDefault(); e.stopPropagation();
        toggleWishlist({ id: product.id, title: product.title, price: product.price, originalPrice: product.originalPrice, discount: product.discount, image: product.image, category: product.category, rating: product.rating, reviews: product.reviews, badge: product.badge, inStock: product.inStock });
    };

    return (
        <Link to={"/product/" + product.id} className="group block overflow-hidden rounded-xl sm:rounded-2xl border border-stone-200/60 bg-white shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-gold/20">
            <div className="relative overflow-hidden bg-brand-cream">
                <div className="aspect-square overflow-hidden">
                    <img
                        src={imgError ? fallback : productImage}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={() => { if (!imgError) setImgError(true); }}
                    />
                </div>
                {/* Badges */}
                <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
                    {product.discount ? (<span className="rounded-full bg-red-500 px-1.5 py-px text-[8px] font-semibold text-white sm:px-2.5 sm:py-1 sm:text-xs">-{product.discount}%</span>) : null}
                    {product.badge ? (<span className={"hidden sm:inline-block rounded-full px-2.5 py-1 text-xs font-semibold " + (badgeColors[product.badge] || "bg-stone-100 text-stone-700")}>{product.badge}</span>) : null}
                </div>
                {/* Wishlist */}
                <button onClick={handleToggleWishlist} className={"absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all active:scale-90 sm:right-3 sm:top-3 sm:h-9 sm:w-9 " + (wishlisted ? "bg-red-50 text-red-500" : "bg-white/90 text-stone-400")}>
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
                {/* Desktop hover overlay */}
                <div className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-gradient-to-t from-navy-950/80 to-transparent p-3 transition-transform duration-300 group-hover:translate-y-0 sm:block">
                    <button onClick={handleAddToCart} className={"w-full rounded-lg py-2 text-xs font-bold transition-colors " + (justAdded ? "bg-brand-green text-white" : "bg-brand-gold text-navy-950 hover:bg-brand-gold-dark")}>
                        {justAdded ? (<span className="flex items-center justify-center gap-1"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Added!</span>) : (<span className="flex items-center justify-center gap-1"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>Add to Cart</span>)}
                    </button>
                </div>
            </div>
            <div className="p-2.5 space-y-1 sm:p-4 sm:space-y-2.5">
                <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-brand-green-dark sm:text-[11px]">{product.category}</p>
                <h3 className="line-clamp-2 text-[11px] font-semibold leading-snug text-navy-950 sm:text-sm">{product.title}</h3>
                <div className="flex items-center gap-1">
                    <StarRating rating={product.rating} />
                    <span className="text-[9px] text-stone-500 sm:text-xs">{product.rating}</span>
                </div>
                <div>
                    <div className="flex flex-wrap items-baseline gap-x-1 sm:gap-x-2">
                        <span className="text-[13px] font-bold tracking-tight text-navy-950 sm:text-lg">{formatLkr(product.price)}</span>
                        {product.originalPrice && product.originalPrice > product.price ? (
                            <span className="text-[9px] text-stone-400 line-through sm:text-xs">{formatLkr(product.originalPrice)}</span>
                        ) : null}
                    </div>
                    {product.discount ? (
                        <p className="mt-px text-[9px] font-semibold text-brand-green sm:mt-0.5 sm:text-xs">Save {product.discount}%</p>
                    ) : (
                        <p className="mt-px text-[9px] text-stone-500 sm:mt-0.5 sm:text-xs">{product.inStock ? "Ready to ship" : "Out of stock"}</p>
                    )}
                </div>
                {/* Mobile Add to Cart */}
                <button onClick={handleAddToCart} className={"mt-1 w-full rounded-lg py-2 text-[11px] font-bold transition-colors sm:hidden " + (justAdded ? "bg-brand-green text-white" : "bg-brand-gold text-navy-950 active:bg-brand-gold-dark")}>
                    {justAdded ? (<span className="flex items-center justify-center gap-1"><svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Added!</span>) : "Add to Cart"}
                </button>
            </div>
        </Link>
    );
};

export default ProductCard;
