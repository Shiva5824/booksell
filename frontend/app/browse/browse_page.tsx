"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Cpu,
  Filter,
  PackageOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import PriceRangeFilter from "@/components/PriceRangeFilter";
import { getProducts } from "@/services/api";
import type { Product } from "@/lib/types";

export default function BrowsePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [category, setCategory] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [sort, setSort] = useState<string>("newest");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [search, setSearch] = useState<string>("");

  // Fetch products when filters change
  useEffect(() => {
    setLoading(true);
    const filters: any = { sort };

    if (category) filters.category = category;
    if (condition) filters.condition = condition;
    if (minPrice !== null) filters.minPrice = minPrice;
    if (maxPrice !== null) filters.maxPrice = maxPrice;
    if (search) filters.search = search;

    getProducts(filters).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, [category, condition, sort, minPrice, maxPrice, search]);

  const activeFilters = useMemo(() => {
    return [
      category && { label: "Category", value: category, type: "category" },
      condition && { label: "Condition", value: condition, type: "condition" },
      minPrice !== null && { label: "Min Price", value: `₹${minPrice}`, type: "minPrice" },
      maxPrice !== null && { label: "Max Price", value: `₹${maxPrice}`, type: "maxPrice" },
      search && { label: "Search", value: search, type: "search" },
    ].filter(Boolean);
  }, [category, condition, minPrice, maxPrice, search]);

  const clearFilter = (type: string) => {
    switch (type) {
      case "category":
        setCategory("");
        break;
      case "condition":
        setCondition("");
        break;
      case "minPrice":
        setMinPrice(null);
        break;
      case "maxPrice":
        setMaxPrice(null);
        break;
      case "search":
        setSearch("");
        break;
    }
  };

  const clearAllFilters = () => {
    setCategory("");
    setCondition("");
    setMinPrice(null);
    setMaxPrice(null);
    setSearch("");
  };

  return (
    <main className="bg-gradient-to-b from-surface-secondary via-surface-bg to-surface-secondary min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-ink-secondary hover:text-ink transition-colors mb-4">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <h1 className="text-4xl font-black text-ink mb-2">Browse Listings</h1>
          <p className="text-ink-secondary">Filter and search through thousands of campus listings</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar */}
          <aside
            className={`${
              mobileFiltersOpen ? "block" : "hidden"
            } lg:block fixed inset-0 z-40 lg:static lg:inset-auto bg-black/50 lg:bg-transparent p-4 lg:p-0 overflow-y-auto`}
          >
            <div className="rounded-2xl border border-border bg-surface-bg p-6 space-y-6 lg:sticky lg:top-6">
              {/* Close button for mobile */}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="lg:hidden absolute top-4 right-4 text-ink-secondary hover:text-ink"
              >
                <X size={24} />
              </button>

              {/* Search */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-ink-secondary uppercase tracking-wide">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search listings..."
                  className="input-base"
                />
              </div>

              {/* Category Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-ink-secondary uppercase tracking-wide">Category</label>
                <div className="space-y-2">
                  {["book", "equipment"].map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={category === cat}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-semibold text-ink capitalize flex items-center gap-2">
                        {cat === "book" ? <BookOpen size={16} /> : <Cpu size={16} />}
                        {cat}
                      </span>
                    </label>
                  ))}
                  {category && (
                    <button
                      onClick={() => setCategory("")}
                      className="text-xs text-primary font-bold mt-2"
                    >
                      Clear category
                    </button>
                  )}
                </div>
              </div>

              {/* Condition Filter */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-ink-secondary uppercase tracking-wide">Condition</label>
                <div className="space-y-2">
                  {["new", "like-new", "good", "fair"].map((cond) => (
                    <label key={cond} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        value={cond}
                        checked={condition === cond}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-semibold text-ink capitalize">{cond}</span>
                    </label>
                  ))}
                  {condition && (
                    <button
                      onClick={() => setCondition("")}
                      className="text-xs text-primary font-bold mt-2"
                    >
                      Clear condition
                    </button>
                  )}
                </div>
              </div>

              {/* Price Range Filter */}
              <PriceRangeFilter
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinChange={setMinPrice}
                onMaxChange={setMaxPrice}
              />

              {/* Sort */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-ink-secondary uppercase tracking-wide">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="input-base"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              {/* Clear All Button */}
              {activeFilters.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="btn-secondary w-full justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                >
                  <X size={18} />
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div>
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="lg:hidden btn-secondary mb-6 w-full justify-center"
            >
              <Filter size={18} />
              {mobileFiltersOpen ? "Hide" : "Show"} Filters
            </button>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex flex-wrap gap-2"
              >
                {activeFilters.map((filter: any) => (
                  <motion.button
                    key={`${filter.type}-${filter.value}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => clearFilter(filter.type)}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/20 transition-smooth"
                  >
                    {filter.label}: {filter.value}
                    <X size={14} />
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Results */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-ink">
                {loading ? "Loading..." : `${products.length} ${products.length === 1 ? "result" : "results"}`}
              </h2>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl bg-surface-secondary h-72 animate-pulse" />
                ))}
              </div>
            ) : products.length ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2"
              >
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid min-h-[400px] place-items-center rounded-3xl border border-dashed border-white/10 glass p-8 text-center"
              >
                <div className="space-y-5 max-w-md mx-auto">
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="rounded-full bg-accent/10 p-5 shadow-glow-primary border border-accent/20"
                    >
                      <PackageOpen size={48} className="text-accent" />
                    </motion.div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">No Listings Found</h3>
                    <p className="text-ink-secondary mt-3 text-base">
                      Try adjusting your filters or search to find what you're looking for.
                    </p>
                  </div>
                  <button
                    onClick={clearAllFilters}
                    className="btn-primary mt-6"
                  >
                    Clear All Filters
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
