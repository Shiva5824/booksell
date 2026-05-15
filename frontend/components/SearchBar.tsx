"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Cpu, IndianRupee, MapPin, RefreshCcw, Search, SlidersHorizontal, X, Stethoscope, FlaskConical } from "lucide-react";
import type { ProductFilters } from "@/lib/types";

interface SearchBarProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  resultCount?: number;
}

const CATEGORIES = [
  { label: "All Items", value: "", icon: SlidersHorizontal },
  { label: "IPE", value: "ipe", icon: BookOpen },
  { label: "EAPCET", value: "eapcet", icon: FlaskConical },
  { label: "JEE", value: "jee", icon: Cpu },
  { label: "NEET", value: "neet", icon: Stethoscope },
];

export default function SearchBar({ filters, onChange, resultCount }: SearchBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasFilters = Boolean(filters.q || filters.college || filters.category || filters.min || filters.max);

  function patch(next: ProductFilters) {
    onChange({ ...filters, ...next });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-border/10 bg-white p-4 shadow-soft-lg dark:bg-white/10 sm:p-5"
    >
      <div className="flex flex-col gap-4">
        {/* Search Input row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-full border border-transparent bg-[#f5f2ee] px-4 py-3.5 transition-all duration-300 focus-within:border-orange-200 focus-within:bg-orange-50 dark:bg-white/10 dark:focus-within:bg-orange-500/10">
            <Search size={20} className="text-orange-500 shrink-0" />
            <input
              value={filters.q || ""}
              onChange={(e) => patch({ q: e.target.value })}
              placeholder="Search books..."
              className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-ink placeholder:text-ink-tertiary focus:ring-0 outline-none sm:text-base"
            />
            {filters.q && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={() => patch({ q: "" })}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-ink-tertiary shadow-soft transition-colors hover:text-orange-500 dark:bg-white/10"
              >
                <X size={16} />
              </motion.button>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full border px-5 py-3.5 font-black text-sm transition-all duration-300 ${
                showAdvanced || hasFilters
                  ? "border-orange-500 bg-orange-500 text-white shadow-glow-primary"
                  : "border-border/10 bg-white text-ink hover:bg-orange-50 dark:bg-white/10"
              }`}
            >
              <SlidersHorizontal size={18} />
              <span>Filters{hasFilters ? " •" : ""}</span>
            </button>

            {hasFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={() => onChange({ sort: "newest" })}
                className="flex items-center justify-center rounded-full border border-red-500/20 bg-red-50 px-4 text-red-500 transition-colors hover:bg-red-100 dark:bg-red-500/10"
                aria-label="Clear all filters"
              >
                <RefreshCcw size={18} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Category Pills — horizontally scrollable with fade */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-fade-right">
            {CATEGORIES.map(({ label, value, icon: Icon }) => {
              const active = (filters.category || "") === value;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => patch({ category: value as ProductFilters["category"] })}
                  className={`relative flex min-w-max items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-black whitespace-nowrap transition-all duration-300 ${
                    active
                      ? "border-orange-500 text-white shadow-glow-primary"
                      : "border-border/10 bg-[#f8f6f3] text-ink-secondary hover:bg-orange-50 hover:text-orange-500 dark:bg-white/10"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="category-active"
                      className="absolute inset-0 rounded-full bg-orange-500"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  <Icon size={16} className="relative z-10" />
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-border/10 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* College Filter */}
                <label className="flex items-center gap-3 rounded-full border border-border/10 bg-[#f8f6f3] px-4 py-3 transition-colors focus-within:border-orange-200 focus-within:bg-orange-50 dark:bg-white/10">
                  <MapPin size={17} className="text-orange-500 shrink-0" />
                  <input
                    value={filters.college || ""}
                    onChange={(e) => patch({ college: e.target.value })}
                    placeholder="College / Location"
                    className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-ink placeholder:text-ink-tertiary focus:ring-0 outline-none"
                  />
                </label>

                {/* Min Price */}
                <label className="flex items-center gap-3 rounded-full border border-border/10 bg-[#f8f6f3] px-4 py-3 transition-colors focus-within:border-orange-200 focus-within:bg-orange-50 dark:bg-white/10">
                  <IndianRupee size={17} className="text-orange-500 shrink-0" />
                  <input
                    value={filters.min || ""}
                    onChange={(e) => patch({ min: e.target.value })}
                    type="number"
                    min="0"
                    placeholder="Min Price"
                    className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-ink placeholder:text-ink-tertiary focus:ring-0 outline-none"
                  />
                </label>

                {/* Max Price + Slider */}
                <div className="flex flex-col justify-center gap-2 rounded-[22px] border border-border/10 bg-[#f8f6f3] px-4 py-2 transition-colors focus-within:border-orange-200 focus-within:bg-orange-50 dark:bg-white/10">
                  <div className="flex items-center gap-3">
                    <IndianRupee size={17} className="text-orange-500 shrink-0" />
                    <input
                      value={filters.max || ""}
                      onChange={(e) => patch({ max: e.target.value })}
                      type="number"
                      min="0"
                      placeholder="Max Price"
                      className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-ink placeholder:text-ink-tertiary focus:ring-0 outline-none"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.max || "10000"}
                    onChange={(e) => patch({ max: e.target.value })}
                    className="w-full h-1 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              </div>

              {/* Sort Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:pb-0 items-center">
                {[
                  { label: "Latest", value: "newest" },
                  { label: "Lowest Price", value: "price_asc" },
                  { label: "Highest Price", value: "price_desc" },
                ].map(({ label, value }) => {
                  const active = (filters.sort || "newest") === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => patch({ sort: value as ProductFilters["sort"] })}
                      className={`relative min-w-max px-4 py-2 text-sm font-black rounded-full border transition-all duration-300 ${
                        active
                          ? "border-orange-500 text-white shadow-glow-primary"
                          : "border-border/10 bg-[#f8f6f3] text-ink-secondary hover:bg-orange-50 hover:text-orange-500 dark:bg-white/10"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="sort-active"
                          className="absolute inset-0 rounded-full bg-orange-500"
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      {resultCount !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-between text-xs font-bold text-ink-secondary"
        >
          <span>
            Showing{" "}
            <span className="text-orange-500 px-1.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-500/10">
              {resultCount}
            </span>{" "}
            items
          </span>
        </motion.div>
      )}
    </motion.section>
  );
}
