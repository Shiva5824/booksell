"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookOpen, Cpu, Filter, PackageOpen,
  X, Stethoscope, FlaskConical, SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import PriceRangeFilter from "@/components/PriceRangeFilter";
import { getProducts, getFavorites, toggleFavorite } from "@/services/api";
import { useAuth } from "@/components/AuthProvider";
import type { Product } from "@/lib/types";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-soft dark:bg-white/10">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 rounded-full w-3/4" />
        <div className="skeleton h-4 rounded-full w-1/2" />
        <div className="flex gap-2 mt-1">
          <div className="skeleton h-6 rounded-full w-20" />
          <div className="skeleton h-6 rounded-full w-28" />
        </div>
        <div className="skeleton h-9 rounded-full w-full mt-2" />
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    if (!user) { setFavoritedIds(new Set()); return; }
    getFavorites().then((favs) => {
      setFavoritedIds(new Set(favs.map((f) => f._id)));
    });
  }, [user]);

  async function handleToggleFavorite(productId: string) {
    const nowFaved = !favoritedIds.has(productId);
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (nowFaved) next.add(productId); else next.delete(productId);
      return next;
    });
    try {
      await toggleFavorite(productId);
    } catch {
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (nowFaved) next.delete(productId); else next.add(productId);
        return next;
      });
    }
  }

  const activeFilters = useMemo(() => [
    category && { label: "Category", value: category, type: "category" },
    condition && { label: "Condition", value: condition, type: "condition" },
    minPrice !== null && { label: "Min", value: `₹${minPrice}`, type: "minPrice" },
    maxPrice !== null && { label: "Max", value: `₹${maxPrice}`, type: "maxPrice" },
    search && { label: "Search", value: search, type: "search" },
  ].filter(Boolean), [category, condition, minPrice, maxPrice, search]);

  function clearFilter(type: string) {
    if (type === "category") setCategory("");
    else if (type === "condition") setCondition("");
    else if (type === "minPrice") setMinPrice(null);
    else if (type === "maxPrice") setMaxPrice(null);
    else if (type === "search") setSearch("");
  }

  function clearAll() {
    setCategory(""); setCondition(""); setMinPrice(null); setMaxPrice(null); setSearch("");
  }

  const catIcon = (cat: string) => {
    switch (cat) {
      case "ipe": return <BookOpen size={15} />;
      case "eapcet": return <FlaskConical size={15} />;
      case "jee": return <Cpu size={15} />;
      case "neet": return <Stethoscope size={15} />;
      default: return null;
    }
  };

  const FilterPanel = () => (
    <div className="rounded-2xl border border-border/10 bg-white p-5 space-y-6 dark:bg-white/10">

      {/* Search */}
      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-ink-tertiary">Search</label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings..."
          className="input-base text-sm"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-ink-tertiary">Category</label>
        <div className="space-y-1.5">
          {["ipe", "eapcet", "jee", "neet"].map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="radio"
                name="category"
                value={cat}
                checked={category === cat}
                onChange={(e) => setCategory(e.target.value)}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm font-semibold text-ink capitalize flex items-center gap-2">
                {catIcon(cat)} {cat}
              </span>
            </label>
          ))}
          {category && (
            <button onClick={() => setCategory("")} className="text-xs font-bold text-orange-500 mt-1 hover:underline">
              Clear category
            </button>
          )}
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-ink-tertiary">Condition</label>
        <div className="space-y-1.5">
          {["new", "good", "used"].map((cond) => (
            <label key={cond} className="flex items-center gap-3 cursor-pointer py-1">
              <input
                type="radio"
                name="condition"
                value={cond}
                checked={condition === cond}
                onChange={(e) => setCondition(e.target.value)}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="text-sm font-semibold text-ink capitalize">{cond}</span>
            </label>
          ))}
          {condition && (
            <button onClick={() => setCondition("")} className="text-xs font-bold text-orange-500 mt-1 hover:underline">
              Clear condition
            </button>
          )}
        </div>
      </div>

      {/* Price Range */}
      <PriceRangeFilter
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinChange={setMinPrice}
        onMaxChange={setMaxPrice}
      />

      {/* Sort */}
      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-ink-tertiary">Sort By</label>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-base text-sm">
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {activeFilters.length > 0 && (
        <button onClick={clearAll} className="btn-secondary w-full justify-center text-sm text-red-500 hover:bg-red-50 hover:border-red-500/30">
          <X size={16} />
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <main className="bg-gradient-to-b from-surface-secondary via-surface-bg to-surface-secondary min-h-screen pb-nav">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* Header */}
        <div className="mb-7">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-ink transition-colors mb-4">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 className="text-3xl font-black text-ink sm:text-4xl">Browse Listings</h1>
          <p className="mt-1 text-sm text-ink-secondary sm:text-base">Filter and search through campus listings</p>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden btn-secondary mb-5 w-full justify-center text-sm"
        >
          <SlidersHorizontal size={17} />
          Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
        </button>

        {/* Active Filter Pills */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex flex-wrap gap-2"
            >
              {(activeFilters as any[]).map((filter) => (
                <motion.button
                  key={`${filter.type}-${filter.value}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => clearFilter(filter.type)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-100 transition-colors dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400"
                >
                  {filter.label}: {filter.value}
                  <X size={12} />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-[270px_1fr]">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          {/* Products */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-ink sm:text-lg">
                {loading ? "Loading..." : `${products.length} ${products.length === 1 ? "result" : "results"}`}
              </h2>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isFavorited={favoritedIds.has(product._id)}
                    onToggleFavorite={user ? handleToggleFavorite : undefined}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid min-h-[360px] place-items-center rounded-3xl border border-dashed border-border/20 bg-white p-8 text-center shadow-soft dark:bg-white/10"
              >
                <div className="space-y-5 max-w-sm mx-auto">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-500 dark:bg-orange-500/15">
                    <PackageOpen size={38} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-ink">No Listings Found</h3>
                    <p className="text-ink-secondary mt-2 text-sm">
                      Try adjusting your filters or search to find what you're looking for.
                    </p>
                  </div>
                  <button onClick={clearAll} className="btn-primary">Clear All Filters</button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Slide-in Sheet */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            {/* Sheet */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[min(320px,90vw)] bg-white shadow-2xl dark:bg-slate-950 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border/10 px-5 py-4">
                <h2 className="text-lg font-black text-ink flex items-center gap-2">
                  <Filter size={18} className="text-orange-500" />
                  Filters
                </h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/10 text-ink-secondary hover:bg-surface-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4">
                <FilterPanel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
