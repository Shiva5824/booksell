"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Cpu, IndianRupee, MapPin, RefreshCcw, Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { ProductFilters } from "@/lib/types";

interface SearchBarProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  resultCount?: number;
}

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
      className="rounded-3xl border border-white/10 glass p-5 shadow-soft-lg"
    >
      {/* Main Search Area */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/5 bg-surface-elevated px-5 py-4 transition-all duration-300 focus-within:border-primary focus-within:shadow-glow-primary focus-within:bg-surface-tertiary">
            <Search size={22} className="text-primary shrink-0" />
            <input
              value={filters.q || ""}
              onChange={(event) => patch({ q: event.target.value })}
              placeholder="Search books, lab gear, calculators..."
              className="w-full border-0 bg-transparent p-0 text-base font-semibold text-white placeholder:text-ink-tertiary focus:ring-0 outline-none"
            />
            {filters.q && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                onClick={() => patch({ q: "" })}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-ink-tertiary hover:text-white transition-colors"
              >
                <X size={18} />
              </motion.button>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-4 font-bold transition-all duration-300 ${
                showAdvanced || hasFilters ? "bg-primary text-white shadow-glow-primary border-primary" : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              <SlidersHorizontal size={20} />
              <span className="sm:hidden">Filters</span>
            </button>
            
            {hasFilters && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                type="button"
                onClick={() => onChange({ sort: "newest" })}
                className="flex items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-red-400 hover:bg-red-500/20 transition-colors"
                aria-label="Clear all filters"
              >
                <RefreshCcw size={20} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { label: "All Items", value: "", icon: SlidersHorizontal },
            { label: "Books", value: "book", icon: BookOpen },
            { label: "Equipment", value: "equipment", icon: Cpu }
          ].map(({ label, value, icon: Icon }) => {
            const active = (filters.category || "") === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => patch({ category: value as ProductFilters["category"] })}
                className={`relative flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  active
                    ? "border-primary text-white shadow-glow-primary"
                    : "border-white/5 bg-white/5 text-ink-secondary hover:bg-white/10 hover:text-white"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="category-active"
                    className="absolute inset-0 rounded-xl bg-gradient-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
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
            <div className="mt-4 pt-4 border-t border-white/10 grid gap-4 lg:grid-cols-[1fr_auto]">
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* College Filter */}
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-elevated px-4 py-3 transition-colors focus-within:border-primary focus-within:bg-surface-tertiary">
                  <MapPin size={18} className="text-primary shrink-0" />
                  <input
                    value={filters.college || ""}
                    onChange={(event) => patch({ college: event.target.value })}
                    placeholder="College / Location"
                    className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-white placeholder:text-ink-tertiary focus:ring-0 outline-none"
                  />
                </label>

                {/* Min Price */}
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-elevated px-4 py-3 transition-colors focus-within:border-primary focus-within:bg-surface-tertiary">
                  <IndianRupee size={18} className="text-primary shrink-0" />
                  <input
                    value={filters.min || ""}
                    onChange={(event) => patch({ min: event.target.value })}
                    type="number"
                    min="0"
                    placeholder="Min Price"
                    className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-white placeholder:text-ink-tertiary focus:ring-0 outline-none"
                  />
                </label>

                {/* Max Price & Slider */}
                <div className="flex flex-col justify-center gap-2 rounded-xl border border-white/10 bg-surface-elevated px-4 py-2 transition-colors focus-within:border-primary focus-within:bg-surface-tertiary relative">
                  <div className="flex items-center gap-3">
                    <IndianRupee size={18} className="text-primary shrink-0" />
                    <input
                      value={filters.max || ""}
                      onChange={(event) => patch({ max: event.target.value })}
                      type="number"
                      min="0"
                      placeholder="Max Price"
                      className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-white placeholder:text-ink-tertiary focus:ring-0 outline-none"
                    />
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="10000" 
                    step="100"
                    value={filters.max || "10000"} 
                    onChange={(event) => patch({ max: event.target.value })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Sort Options (Pills) */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:pb-0 items-center">
                {[
                  { label: "Latest", value: "newest" },
                  { label: "Lowest Price", value: "price_asc" },
                  { label: "Highest Price", value: "price_desc" }
                ].map(({ label, value }) => {
                  const active = (filters.sort || "newest") === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => patch({ sort: value as ProductFilters["sort"] })}
                      className={`relative px-4 py-2 text-sm font-bold rounded-xl border transition-all duration-300 whitespace-nowrap ${
                        active 
                          ? "border-primary text-white shadow-glow-primary" 
                          : "border-white/5 bg-surface-elevated text-ink-secondary hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="sort-active"
                          className="absolute inset-0 rounded-xl bg-gradient-primary"
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

      {/* Results Info */}
      {resultCount !== undefined && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-between text-xs font-bold text-ink-secondary"
        >
          <span>Showing <span className="text-white px-1.5 py-0.5 rounded bg-white/10">{resultCount}</span> items</span>
        </motion.div>
      )}
    </motion.section>
  );
}
