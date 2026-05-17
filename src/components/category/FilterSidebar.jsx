import React, { useState } from "react";

const CategoryMark = ({ slug, className = "h-4 w-4" }) => {
    const common = {
        className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinecap: "round",
        strokeLinejoin: "round",
    };

    switch (slug) {
        case "agriculture":
            return (<svg {...common}><path d="M12 20c4-2.5 6-6.2 6-10.5V4.5C14 5 11 7.7 11 12v8Z" /><path d="M12 20c-4-2.5-6-6.2-6-10.5V6c2.7.3 5 2.2 6 4.8" /><path d="M12 20v-8" /></svg>);
        case "construction":
            return (<svg {...common}><path d="M4 19h16" /><path d="M6 19V9l6-4 6 4v10" /><path d="M9 19v-5h6v5" /></svg>);
        case "manufacturing":
            return (<svg {...common}><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="m4.9 4.9 2.1 2.1" /><path d="m17 17 2.1 2.1" /><path d="M2 12h3" /><path d="M19 12h3" /><path d="m4.9 19.1 2.1-2.1" /><path d="M17 7l2.1-2.1" /></svg>);
        case "services":
            return (<svg {...common}><path d="M8 11c1.2 0 2-1 2-2.2S9.2 6.5 8 6.5 6 7.5 6 8.8 6.8 11 8 11Z" /><path d="M16 11c1.2 0 2-1 2-2.2S17.2 6.5 16 6.5 14 7.5 14 8.8s.8 2.2 2 2.2Z" /><path d="M4.5 18c.7-2.3 2.4-3.5 4.5-3.5 1.4 0 2.3.4 3 1.3.7-.9 1.6-1.3 3-1.3 2.1 0 3.8 1.2 4.5 3.5" /></svg>);
        case "general-products":
            return (<svg {...common}><path d="m4 8 8-4 8 4-8 4-8-4Z" /><path d="M4 8v8l8 4 8-4V8" /><path d="M12 12v8" /></svg>);
        default:
            return (<svg {...common}><circle cx="12" cy="12" r="8" /></svg>);
    }
};

const FilterSection = ({ title, defaultOpen = true, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-stone-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between py-3.5 text-left"
            >
                <span className="text-sm font-semibold text-navy-950">{title}</span>
                <svg
                    className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[500px] pb-4" : "max-h-0"}`}>
                {children}
            </div>
        </div>
    );
};

const FilterSidebar = ({ filters, setFilters, categories, brands, activeCategory }) => {
    const [priceMin, setPriceMin] = useState(filters.priceRange[0]);
    const [priceMax, setPriceMax] = useState(filters.priceRange[1]);

    const toggleCategory = (name) => {
        setFilters((prev) => ({
            ...prev,
            categories: prev.categories.includes(name)
                ? prev.categories.filter((c) => c !== name)
                : [...prev.categories, name],
        }));
    };

    const toggleBrand = (name) => {
        setFilters((prev) => ({
            ...prev,
            brands: prev.brands.includes(name)
                ? prev.brands.filter((b) => b !== name)
                : [...prev.brands, name],
        }));
    };

    const setRating = (min) => {
        setFilters((prev) => ({
            ...prev,
            ratings: prev.ratings.includes(min) ? [] : [min],
        }));
    };

    const applyPriceRange = () => {
        setFilters((prev) => ({
            ...prev,
            priceRange: [Number(priceMin), Number(priceMax)],
        }));
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-premium">
            {/* Header */}
            <div className="border-b border-stone-100 bg-brand-cream px-5 py-3.5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy-950">
                    <svg className="h-4 w-4 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                </h3>
            </div>

            <div className="px-5 py-1">
                {/* Category */}
                {!activeCategory && (
                    <FilterSection title="Category">
                        <div className="space-y-1.5">
                            {categories.map((cat) => (
                                <label
                                    key={cat.id}
                                    className="group flex cursor-pointer items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-brand-cream"
                                >
                                    <input
                                        type="checkbox"
                                        checked={filters.categories.includes(cat.name)}
                                        onChange={() => toggleCategory(cat.name)}
                                        className="h-4 w-4 cursor-pointer rounded border-stone-300 text-brand-green focus:ring-brand-green/30"
                                    />
                                    <span className="flex items-center gap-2 text-sm text-stone-700 group-hover:text-navy-950">
                                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-cream text-stone-500">
                                            <CategoryMark slug={cat.slug} className="h-3.5 w-3.5" />
                                        </span>
                                        {cat.name}
                                    </span>
                                    <span className="ml-auto rounded-full bg-brand-cream px-2 py-0.5 text-[10px] font-medium text-stone-400">
                                        {cat.productCount}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>
                )}

                {/* Price */}
                <FilterSection title="Price Range">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">$</span>
                                <input
                                    type="number"
                                    value={priceMin}
                                    onChange={(e) => setPriceMin(e.target.value)}
                                    placeholder="Min"
                                    className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-7 pr-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                                />
                            </div>
                            <span className="text-xs text-stone-300">–</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">$</span>
                                <input
                                    type="number"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(e.target.value)}
                                    placeholder="Max"
                                    className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-7 pr-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                                />
                            </div>
                        </div>
                        <button
                            onClick={applyPriceRange}
                            className="h-9 w-full rounded-lg bg-brand-cream text-sm font-medium text-navy-900 transition-colors hover:bg-brand-cream-dark"
                        >
                            Apply Price
                        </button>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                [0, 25],
                                [25, 50],
                                [50, 100],
                                [100, 500],
                                [500, 1600],
                            ].map(([min, max]) => (
                                <button
                                    key={`${min}-${max}`}
                                    onClick={() => {
                                        setPriceMin(min);
                                        setPriceMax(max);
                                        setFilters((prev) => ({ ...prev, priceRange: [min, max] }));
                                    }}
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                        filters.priceRange[0] === min && filters.priceRange[1] === max
                                            ? "border-brand-gold bg-brand-gold text-navy-950"
                                            : "border-stone-200 text-stone-600 hover:border-brand-gold hover:text-brand-gold-dark"
                                    }`}
                                >
                                    ${min} – ${max === 1600 ? "1600+" : max}
                                </button>
                            ))}
                        </div>
                    </div>
                </FilterSection>

                {/* Rating */}
                <FilterSection title="Customer Rating">
                    <div className="space-y-2">
                        {[4, 3, 2, 1].map((rating) => (
                            <label key={rating} className="group flex cursor-pointer items-center gap-3">
                                <input
                                    type="radio"
                                    name="rating"
                                    checked={filters.ratings.includes(rating)}
                                    onChange={() => setRating(rating)}
                                    className="h-4 w-4 cursor-pointer border-stone-300 text-brand-gold focus:ring-brand-gold/30"
                                />
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`h-3.5 w-3.5 ${i < rating ? "text-brand-gold" : "text-stone-200"}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                    <span className="ml-1 text-xs text-stone-500">& up</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Discount */}
                <FilterSection title="Discount" defaultOpen={false}>
                    <div className="space-y-2">
                        {[10, 20, 30, 40, 50].map((d) => (
                            <label key={d} className="group flex cursor-pointer items-center gap-3">
                                <input
                                    type="radio"
                                    name="discount"
                                    checked={filters.discount === d}
                                    onChange={() =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            discount: prev.discount === d ? null : d,
                                        }))
                                    }
                                    className="h-4 w-4 cursor-pointer border-stone-300 text-brand-gold focus:ring-brand-gold/30"
                                />
                                <span className="text-sm text-stone-700 group-hover:text-navy-950">{d}% or more</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Brand */}
                <FilterSection title="Brand" defaultOpen={false}>
                    <div className="space-y-2">
                        {brands.map((brand) => (
                            <label key={brand} className="group flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={filters.brands.includes(brand)}
                                    onChange={() => toggleBrand(brand)}
                                    className="h-4 w-4 cursor-pointer rounded border-stone-300 text-brand-green focus:ring-brand-green/30"
                                />
                                <span className="text-sm text-stone-700 group-hover:text-navy-950">{brand}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Availability */}
                <FilterSection title="Availability" defaultOpen={false}>
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={filters.inStock}
                            onChange={() =>
                                setFilters((prev) => ({ ...prev, inStock: !prev.inStock }))
                            }
                            className="h-4 w-4 cursor-pointer rounded border-stone-300 text-brand-green focus:ring-brand-green/30"
                        />
                        <span className="text-sm text-stone-700">In Stock Only</span>
                    </label>
                </FilterSection>
            </div>
        </div>
    );
};

export default FilterSidebar;
