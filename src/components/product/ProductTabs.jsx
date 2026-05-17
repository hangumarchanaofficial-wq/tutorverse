import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchProductReviews, submitReview } from "../../services/customerApi";

const StarRating = ({ rating, size = "h-4 w-4" }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg
                key={star}
                className={`${size} ${star <= rating ? "text-brand-gold" : "text-stone-200"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const StarPicker = ({ value, onChange }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                key={star}
                type="button"
                onClick={() => onChange(star)}
                className={`transition-transform hover:scale-110 ${star <= value ? "text-brand-gold" : "text-stone-200"}`}
                aria-label={`Rate ${star}`}
            >
                <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            </button>
        ))}
    </div>
);

function formatDate(iso) {
    if (!iso) return "";
    try {
        return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return iso;
    }
}

const ProductTabs = ({ product }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("description");
    const [reviewSort, setReviewSort] = useState("newest");

    const [reviews, setReviews] = useState(product.reviewsList || []);
    const [reviewsTotal, setReviewsTotal] = useState((product.reviewsList || []).length);

    const [showForm, setShowForm] = useState(false);
    const [draft, setDraft] = useState({ rating: 5, comment: "" });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitMessage, setSubmitMessage] = useState("");

    useEffect(() => {
        let on = true;
        if (!product?.id) return undefined;
        fetchProductReviews(product.id, { limit: 50 })
            .then((res) => {
                if (!on) return;
                setReviews(res.items || []);
                setReviewsTotal(res.total ?? (res.items?.length || 0));
            })
            .catch(() => {
                /* keep whatever was passed in via product.reviewsList */
            });
        return () => { on = false; };
    }, [product?.id]);

    const tabs = [
        { id: "description", label: "Description" },
        { id: "specifications", label: "Specifications" },
        { id: "reviews", label: `Reviews (${reviewsTotal})` },
    ];

    const ratingBreakdown = useMemo(() => {
        const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        for (const r of reviews) {
            const n = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0)));
            if (buckets[n] != null) buckets[n] += 1;
        }
        return buckets;
    }, [reviews]);

    const totalReviews = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0);
    const avgRating = totalReviews > 0
        ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1)
        : (Number(product.rating) || 0).toFixed(1);

    const sortedReviews = useMemo(() => {
        const arr = [...reviews];
        if (reviewSort === "highest") arr.sort((a, b) => b.rating - a.rating);
        else if (reviewSort === "lowest") arr.sort((a, b) => a.rating - b.rating);
        else if (reviewSort === "helpful") arr.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        else arr.sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0));
        return arr;
    }, [reviews, reviewSort]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user?.uid) {
            setSubmitError("Please sign in to write a review.");
            return;
        }
        setSubmitting(true);
        setSubmitError("");
        setSubmitMessage("");
        try {
            await submitReview({ productId: product.id, rating: draft.rating, comment: draft.comment });
            setSubmitMessage("Thanks! Your review was submitted and is awaiting approval.");
            setDraft({ rating: 5, comment: "" });
            setShowForm(false);
        } catch (err) {
            setSubmitError(err.message || "Failed to submit review.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-premium">
            <div className="border-b border-stone-100 px-5 sm:px-6 md:px-8">
                <div className="flex gap-5 sm:gap-7 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative whitespace-nowrap py-4 font-display text-[15px] font-semibold transition-colors sm:text-base ${
                                activeTab === tab.id ? "text-navy-950" : "text-stone-400 hover:text-navy-800"
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-gold" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-5 sm:p-6 md:p-10">
                {activeTab === "description" && (
                    <div
                        className="prose prose-sm max-w-4xl font-display prose-headings:text-navy-950 prose-p:text-stone-700 prose-p:text-[15px] prose-p:leading-[1.65] prose-li:text-stone-700 prose-li:text-[15px] prose-strong:text-navy-900 sm:prose-base sm:prose-p:text-base sm:prose-li:text-base"
                        dangerouslySetInnerHTML={{ __html: product.description || "<p>No description provided yet.</p>" }}
                    />
                )}

                {activeTab === "specifications" && (
                    <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
                        {(product.specifications || [
                            { key: "Brand", value: product.brand || "TWOWAY Ceylon" },
                            { key: "Category", value: product.category || product.categorySlug || "—" },
                            { key: "Availability", value: product.inStock ? "In stock" : "Out of stock" },
                            { key: "SKU", value: product.sku || `TWC-${product.id}` },
                        ]).map((spec, index) => (
                            <div key={index} className="rounded-xl border border-stone-100 bg-brand-cream/50 px-4 py-3.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-gold-dark">{spec.key}</p>
                                <p className="mt-1 font-display text-[15px] leading-relaxed text-navy-900 sm:text-base">{spec.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "reviews" && (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="grid gap-6 sm:gap-8 border-b border-stone-100 pb-6 sm:pb-8 lg:grid-cols-[200px_minmax(0,1fr)]">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Average rating</p>
                                <div className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight text-navy-950">{avgRating}</div>
                                <div className="mt-2"><StarRating rating={Math.round(Number(avgRating))} size="h-4 w-4 sm:h-5 sm:w-5" /></div>
                                <p className="mt-1.5 text-sm text-stone-500">{totalReviews} reviews</p>
                            </div>
                            <div className="space-y-2.5">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = ratingBreakdown[star] || 0;
                                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                    return (
                                        <div key={star} className="flex items-center gap-3">
                                            <span className="w-4 text-sm text-stone-500">{star}</span>
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                                                <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="w-10 text-right text-xs sm:text-sm text-stone-500">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <select
                                value={reviewSort}
                                onChange={(e) => setReviewSort(e.target.value)}
                                className="h-10 appearance-none rounded-xl border border-stone-200 bg-brand-cream px-3 pr-9 text-sm font-medium text-navy-900 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                    backgroundPosition: "right 0.7rem center",
                                    backgroundRepeat: "no-repeat",
                                    backgroundSize: "1em 1em",
                                }}
                            >
                                <option value="newest">Newest First</option>
                                <option value="highest">Highest Rated</option>
                                <option value="lowest">Lowest Rated</option>
                            </select>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm((s) => !s);
                                    setSubmitError("");
                                    setSubmitMessage("");
                                }}
                                className="rounded-xl border-2 border-navy-950 px-5 py-2.5 text-sm font-bold text-navy-950 transition-all hover:bg-navy-950 hover:text-white"
                            >
                                {showForm ? "Close form" : "Write a Review"}
                            </button>
                        </div>

                        {submitMessage && (
                            <div className="rounded-xl border border-brand-green/40 bg-brand-green/10 px-4 py-3 text-sm text-brand-green-dark">{submitMessage}</div>
                        )}

                        {showForm && (
                            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200/80 bg-brand-cream/50 p-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Your rating</p>
                                    <div className="mt-2"><StarPicker value={draft.rating} onChange={(v) => setDraft((d) => ({ ...d, rating: v }))} /></div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Your review</label>
                                    <textarea
                                        rows={4}
                                        value={draft.comment}
                                        onChange={(e) => setDraft((d) => ({ ...d, comment: e.target.value }))}
                                        placeholder="Share what you liked, fit, packaging, value…"
                                        className="mt-1 w-full rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-sm focus:border-brand-gold focus:outline-none"
                                        maxLength={4000}
                                    />
                                </div>
                                {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                                {!user?.uid && (
                                    <p className="text-xs text-amber-700">You'll need to sign in before submitting.</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
                                >
                                    {submitting ? "Submitting…" : "Submit review"}
                                </button>
                                <p className="text-[11px] text-stone-500">
                                    Reviews are visible after admin approval to keep the catalog spam-free.
                                </p>
                            </form>
                        )}

                        <div className="space-y-3 sm:space-y-4">
                            {sortedReviews.length === 0 ? (
                                <p className="rounded-xl border border-stone-200/60 bg-brand-cream/40 px-5 py-6 text-center text-sm text-stone-500">
                                    No reviews yet — be the first to share your experience.
                                </p>
                            ) : (
                                sortedReviews.map((review) => (
                                    <article key={review.id} className="rounded-xl border border-stone-100 bg-brand-cream/40 px-4 py-4 sm:px-5 sm:py-5">
                                        <div className="flex items-start gap-3">
                                            {review.avatar ? (
                                                <img src={review.avatar} alt={review.name || "Reviewer"} className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-950/10 text-sm font-bold text-navy-950 ring-2 ring-white">
                                                    {(review.name || "Verified buyer").slice(0, 1).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-sm font-bold text-navy-950">{review.name || "Verified buyer"}</h4>
                                                    {(review.verified !== false) && (
                                                        <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-green-dark">
                                                            Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                                    <StarRating rating={Number(review.rating) || 0} size="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                    <span className="text-[11px] text-stone-400">{review.date || formatDate(review.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {review.title && <h5 className="mt-3 text-sm font-bold text-navy-950">{review.title}</h5>}
                                        {(review.text || review.comment) && (
                                            <p className="mt-1.5 text-sm leading-relaxed text-stone-600 whitespace-pre-wrap">
                                                {review.text || review.comment}
                                            </p>
                                        )}
                                    </article>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductTabs;
