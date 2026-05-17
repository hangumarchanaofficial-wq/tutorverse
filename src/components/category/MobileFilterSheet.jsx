import React from "react";
import FilterSidebar from "./FilterSidebar";

const MobileFilterSheet = ({
                               isOpen,
                               onClose,
                               filters,
                               setFilters,
                               categories,
                               brands,
                               activeCategory,
                               resultCount,
                               onClearAll,
                           }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-premium-xl animate-slide-up">
                {/* Handle */}
                <div className="flex justify-center pt-2.5 pb-1">
                    <div className="h-1 w-10 rounded-full bg-stone-200" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                    <h3 className="text-base font-bold text-navy-950">Filters</h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClearAll}
                            className="text-xs font-semibold text-brand-gold-dark hover:text-brand-gold transition-colors"
                        >
                            Clear All
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 hover:bg-brand-cream transition-colors"
                        >
                            <svg className="h-5 w-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <FilterSidebar
                        filters={filters}
                        setFilters={setFilters}
                        categories={categories}
                        brands={brands}
                        activeCategory={activeCategory}
                    />
                </div>

                {/* Footer */}
                <div className="border-t border-stone-100 bg-white px-4 py-3">
                    <button
                        onClick={onClose}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-950 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
                    >
                        Show {resultCount} Result{resultCount !== 1 && "s"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileFilterSheet;
