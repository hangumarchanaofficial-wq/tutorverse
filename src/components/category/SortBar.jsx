import React, { useEffect, useState } from "react";

const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "popular", label: "Most Popular" },
    { value: "newest", label: "Newest" },
    { value: "rating", label: "Top Rated" },
    { value: "price-low", label: "Price: Low → High" },
    { value: "price-high", label: "Price: High → Low" },
];

const SortBar = ({
                     sortBy,
                     setSortBy,
                     gridCols,
                     setGridCols,
                     totalResults,
                     currentPage,
                     itemsPerPage,
                     onOpenMobileFilter,
                     activeFilterCount,
                 }) => {
    const [mobileSortOpen, setMobileSortOpen] = useState(false);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalResults);
    const currentSort = sortOptions.find((opt) => opt.value === sortBy) || sortOptions[0];

    useEffect(() => {
        if (!mobileSortOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileSortOpen]);

    return (
        <>
        <div className="mb-3 sm:mb-4 rounded-xl sm:rounded-2xl border border-stone-200/60 bg-white p-2.5 sm:p-4 shadow-premium">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: filter button (mobile) + result count */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={onOpenMobileFilter}
                        className="relative flex items-center gap-1.5 rounded-lg bg-brand-cream px-3 py-2 text-xs sm:text-sm font-medium text-navy-900 transition-colors hover:bg-brand-cream-dark lg:hidden"
                    >
                        <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-brand-gold text-[9px] sm:text-[10px] font-bold text-navy-950">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    <p className="text-[11px] sm:text-sm text-stone-500">
                        <span className="font-semibold text-navy-950">{startItem}–{endItem}</span>
                        {" "}of{" "}
                        <span className="font-semibold text-navy-950">{totalResults}</span>
                        <span className="hidden sm:inline"> products</span>
                    </p>
                </div>

                {/* Right: sort + grid toggle */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex flex-1 items-center gap-1.5 sm:flex-initial sm:gap-2">
                        <label className="hidden whitespace-nowrap text-xs sm:text-sm text-stone-500 sm:inline">Sort:</label>
                        <button
                            type="button"
                            onClick={() => setMobileSortOpen(true)}
                            className="flex h-8 w-full items-center justify-between rounded-lg border border-stone-200 bg-brand-cream px-2.5 text-xs font-medium text-navy-900 sm:hidden"
                        >
                            <span className="truncate">{currentSort.label}</span>
                            <svg className="h-3.5 w-3.5 flex-shrink-0 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
                            </svg>
                        </button>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="hidden h-8 w-full cursor-pointer appearance-none rounded-lg border border-stone-200 bg-brand-cream px-2.5 pr-7 text-xs font-medium text-navy-900 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20 sm:block sm:h-10 sm:w-auto sm:rounded-xl sm:px-3 sm:pr-9 sm:text-sm"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: "right 0.5rem center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "1em 1em",
                            }}
                        >
                            {sortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Grid toggle — desktop only */}
                    <div className="hidden overflow-hidden rounded-lg border border-stone-200 md:flex">
                        {[2, 3, 4].map((cols) => (
                            <button
                                key={cols}
                                onClick={() => setGridCols(cols)}
                                className={`p-2 transition-colors ${
                                    gridCols === cols
                                        ? "bg-navy-950 text-white"
                                        : "text-stone-400 hover:bg-brand-cream hover:text-stone-600"
                                }`}
                                title={`${cols} columns`}
                            >
                                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                                    {cols === 2 && (
                                        <>
                                            <rect x="0" y="0" width="7" height="7" rx="1.5" />
                                            <rect x="9" y="0" width="7" height="7" rx="1.5" />
                                            <rect x="0" y="9" width="7" height="7" rx="1.5" />
                                            <rect x="9" y="9" width="7" height="7" rx="1.5" />
                                        </>
                                    )}
                                    {cols === 3 && (
                                        <>
                                            <rect x="0" y="0" width="4" height="7" rx="1" />
                                            <rect x="6" y="0" width="4" height="7" rx="1" />
                                            <rect x="12" y="0" width="4" height="7" rx="1" />
                                            <rect x="0" y="9" width="4" height="7" rx="1" />
                                            <rect x="6" y="9" width="4" height="7" rx="1" />
                                            <rect x="12" y="9" width="4" height="7" rx="1" />
                                        </>
                                    )}
                                    {cols === 4 && (
                                        <>
                                            <rect x="0" y="0" width="3" height="7" rx="0.75" />
                                            <rect x="4.33" y="0" width="3" height="7" rx="0.75" />
                                            <rect x="8.66" y="0" width="3" height="7" rx="0.75" />
                                            <rect x="13" y="0" width="3" height="7" rx="0.75" />
                                            <rect x="0" y="9" width="3" height="7" rx="0.75" />
                                            <rect x="4.33" y="9" width="3" height="7" rx="0.75" />
                                            <rect x="8.66" y="9" width="3" height="7" rx="0.75" />
                                            <rect x="13" y="9" width="3" height="7" rx="0.75" />
                                        </>
                                    )}
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        {mobileSortOpen && (
            <div className="fixed inset-0 z-[80] sm:hidden">
                <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={() => setMobileSortOpen(false)} />
                <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white shadow-premium-xl animate-slide-up">
                    <div className="flex justify-center pb-1 pt-2.5">
                        <div className="h-1 w-10 rounded-full bg-stone-200" />
                    </div>
                    <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">Sort Products</p>
                            <h3 className="mt-1 text-base font-bold text-navy-950">Choose sort order</h3>
                        </div>
                        <button
                            onClick={() => setMobileSortOpen(false)}
                            className="rounded-lg p-1.5 transition-colors hover:bg-brand-cream"
                        >
                            <svg className="h-5 w-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="px-4 py-3">
                        <div className="space-y-2">
                            {sortOptions.map((opt) => {
                                const active = opt.value === sortBy;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            setSortBy(opt.value);
                                            setMobileSortOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
                                            active
                                                ? "border-brand-gold/30 bg-brand-cream text-navy-950"
                                                : "border-stone-200 bg-white text-navy-800"
                                        }`}
                                    >
                                        <span className="text-sm font-medium">{opt.label}</span>
                                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? "border-brand-gold bg-brand-gold/15" : "border-stone-300"}`}>
                                            {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-gold-dark" />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default SortBar;
