import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    const handlePageChange = (page) => {
        onPageChange(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-stone-100 pt-6 sm:pt-8">
            <p className="text-xs sm:text-sm text-stone-500">
                Page <span className="font-semibold text-navy-950">{currentPage}</span> of{" "}
                <span className="font-semibold text-navy-950">{totalPages}</span>
            </p>

            <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg transition-all ${
                        currentPage === 1
                            ? "text-stone-300 cursor-not-allowed"
                            : "text-stone-600 hover:bg-brand-cream hover:text-navy-950"
                    }`}
                >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                        <span key={`dot-${idx}`} className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center text-xs sm:text-sm text-stone-400">
                            ···
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                                currentPage === page
                                    ? "bg-navy-950 text-white shadow-lg shadow-navy-950/20"
                                    : "text-stone-600 hover:bg-brand-cream hover:text-navy-950"
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg transition-all ${
                        currentPage === totalPages
                            ? "text-stone-300 cursor-not-allowed"
                            : "text-stone-600 hover:bg-brand-cream hover:text-navy-950"
                    }`}
                >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Jump to page */}
            <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs sm:text-sm text-stone-500">Go to:</span>
                <input
                    type="number"
                    min={1}
                    max={totalPages}
                    defaultValue={currentPage}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const val = parseInt(e.target.value);
                            if (val >= 1 && val <= totalPages) handlePageChange(val);
                        }
                    }}
                    className="h-8 w-14 rounded-lg border border-stone-200 bg-brand-cream text-center text-sm focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                />
            </div>
        </div>
    );
};

export default Pagination;
