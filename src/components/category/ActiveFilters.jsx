import React from "react";

const ActiveFilters = ({
    filters,
    activeCategory,
    lockedCategoryNames = [],
    onRemove,
    onClearAll,
    activeFilterCount,
}) => {
    if (activeFilterCount === 0) return null;

    return (
        <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="mr-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                Active
            </span>

            {!activeCategory &&
                filters.categories
                    .filter((cat) => !lockedCategoryNames.includes(cat))
                    .map((cat) => (
                    <Chip key={cat} label={cat} onRemove={() => onRemove("category", cat)} />
                ))}

            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 1600) && (
                <Chip
                    label={`$${filters.priceRange[0]} – $${filters.priceRange[1]}`}
                    onRemove={() => onRemove("price")}
                />
            )}

            {filters.ratings.length > 0 && (
                <Chip label={`${filters.ratings[0]}★ & up`} onRemove={() => onRemove("rating")} />
            )}

            {filters.brands.map((brand) => (
                <Chip key={brand} label={brand} onRemove={() => onRemove("brand", brand)} />
            ))}

            {filters.discount && (
                <Chip label={`${filters.discount}%+ off`} onRemove={() => onRemove("discount")} />
            )}

            {filters.inStock && <Chip label="In Stock" onRemove={() => onRemove("inStock")} />}

            {activeFilterCount > 1 && (
                <button
                    onClick={onClearAll}
                    className="ml-1 text-[11px] font-semibold text-red-500 transition-colors hover:text-red-600"
                >
                    Clear All
                </button>
            )}
        </div>
    );
};

const Chip = ({ label, onRemove }) => (
    <span className="group inline-flex items-center gap-1 rounded-full border border-brand-gold/25 bg-brand-gold/10 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-brand-gold-dark transition-colors hover:bg-brand-gold/20">
        {label}
        <button
            onClick={onRemove}
            className="flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full transition-colors hover:bg-brand-gold/30"
        >
            <svg className="h-2 w-2 sm:h-2.5 sm:w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </span>
);

export default ActiveFilters;
