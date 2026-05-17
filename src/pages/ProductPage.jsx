import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import ImageGallery from "../components/product/ImageGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductTabs from "../components/product/ProductTabs";
import ProductCard from "../components/ProductCard";
import { allProducts, productDetails, relatedProducts } from "../data/dummyData";
import { fetchProductById, fetchRelatedProducts } from "../services/productApi";
import { normalizeProducts } from "../lib/normalizeProduct";
import { trackProductView } from "../components/RecentlyViewed";

const DetailStat = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 rounded-2xl border border-stone-200/70 bg-white/88 px-4 py-4 backdrop-blur-sm transition-all hover:border-brand-gold/20 hover:bg-white">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-cream text-brand-gold-dark">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-gold-dark">{label}</p>
            <p className="mt-1 text-sm font-medium leading-6 text-navy-950">{value}</p>
        </div>
    </div>
);

const buildFallbackProduct = (baseProduct) => ({
    ...baseProduct,
    subtitle: `${baseProduct.brand} | ${baseProduct.category}`,
    categorySlug: baseProduct.category?.toLowerCase().replace(/\s+/g, "-"),
    sku: `TWC-${baseProduct.id}`,
    images: baseProduct.image ? [baseProduct.image] : [],
    colors: [],
    sizes: [],
    description: `<p>${baseProduct.title} is part of the ${baseProduct.category} collection from ${baseProduct.brand}. Contact the seller for more product-specific details, packaging options, and bulk ordering information.</p>`,
    specifications: [
        { key: "Brand", value: baseProduct.brand || "TWOWAY Ceylon" },
        { key: "Category", value: baseProduct.category || "General" },
        { key: "Availability", value: baseProduct.inStock ? "In stock" : "Out of stock" },
    ],
    reviewsList: [],
    ratingBreakdown: {
        5: Math.max(0, Math.round((baseProduct.reviews || 0) * 0.65)),
        4: Math.max(0, Math.round((baseProduct.reviews || 0) * 0.2)),
        3: Math.max(0, Math.round((baseProduct.reviews || 0) * 0.1)),
        2: Math.max(0, Math.round((baseProduct.reviews || 0) * 0.03)),
        1: Math.max(0, Math.round((baseProduct.reviews || 0) * 0.02)),
    },
    deliveryInfo: {
        freeShipping: true,
        freeShippingMin: 50,
        estimatedDays: "3-7 business days",
        returnDays: 30,
    },
});

const ProductPage = () => {
    const { id } = useParams();
    const [remoteProduct, setRemoteProduct] = useState(null);
    const [relatedItems, setRelatedItems] = useState(relatedProducts.slice(0, 4));
    const baseProduct = allProducts.find((item) => String(item.id) === String(id));
    const product = remoteProduct || productDetails[id] || (baseProduct ? buildFallbackProduct(baseProduct) : productDetails[1]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

    useEffect(() => {
        trackProductView(id);
        let cancelled = false;
        fetchProductById(id)
            .then((item) => {
                if (cancelled || !item) return;
                setRemoteProduct({
                    ...item,
                    subtitle: `${item.brand || ""} | ${item.category || ""}`,
                    categorySlug: item.category_slug || item.categorySlug || "",
                    sku: item.sku || `TWC-${item.id}`,
                    images: item.images_json || item.images || (item.image ? [item.image] : []),
                    reviewsList: item.reviews || [],
                    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                    deliveryInfo: { freeShipping: true, freeShippingMin: 50, estimatedDays: "3-7 business days", returnDays: 30 },
                });
            })
            .catch(() => null);
        return () => {
            cancelled = true;
        };
    }, [id]);

    const loadRelatedProducts = useCallback(
        (categorySlug, productId) => {
            let cancelled = false;
            fetchRelatedProducts(categorySlug, productId)
                .then((items) => {
                    if (cancelled) return;
                    const normalized = normalizeProducts(items);
                    if (normalized.length > 0) {
                        setRelatedItems(normalized.slice(0, 4));
                    } else {
                        setRelatedItems(relatedProducts.slice(0, 4));
                    }
                })
                .catch(() => {
                    if (!cancelled) setRelatedItems(relatedProducts.slice(0, 4));
                });
            return () => {
                cancelled = true;
            };
        },
        []
    );

    useEffect(() => {
        const slug = product.category_slug || product.categorySlug;
        if (!slug) return;
        return loadRelatedProducts(slug, product.id);
    }, [product.id, product.category_slug, product.categorySlug, loadRelatedProducts]);

    return (
        <div className="min-h-screen bg-[#fcfaf6]">
            {/* Breadcrumb */}
            <div className="border-b border-stone-200/60 bg-white/90 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4 py-3.5">
                    <nav className="flex items-center gap-1.5 overflow-x-auto text-xs sm:text-sm text-stone-500 scrollbar-hide">
                        <Link to="/" className="whitespace-nowrap hover:text-navy-950 transition-colors">Home</Link>
                        <svg className="h-3 w-3 flex-shrink-0 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <Link to={`/category/${product.categorySlug || ''}`} className="whitespace-nowrap hover:text-navy-950 transition-colors">
                            {product.category}
                        </Link>
                        <svg className="h-3 w-3 flex-shrink-0 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="truncate font-medium text-navy-950">{product.title}</span>
                    </nav>
                </div>
            </div>

            {/* Main Product Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top_left,_rgba(200,169,81,0.14),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_34%)]" />
                <div className="mx-auto max-w-7xl px-4 py-5 sm:py-7 md:py-10">
                    <div className="grid items-start gap-5 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1.05fr)_460px]">
                    {/* Left: Gallery + Stats */}
                    <div className="space-y-4 sm:space-y-5">
                        <ImageGallery
                            images={product.images}
                            title={product.title}
                            badge={product.badge}
                            discount={product.discount}
                        />

                        {/* Detail Stats */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <DetailStat
                                icon={
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                }
                                label="Delivery"
                                value={product.deliveryInfo?.estimatedDays || "3–7 business days"}
                            />
                            <DetailStat
                                icon={
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                }
                                label="Returns"
                                value={`${product.deliveryInfo?.returnDays || 30}-day return window`}
                            />
                            <DetailStat
                                icon={
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                }
                                label="Payment"
                                value="Protected checkout"
                            />
                            <DetailStat
                                icon={
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                }
                                label="SKU"
                                value={product.sku}
                            />
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <ProductInfo product={product} />
                </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="mx-auto max-w-7xl px-4 pb-12 md:pb-14">
                <ProductTabs product={product} />
            </div>

            {/* Related Products — exactly 4 */}
            <section className="border-t border-stone-200/60 bg-white py-12 md:py-16">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="mb-6 flex items-end justify-between sm:mb-8">
                        <div>
                            <p className="mb-1 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold-dark">
                                <span className="h-px w-6 bg-brand-gold/50" />
                                Related Picks
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy-950 font-display">
                                Related Products
                            </h2>
                        </div>
                        <Link
                            to="/category"
                            className="hidden items-center gap-1.5 rounded-full border border-stone-200/60 bg-brand-cream px-4 py-2 text-sm font-semibold text-navy-900 transition-all hover:border-brand-gold/30 hover:shadow-sm sm:flex"
                        >
                            View All
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4 md:gap-5">
                        {relatedItems.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>

                    {/* Mobile View All */}
                    <div className="mt-6 flex justify-center sm:hidden">
                        <Link
                            to="/category"
                            className="flex items-center gap-1.5 rounded-full border border-stone-200/60 bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 shadow-sm"
                        >
                            View All Products
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProductPage;
