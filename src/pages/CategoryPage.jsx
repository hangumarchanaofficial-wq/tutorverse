import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/category/FilterSidebar";
import MobileFilterSheet from "../components/category/MobileFilterSheet";
import SortBar from "../components/category/SortBar";
import Pagination from "../components/category/Pagination";
import ActiveFilters from "../components/category/ActiveFilters";
import { allProducts, categories as localCategories, filterBrands } from "../data/dummyData";
import { fetchProducts, fetchCategories } from "../services/productApi";
import { normalizeProducts } from "../lib/normalizeProduct";

const ITEMS_PER_PAGE = 12;
const NEW_ARRIVAL_WINDOW_DAYS = 90;

const latestProductTimestamp = allProducts.reduce((latest, product) => {
    const timestamp = new Date(product.dateAdded).getTime();
    return Number.isNaN(timestamp) ? latest : Math.max(latest, timestamp);
}, 0);

const collectionConfigs = {
    "flash-deals": {
        title: "Flash Deals",
        description: (count) => `Catch ${count} limited-time markdowns across the catalogue before the best discounts are gone.`,
        predicate: (product) => product.discount >= 35,
        defaultSort: "relevance",
    },
    "new-arrivals": {
        title: "New Arrivals",
        description: (count) => `Discover ${count} recently added products from the latest catalogue updates.`,
        predicate: (product) =>
            new Date(product.dateAdded).getTime() >=
            latestProductTimestamp - NEW_ARRIVAL_WINDOW_DAYS * 24 * 60 * 60 * 1000,
        defaultSort: "newest",
    },
    "best-sellers": {
        title: "Best Sellers",
        description: (count) => `Explore ${count} top-performing products shoppers are buying most right now.`,
        predicate: (product) => product.badge === "Best Seller" || product.reviews >= 700,
        defaultSort: "popular",
    },
    fashion: {
        title: "Fashion",
        description: (count) => `Browse ${count} fashion picks across apparel, shoes, bags, and accessories.`,
        categories: [
            "Men's Clothing",
            "Women's Clothing",
            "Women's Curve Clothing",
            "Women's Shoes",
            "Women's Lingerie & Lounge",
            "Men's Shoes",
            "Men's Big & Tall",
            "Men's Underwear & Sleepwear",
            "Kids' Fashion",
            "Kids' Shoes",
            "Baby & Maternity",
            "Jewelry & Accessories",
            "Bags & Luggage",
            "Beachwear",
        ],
        defaultSort: "relevance",
    },
    "home-garden": {
        title: "Home & Garden",
        description: (count) => `Shop ${count} home, garden, furniture, and appliance essentials in one place.`,
        categories: [
            "Home & Kitchen",
            "Patio, Lawn & Garden",
            "Furniture",
            "Appliances",
            "Tools & Home Improvement",
        ],
        defaultSort: "relevance",
    },
    beauty: {
        title: "Beauty",
        description: (count) => `Explore ${count} beauty, wellness, and household care products.`,
        categories: ["Beauty & Health", "Health & Household"],
        defaultSort: "relevance",
    },
    sports: {
        title: "Sports",
        description: (count) => `Find ${count} fitness, training, and outdoor essentials.`,
        categories: ["Sports & Outdoors"],
        defaultSort: "popular",
    },
    toys: {
        title: "Toys",
        description: (count) => `Browse ${count} toys and games for gifting, play, and learning.`,
        categories: ["Toys & Games"],
        defaultSort: "popular",
    },
};

const CategoryPage = () => {
    const [remoteProducts, setRemoteProducts] = useState([]);
    const [remoteLoaded, setRemoteLoaded] = useState(false);
    const [apiCategories, setApiCategories] = useState([]);
    const navigate = useNavigate();
    const { slug } = useParams();
    const [searchParams] = useSearchParams();

    const categories = useMemo(() => {
        if (apiCategories.length === 0) return localCategories;
        return apiCategories.map((ac) => {
            const local = localCategories.find(
                (lc) => lc.slug === ac.slug || lc.name.toLowerCase() === ac.name.toLowerCase()
            );
            return { ...local, ...ac, count: local?.count ?? 0 };
        });
    }, [apiCategories]);

    const resolveCategoryFromParam = useCallback(
        (value = "") => {
            const v = value.trim().toLowerCase();
            if (!v || v === "all") return null;
            return (
                categories.find(
                    (c) => c.slug === v || c.name.toLowerCase() === v
                ) || null
            );
        },
        [categories]
    );

    const activeCategory = categories.find((c) => c.slug === slug) || null;
    const searchTermRaw = searchParams.get("q")?.trim() || "";
    const searchTerm = searchTermRaw.toLowerCase();
    const subTermRaw = searchParams.get("sub")?.trim() || "";
    const subTerm = subTermRaw.toLowerCase();
    const searchCategory = searchParams.get("category") || "";
    const collectionKey = searchParams.get("collection")?.trim().toLowerCase() || "";
    const collectionConfig = collectionConfigs[collectionKey] || null;
    const routeCategory = resolveCategoryFromParam(searchCategory);
    const lockedCategoryNames = useMemo(
        () =>
            activeCategory
                ? [activeCategory.name]
                : routeCategory
                    ? [routeCategory.name]
                    : collectionConfig?.categories || [],
        [activeCategory, routeCategory, collectionConfig]
    );

    const [sortBy, setSortBy] = useState("relevance");
    const [currentPage, setCurrentPage] = useState(1);
    const [gridCols, setGridCols] = useState(4);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    const [filters, setFilters] = useState({
        categories: lockedCategoryNames,
        priceRange: [0, 1600],
        ratings: [],
        brands: [],
        discount: null,
        inStock: false,
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sortBy]);

    useEffect(() => {
        setFilters((prev) => ({ ...prev, categories: lockedCategoryNames }));
    }, [lockedCategoryNames]);

    useEffect(() => {
        setSortBy(collectionConfig?.defaultSort || "relevance");
    }, [activeCategory, collectionConfig, searchTermRaw, subTermRaw]);

    useEffect(() => {
        let active = true;
        fetchProducts({ category: slug || "", q: searchTermRaw || "" })
            .then((items) => {
                if (!active) return;
                const normalized = normalizeProducts(items);
                if (normalized.length > 0) {
                    setRemoteProducts(normalized);
                }
                setRemoteLoaded(true);
            })
            .catch(() => {
                if (!active) return;
                setRemoteLoaded(true);
            });
        return () => {
            active = false;
        };
    }, [slug, searchTermRaw]);

    useEffect(() => {
        let cancelled = false;
        fetchCategories()
            .then((items) => {
                if (!cancelled && items.length > 0) {
                    setApiCategories(items);
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const filteredProducts = useMemo(() => {
        let result = [...(remoteLoaded && remoteProducts.length > 0 ? remoteProducts : allProducts)];

        if (collectionConfig?.predicate) {
            result = result.filter(collectionConfig.predicate);
        }
        if (filters.categories.length > 0) {
            result = result.filter((p) => filters.categories.includes(p.category));
        }
        if (searchTerm) {
            result = result.filter((p) =>
                [p.title, p.category, p.brand]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(searchTerm))
            );
        }
        if (subTerm) {
            result = result.filter((p) =>
                [p.title, p.category, p.brand]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(subTerm))
            );
        }
        result = result.filter(
            (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
        );
        if (filters.ratings.length > 0) {
            const minRating = Math.min(...filters.ratings);
            result = result.filter((p) => p.rating >= minRating);
        }
        if (filters.brands.length > 0) {
            result = result.filter((p) => filters.brands.includes(p.brand));
        }
        if (filters.discount) {
            result = result.filter((p) => p.discount >= filters.discount);
        }
        if (filters.inStock) {
            result = result.filter((p) => p.inStock);
        }

        switch (sortBy) {
            case "price-low":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price-high":
                result.sort((a, b) => b.price - a.price);
                break;
            case "newest":
                result.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case "popular":
                result.sort((a, b) => b.reviews - a.reviews);
                break;
            case "rating":
                result.sort((a, b) => b.rating - a.rating);
                break;
            default:
                break;
        }

        return result;
    }, [filters, sortBy, searchTerm, subTerm, collectionConfig, remoteLoaded, remoteProducts]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const activeFilterCount = useMemo(() => {
        const unlockedCategories = filters.categories.filter(
            (category) => !lockedCategoryNames.includes(category)
        );
        let count = 0;
        if (unlockedCategories.length > 0 && !activeCategory) count += unlockedCategories.length;
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1600) count++;
        if (filters.ratings.length > 0) count++;
        if (filters.brands.length > 0) count += filters.brands.length;
        if (filters.discount) count++;
        if (filters.inStock) count++;
        return count;
    }, [filters, activeCategory, lockedCategoryNames]);

    const clearAllFilters = useCallback(() => {
        setFilters({
            categories: lockedCategoryNames,
            priceRange: [0, 1600],
            ratings: [],
            brands: [],
            discount: null,
            inStock: false,
        });
    }, [lockedCategoryNames]);

    const removeFilter = useCallback((type, value) => {
        setFilters((prev) => {
            const next = { ...prev };
            switch (type) {
                case "category":
                    next.categories = prev.categories.filter((c) => c !== value);
                    break;
                case "brand":
                    next.brands = prev.brands.filter((b) => b !== value);
                    break;
                case "rating":
                    next.ratings = [];
                    break;
                case "price":
                    next.priceRange = [0, 1600];
                    break;
                case "discount":
                    next.discount = null;
                    break;
                case "inStock":
                    next.inStock = false;
                    break;
                default:
                    break;
            }
            return next;
        });
    }, []);

    const pageTitle = activeCategory
        ? activeCategory.name
        : collectionConfig?.title || (searchTermRaw ? `Search Results for "${searchTermRaw}"` : "All Products");

    const pageDescription = activeCategory
        ? subTermRaw
            ? `Showing ${filteredProducts.length} ${subTermRaw.toLowerCase()} listings in ${activeCategory.name.toLowerCase()}.`
            : `Browse ${filteredProducts.length} curated listings from verified ${activeCategory.name.toLowerCase()} suppliers.`
        : collectionConfig
            ? collectionConfig.description(filteredProducts.length)
            : searchTermRaw
                ? `Showing ${filteredProducts.length} results for "${searchTermRaw}" across products, brands, and categories.`
                : `Browse all ${filteredProducts.length} listings across fashion, electronics, home, beauty, and more.`;

    const resetListingView = () => {
        if (searchTermRaw || subTermRaw || collectionConfig) {
            navigate("/category");
            return;
        }
        clearAllFilters();
    };

    return (
        <div className="min-h-screen bg-brand-cream">
            {/* ── Breadcrumb & Header ── */}
            <div className="border-b border-stone-200/60 bg-gradient-to-b from-white to-brand-cream">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:py-5 md:py-6">
                    {/* Breadcrumb */}
                    <nav className="mb-3 flex items-center gap-1.5 text-xs sm:text-sm text-stone-500 overflow-x-auto scrollbar-hide">
                        <Link to="/" className="whitespace-nowrap hover:text-navy-950 transition-colors">
                            Home
                        </Link>
                        <svg className="w-3 h-3 flex-shrink-0 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {activeCategory ? (
                            <>
                                <Link to="/category" className="whitespace-nowrap hover:text-navy-950 transition-colors">
                                    All Categories
                                </Link>
                                <svg className="w-3 h-3 flex-shrink-0 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <span className="whitespace-nowrap font-medium text-navy-950">{activeCategory.name}</span>
                                {subTermRaw && (
                                    <>
                                        <svg className="w-3 h-3 flex-shrink-0 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="whitespace-nowrap font-medium text-navy-950">{subTermRaw}</span>
                                    </>
                                )}
                            </>
                        ) : (
                            <span className="whitespace-nowrap font-medium text-navy-950">
                                {collectionConfig?.title || (searchTermRaw ? `Search: ${searchTermRaw}` : "All Products")}
                            </span>
                        )}
                    </nav>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-1.5 flex items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-gold-dark">
                                <span className="h-px w-6 bg-brand-gold/50" />
                                Product Catalogue
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-navy-950 font-display">
                                {pageTitle}
                            </h1>
                            <p className="mt-1.5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                                {pageDescription}
                            </p>
                        </div>

                        <div className="hidden sm:block w-fit rounded-xl border border-stone-200/60 bg-white px-4 py-3 shadow-premium">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                                Results
                            </p>
                            <p className="mt-0.5 text-2xl font-bold text-navy-950">{filteredProducts.length}</p>
                            <p className="text-xs text-stone-500">Available products</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 sm:py-6 md:py-8">
                <div className="flex gap-5 xl:gap-7">
                    {/* Desktop Filter Sidebar */}
                    <div className="hidden lg:block w-[260px] xl:w-[280px] flex-shrink-0">
                        <div className="sticky top-28">
                            <FilterSidebar
                                filters={filters}
                                setFilters={setFilters}
                                categories={categories}
                                brands={filterBrands}
                                activeCategory={activeCategory}
                            />
                        </div>
                    </div>

                    {/* Product Grid Area */}
                    <div className="flex-1 min-w-0">
                        {/* Sort Bar */}
                        <SortBar
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            gridCols={gridCols}
                            setGridCols={setGridCols}
                            totalResults={filteredProducts.length}
                            currentPage={currentPage}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onOpenMobileFilter={() => setMobileFilterOpen(true)}
                            activeFilterCount={activeFilterCount}
                        />

                        {/* Active Filters */}
                        <ActiveFilters
                            filters={filters}
                            activeCategory={activeCategory}
                            lockedCategoryNames={lockedCategoryNames}
                            onRemove={removeFilter}
                            onClearAll={clearAllFilters}
                            activeFilterCount={activeFilterCount}
                        />

                        {/* Product Grid */}
                        {paginatedProducts.length > 0 ? (
                            <div
                                className={`grid gap-2.5 sm:gap-4 md:gap-5 ${
                                    gridCols === 2
                                        ? "grid-cols-2"
                                        : gridCols === 3
                                            ? "grid-cols-2 md:grid-cols-3"
                                            : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                                }`}
                            >
                                {paginatedProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200/60 bg-white py-16 sm:py-20 text-center shadow-premium">
                                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-brand-cream mb-4 sm:mb-5">
                                    <svg className="h-8 w-8 sm:h-10 sm:w-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-navy-950 mb-1.5">
                                    No products found
                                </h3>
                                <p className="text-stone-500 text-xs sm:text-sm max-w-sm mb-5 px-4">
                                    Try adjusting your filters or search criteria to find what you're looking for.
                                </p>
                                <button
                                    onClick={resetListingView}
                                    className="px-5 py-2.5 bg-brand-gold text-navy-950 text-sm font-semibold rounded-full hover:bg-brand-gold-dark transition-colors shadow-sm"
                                >
                                    {searchTermRaw || subTermRaw || collectionConfig ? "View All Products" : "Clear All Filters"}
                                </button>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Sheet */}
            <MobileFilterSheet
                isOpen={mobileFilterOpen}
                onClose={() => setMobileFilterOpen(false)}
                filters={filters}
                setFilters={setFilters}
                categories={categories}
                brands={filterBrands}
                activeCategory={activeCategory}
                resultCount={filteredProducts.length}
                onClearAll={clearAllFilters}
            />
        </div>
    );
};

export default CategoryPage;
