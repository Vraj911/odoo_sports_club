import { useState, useMemo } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  SlidersHorizontal,
  ShoppingCart,
  X,
  Sparkles,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "../components/ProductCard";
import { MemberDiscountBanner } from "../components/MemberDiscountBanner";
import { useShop } from "../shopStore";
import { useAuth } from "@/app/providers/AuthProvider";
import { CATEGORY_LABELS, CATEGORY_EMOJI } from "../types";
import type { ProductCategory, Sport } from "../types";
import { cn } from "@/lib/cn";

export default function ShopCatalogPage() {
  const { user } = useAuth();
  const isMemberApp = typeof window !== "undefined" && window.location.pathname.startsWith("/app");
  const basePath = isMemberApp ? "/app/shop" : "/shop";
  const cartPath = isMemberApp ? "/app/cart" : "/cart";

  const {
    products,
    cartItemCount,
    categoryFilter,
    sportFilter,
    searchQuery,
    sortBy,
    setCategory,
    setSport,
    setSearch,
    setSort,
  } = useShop();

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(30000);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Available brands derived from all products
  const allBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => brands.add(p.brand));
    return Array.from(brands).sort();
  }, [products]);

  // Filtered products with local brand, in-stock, and price filters
  const displayedProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }

    // Sport filter
    if (sportFilter !== "all") {
      list = list.filter((p) => p.sport === sportFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brand));
    }

    // In stock only
    if (inStockOnly) {
      list = list.filter((p) => p.variants.some((v) => v.stock > 0));
    }

    // Max price
    list = list.filter((p) => p.basePrice <= maxPrice);

    // Sorting
    switch (sortBy) {
      case "price-asc":
        list.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case "price-desc":
        list.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case "newest":
        list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "name":
      default:
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  }, [products, categoryFilter, sportFilter, searchQuery, selectedBrands, inStockOnly, maxPrice, sortBy]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const clearAllFilters = () => {
    setCategory("all");
    setSport("all");
    setSearch("");
    setSelectedBrands([]);
    setInStockOnly(false);
    setMaxPrice(30000);
  };

  const hasActiveFilters =
    categoryFilter !== "all" ||
    sportFilter !== "all" ||
    searchQuery.trim() !== "" ||
    selectedBrands.length > 0 ||
    inStockOnly ||
    maxPrice < 30000;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Top Banner / Discount info */}
      <MemberDiscountBanner />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-chalk/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="size-6 text-volt-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
              CCMS Pro Gear Shop
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-chalk/70 mt-1">
            Official club store: tournament-grade tennis, padel, badminton rackets, balls, court shoes & apparel.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Cart button */}
          <AppLink to={cartPath}>
            <Button
              variant="primary"
              className="relative shadow-volt"
              leftIcon={<ShoppingCart className="size-4" />}
            >
              <span>View Cart</span>
              {cartItemCount > 0 && (
                <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-navy-950 px-1.5 text-[11px] font-bold text-volt-400">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </AppLink>

          {/* Mobile Filter toggle */}
          <Button
            variant="secondary"
            className="md:hidden"
            onClick={() => setMobileFilterOpen(true)}
            leftIcon={<SlidersHorizontal className="size-4" />}
          >
            Filters
          </Button>
        </div>
      </div>

      {/* Search and Quick Category Pills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-chalk/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rackets, shoes, Wilson balls, Yonex strings..."
              className="w-full h-12 pl-11 pr-10 rounded-pill bg-white/8 border border-chalk/18 text-sm text-chalk placeholder-chalk/40 focus:outline-none focus:border-volt-400 focus:ring-4 focus:ring-volt-400/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-chalk/40 hover:text-chalk"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="size-4 text-chalk/40" />
            <select
              value={sortBy}
              onChange={(e) => setSort(e.target.value as any)}
              className="h-12 px-4 rounded-pill bg-white/8 border border-chalk/18 text-xs font-semibold text-chalk focus:outline-none focus:border-volt-400"
            >
              <option value="name" className="bg-navy-900 text-chalk">Sort by: Name (A-Z)</option>
              <option value="price-asc" className="bg-navy-900 text-chalk">Price: Low to High</option>
              <option value="price-desc" className="bg-navy-900 text-chalk">Price: High to Low</option>
              <option value="newest" className="bg-navy-900 text-chalk">Newest Arrivals</option>
            </select>
          </div>
        </div>

        {/* Category horizontal scrolling bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "px-4 py-2 rounded-pill text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              categoryFilter === "all"
                ? "bg-volt-400 text-ink-900 shadow-sm"
                : "bg-white/6 text-chalk/70 hover:bg-white/10 hover:text-chalk border border-chalk/10"
            )}
          >
            <span>All Categories</span>
            <span className="text-[10px] opacity-70">({products.length})</span>
          </button>

          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            const isSelected = categoryFilter === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3.5 py-2 rounded-pill text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                  isSelected
                    ? "bg-volt-400 text-ink-900 font-semibold shadow-sm"
                    : "bg-white/6 text-chalk/70 hover:bg-white/10 hover:text-chalk border border-chalk/10"
                )}
              >
                <span>{CATEGORY_EMOJI[cat]}</span>
                <span>{CATEGORY_LABELS[cat]}</span>
                <span className="text-[10px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block space-y-6 rounded-[24px] border border-chalk/14 bg-court-500/70 p-6 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-chalk/10">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-volt-400" />
              <h3 className="text-sm font-bold text-chalk">Refine Catalog</h3>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-volt-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Sport Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-chalk/80 uppercase tracking-wider">
              Sport Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "all", label: "All Sports" },
                { id: "tennis", label: "Tennis" },
                { id: "padel", label: "Padel" },
                { id: "badminton", label: "Badminton" },
                { id: "cricket-net", label: "Cricket" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSport(s.id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-center",
                    sportFilter === s.id
                      ? "bg-volt-400 text-ink-900 font-bold"
                      : "bg-white/5 text-chalk/70 hover:bg-white/10"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* In Stock Only Switch */}
          <div className="flex items-center justify-between py-2 border-t border-b border-chalk/10">
            <span className="text-xs font-medium text-chalk">In Stock Only</span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="size-4 accent-volt-400 rounded cursor-pointer"
            />
          </div>

          {/* Max Price Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-chalk/80 uppercase tracking-wider">
                Max Price
              </span>
              <span className="font-mono text-volt-400 font-bold">
                ₹{maxPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="35000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-volt-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-chalk/40 font-mono">
              <span>₹500</span>
              <span>₹35,000</span>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2.5 pt-2">
            <label className="text-xs font-semibold text-chalk/80 uppercase tracking-wider">
              Brands
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {allBrands.map((brand) => {
                const checked = selectedBrands.includes(brand);
                return (
                  <label
                    key={brand}
                    className="flex items-center gap-2.5 text-xs text-chalk/80 hover:text-chalk cursor-pointer py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(brand)}
                      className="size-3.5 accent-volt-400 rounded"
                    />
                    <span>{brand}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Product Grid Area (3 Cols) */}
        <div className="md:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-chalk/60">
            <span>
              Showing <strong className="text-chalk font-mono">{displayedProducts.length}</strong> equipment & apparel items
            </span>
            {hasActiveFilters && (
              <span className="text-volt-400">Filters applied</span>
            )}
          </div>

          {displayedProducts.length === 0 ? (
            <div className="rounded-[24px] border border-chalk/14 bg-court-500/50 p-12 text-center space-y-4">
              <div className="size-16 rounded-full bg-white/5 border border-chalk/10 flex items-center justify-center mx-auto text-chalk/40">
                <Search className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-chalk">No products match your criteria</h3>
              <p className="text-xs text-chalk/60 max-w-sm mx-auto">
                Try resetting brand filters, adjusting price range, or searching for broader terms like "racket" or "balls".
              </p>
              <Button variant="secondary" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  basePath={basePath}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
