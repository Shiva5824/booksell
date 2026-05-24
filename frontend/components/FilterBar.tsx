"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Cpu,
  FlaskConical,
  IndianRupee,
  MapPin,
  Navigation,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Tag,
  X,
} from "lucide-react";
import type { ProductCategory, ProductCondition, ProductFilters } from "@/lib/types";
import {
  useUserLocation,
  type LocationSource,
  type UserLocation,
} from "@/lib/useUserLocation";

interface FilterBarProps {
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  resultCount?: number;
}

const CATEGORIES: Array<{
  label: string;
  value: ProductCategory | "";
  icon: typeof BookOpen;
  color: string;
}> = [
  { label: "All", value: "", icon: SlidersHorizontal, color: "from-slate-500 to-slate-700" },
  { label: "JEE", value: "jee", icon: Cpu, color: "from-indigo-500 to-blue-600" },
  { label: "NEET", value: "neet", icon: Stethoscope, color: "from-rose-500 to-red-600" },
  { label: "EAPCET", value: "eapcet", icon: FlaskConical, color: "from-emerald-500 to-green-600" },
  { label: "IPE", value: "ipe", icon: BookOpen, color: "from-orange-500 to-amber-600" },
];

const CONDITIONS: Array<{ label: string; value: ProductCondition | "" }> = [
  { label: "Any condition", value: "" },
  { label: "Brand new", value: "new" },
  { label: "Good", value: "good" },
  { label: "Used", value: "used" },
];

const SORT_OPTIONS: Array<{ label: string; value: NonNullable<ProductFilters["sort"]>; hint: string }> = [
  { label: "Newest first", value: "newest", hint: "Latest listings on top" },
  { label: "Nearest first", value: "nearest", hint: "Closest to your location" },
  { label: "Price: low → high", value: "price_asc", hint: "Cheapest first" },
  { label: "Price: high → low", value: "price_desc", hint: "Most expensive first" },
];

const PRICE_MAX = 10000;

/** Returns an ordered list of "active" filters for chip rendering + count. */
function describeActiveFilters(f: ProductFilters): Array<{ key: keyof ProductFilters; label: string }> {
  const out: Array<{ key: keyof ProductFilters; label: string }> = [];
  if (f.q) out.push({ key: "q", label: `"${f.q}"` });
  if (f.category) out.push({ key: "category", label: f.category.toUpperCase() });
  if (f.condition) out.push({ key: "condition", label: `Cond: ${f.condition}` });
  if (f.status === "active") out.push({ key: "status", label: "Available" });
  if (f.status === "sold") out.push({ key: "status", label: "Sold" });
  if (f.min) out.push({ key: "min", label: `≥ ₹${f.min}` });
  if (f.max && Number(f.max) < PRICE_MAX) out.push({ key: "max", label: `≤ ₹${f.max}` });
  return out;
}

const PRICE_PRESETS: Array<{ label: string; min: number; max: number }> = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹1k", min: 500, max: 1000 },
  { label: "₹1k – ₹2.5k", min: 1000, max: 2500 },
  { label: "₹2.5k – ₹5k", min: 2500, max: 5000 },
  { label: "₹5k+", min: 5000, max: PRICE_MAX },
];

export default function FilterBar({ filters, onChange, resultCount }: FilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const { location, source, isLocating, error: locError, detectGPS, useSaved, clear } = useUserLocation();

  // When sort=nearest, propagate user lat/lng into filters so the listing
  // page can compute distances and sort.
  useEffect(() => {
    if (filters.sort !== "nearest") return;
    if (!location) {
      // Trying to sort by nearest but no location yet — leave coords absent.
      if (filters.userLat != null || filters.userLng != null) {
        const next = { ...filters };
        delete next.userLat;
        delete next.userLng;
        onChange(next);
      }
      return;
    }
    if (
      filters.userLat !== location.latitude ||
      filters.userLng !== location.longitude
    ) {
      onChange({ ...filters, userLat: location.latitude, userLng: location.longitude });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sort, location?.latitude, location?.longitude]);

  function patch(part: Partial<ProductFilters>) {
    onChange({ ...filters, ...part });
  }

  /** Try saved location first; if none, prompt for GPS. */
  async function enableNearest() {
    if (location) {
      patch({ sort: "nearest", userLat: location.latitude, userLng: location.longitude });
      return;
    }
    const fresh = await detectGPS();
    if (fresh) {
      patch({ sort: "nearest", userLat: fresh.latitude, userLng: fresh.longitude });
    }
  }

  function clearAll() {
    onChange({ sort: "newest" });
  }

  function removeFilter(key: keyof ProductFilters) {
    const next = { ...filters };
    if (key === "max") next.max = "";
    else if (key === "min") next.min = "";
    else (next as any)[key] = "";
    onChange(next);
  }

  const activeFilters = useMemo(() => describeActiveFilters(filters), [filters]);
  const activeCount = activeFilters.length;
  const sortLabel =
    SORT_OPTIONS.find((s) => s.value === (filters.sort || "newest"))?.label ||
    "Newest first";

  return (
    <motion.section
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-border/10 bg-white p-3 shadow-soft-lg dark:bg-white/10 sm:p-4"
    >
      {/* ─── Search + sort + filter button ─── */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-transparent bg-[#f5f2ee] px-3.5 py-2.5 transition-all duration-200 focus-within:border-orange-300 focus-within:bg-orange-50 dark:bg-white/10 dark:focus-within:bg-orange-500/10 sm:px-4 sm:py-3">
          <Search size={18} className="text-orange-500 shrink-0" />
          <input
            value={filters.q || ""}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Search books, calculators, lab gear…"
            className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-ink placeholder:text-ink-tertiary focus:ring-0 outline-none sm:text-base"
          />
          {filters.q && (
            <button
              type="button"
              onClick={() => patch({ q: "" })}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-ink-tertiary shadow-sm hover:text-orange-500 dark:bg-white/10"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort dropdown trigger */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setSortMenuOpen((v) => !v)}
            className="flex h-[46px] items-center gap-1.5 rounded-2xl border border-border/10 bg-[#f5f2ee] px-3 text-sm font-black text-ink hover:bg-orange-50 dark:bg-white/10 sm:px-3.5"
            aria-haspopup="listbox"
            aria-expanded={sortMenuOpen}
            aria-label={`Sort: ${sortLabel}`}
            title={`Sort: ${sortLabel}`}
          >
            <Sparkles size={15} className="text-orange-500" />
            <span className="hidden max-w-[140px] truncate sm:inline">{sortLabel}</span>
          </button>
          <AnimatePresence>
            {sortMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSortMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-12 z-40 w-[min(18rem,90vw)] rounded-2xl border border-border/10 bg-white p-1.5 shadow-xl dark:bg-slate-900"
                  role="listbox"
                >
                  {SORT_OPTIONS.map((opt) => {
                    const active = (filters.sort || "newest") === opt.value;
                    const isNearest = opt.value === "nearest";
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={async () => {
                          if (isNearest) {
                            await enableNearest();
                          } else {
                            patch({ sort: opt.value });
                          }
                          setSortMenuOpen(false);
                        }}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          active ? "bg-orange-50 dark:bg-orange-500/15" : "hover:bg-surface-secondary dark:hover:bg-white/5"
                        }`}
                        role="option"
                        aria-selected={active}
                      >
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                            active ? "bg-orange-500 text-white" : "bg-surface-secondary text-ink-secondary dark:bg-white/10"
                          }`}
                        >
                          {isNearest ? <Navigation size={13} /> : <Sparkles size={13} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-black ${active ? "text-orange-600" : "text-ink"}`}>{opt.label}</p>
                          <p className="text-[11px] font-medium text-ink-secondary truncate">{opt.hint}</p>
                        </div>
                        {active && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" />}
                      </button>
                    );
                  })}
                  {locError && (
                    <p className="px-3 pb-2 pt-1 text-[11px] font-medium text-red-500">
                      {locError}
                    </p>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Filter inline panel trigger */}
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className={`relative flex h-[46px] shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 text-sm font-black transition-all duration-200 ${
            panelOpen
              ? "border-orange-500 bg-orange-500 text-white shadow-glow-primary"
              : activeCount > 0
                ? "border-orange-500 bg-orange-500 text-white shadow-glow-primary"
                : "border-border/10 bg-[#f5f2ee] text-ink hover:bg-orange-50 dark:bg-white/10"
          }`}
          aria-expanded={panelOpen}
          aria-controls="filter-panel"
          aria-label={`${panelOpen ? "Hide" : "Show"} filters${activeCount ? ` (${activeCount} active)` : ""}`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-orange-500">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── Category quick row ─── */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide scroll-fade-right">
        {CATEGORIES.map(({ label, value, icon: Icon, color }) => {
          const active = (filters.category || "") === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => patch({ category: value })}
              className={`relative flex min-w-max items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-all duration-200 sm:px-3.5 sm:py-2 sm:text-xs ${
                active
                  ? "border-transparent text-white shadow-soft"
                  : "border-border/10 bg-[#f8f6f3] text-ink-secondary hover:bg-orange-50 hover:text-orange-500 dark:bg-white/10"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="filterbar-cat-active"
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${color}`}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                />
              )}
              <Icon size={13} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Nearest-first chip + active filter chips ─── */}
      {(filters.sort === "nearest" || activeCount > 0 || resultCount !== undefined) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {filters.sort === "nearest" && (
            <NearestChip
              source={source}
              location={location}
              isLocating={isLocating}
              onRefresh={async () => {
                const fresh = await detectGPS();
                if (fresh) patch({ userLat: fresh.latitude, userLng: fresh.longitude });
              }}
              onUseSaved={() => {
                useSaved();
              }}
              onCancel={() => {
                patch({ sort: "newest", userLat: undefined, userLng: undefined });
                clear();
              }}
            />
          )}

          {activeFilters.map((af) => (
            <button
              key={af.key + af.label}
              type="button"
              onClick={() => removeFilter(af.key)}
              className="group flex items-center gap-1.5 rounded-full border border-border/15 bg-surface-secondary px-3 py-1 text-[11px] font-black text-ink-secondary transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:bg-white/5 dark:hover:bg-red-500/10"
            >
              <Tag size={10} />
              <span>{af.label}</span>
              <X size={11} className="opacity-60 group-hover:opacity-100" />
            </button>
          ))}

          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
            >
              <RefreshCcw size={10} />
              Clear all
            </button>
          )}

          {resultCount !== undefined && (
            <span
              className={`text-[11px] font-bold text-ink-secondary ${
                activeCount === 0 ? "ml-auto" : ""
              }`}
            >
              <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-orange-500 dark:bg-orange-500/10">
                {resultCount}
              </span>{" "}
              {resultCount === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      )}

      {/* ─── Inline collapsible filter panel ─── */}
      <AnimatePresence initial={false}>
        {panelOpen && (
          <motion.div
            id="filter-panel"
            key="filter-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <FilterPanel
              filters={filters}
              onPatch={patch}
              onClearAll={clearAll}
              onClose={() => setPanelOpen(false)}
              onEnableNearest={enableNearest}
              location={location}
              source={source}
              isLocating={isLocating}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Nearest-first chip — shows source (saved vs GPS), distance pivot, and
   provides quick refresh / switch-to-saved / cancel actions.
   ──────────────────────────────────────────────────────────────────── */

function NearestChip({
  source,
  location,
  isLocating,
  onRefresh,
  onUseSaved,
  onCancel,
}: {
  source: LocationSource;
  location: UserLocation | null;
  isLocating: boolean;
  onRefresh: () => void;
  onUseSaved: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300">
      <Navigation size={11} className={isLocating ? "animate-pulse" : ""} />
      <span className="max-w-[160px] truncate">
        {isLocating ? "Locating…" : location ? `Near: ${location.label}` : "Awaiting location"}
      </span>
      <span className="mx-0.5 h-3 w-px bg-orange-300/60" />
      <button
        type="button"
        onClick={onRefresh}
        title="Refresh GPS"
        className="rounded-full p-1 hover:bg-orange-100 dark:hover:bg-orange-500/20"
      >
        <RefreshCcw size={10} />
      </button>
      {source !== "saved" && (
        <button
          type="button"
          onClick={onUseSaved}
          title="Use saved address"
          className="rounded-full p-1 hover:bg-orange-100 dark:hover:bg-orange-500/20"
        >
          <MapPin size={10} />
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full p-1 hover:bg-orange-100 dark:hover:bg-orange-500/20"
        aria-label="Turn off nearest-first sort"
      >
        <X size={11} />
      </button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   FilterPanel — inline, collapsible filter panel rendered directly
   under the search header. Page stays fully interactive: no backdrop,
   no scroll lock, no fixed positioning. Two columns on desktop, single
   column on mobile.
   ──────────────────────────────────────────────────────────────────── */

function FilterPanel({
  filters,
  onPatch,
  onClose,
  onClearAll,
  onEnableNearest,
  location,
  source,
  isLocating,
}: {
  filters: ProductFilters;
  onPatch: (part: Partial<ProductFilters>) => void;
  onClose: () => void;
  onClearAll: () => void;
  onEnableNearest: () => Promise<void>;
  location: UserLocation | null;
  source: LocationSource;
  isLocating: boolean;
}) {
  // Local draft so dragging the slider doesn't refetch on every tick.
  const initialMin = filters.min ? Number(filters.min) : 0;
  const initialMax = filters.max ? Math.min(Number(filters.max), PRICE_MAX) : PRICE_MAX;
  const [minPrice, setMinPrice] = useState<number>(initialMin);
  const [maxPrice, setMaxPrice] = useState<number>(initialMax);

  useEffect(() => {
    setMinPrice(filters.min ? Number(filters.min) : 0);
    setMaxPrice(filters.max ? Math.min(Number(filters.max), PRICE_MAX) : PRICE_MAX);
  }, [filters.min, filters.max]);

  function commitPrice() {
    const lo = Math.max(0, Math.min(minPrice, maxPrice));
    const hi = Math.max(lo, maxPrice);
    onPatch({
      min: lo > 0 ? String(lo) : "",
      max: hi < PRICE_MAX ? String(hi) : "",
    });
  }

  const nearestOn = filters.sort === "nearest";

  return (
    <div className="mt-4 rounded-2xl border border-border/10 bg-surface-secondary/60 p-4 dark:bg-white/5 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Price range — full width row at top so the slider has space */}
        <section className="lg:col-span-2 rounded-2xl border border-border/10 bg-white p-4 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <SectionHeader icon={IndianRupee} label="Price range" noMargin />
            <span className="text-xs font-black text-orange-500">
              ₹{minPrice.toLocaleString("en-IN")}
              {" – "}
              {maxPrice >= PRICE_MAX ? `₹${PRICE_MAX.toLocaleString("en-IN")}+` : `₹${maxPrice.toLocaleString("en-IN")}`}
            </span>
          </div>

          {/* Quick presets */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((p) => {
              const active = minPrice === p.min && maxPrice === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setMinPrice(p.min);
                    setMaxPrice(p.max);
                    onPatch({
                      min: p.min > 0 ? String(p.min) : "",
                      max: p.max < PRICE_MAX ? String(p.max) : "",
                    });
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-black transition-all ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-border/15 bg-surface-secondary text-ink-secondary hover:bg-orange-50 hover:text-orange-500 dark:bg-white/5"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Slider */}
          <DualRangeSlider
            min={0}
            max={PRICE_MAX}
            step={50}
            valueMin={minPrice}
            valueMax={maxPrice}
            onChange={(lo, hi) => {
              setMinPrice(lo);
              setMaxPrice(hi);
            }}
            onCommit={commitPrice}
          />

          {/* Numeric inputs */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <PriceInput label="Min" value={minPrice} onChange={setMinPrice} onBlur={commitPrice} />
            <PriceInput label="Max" value={maxPrice} onChange={setMaxPrice} onBlur={commitPrice} />
          </div>
        </section>

        {/* Sort by location toggle */}
        <section>
          <SectionHeader icon={Navigation} label="Sort by location" />
          <button
            type="button"
            onClick={async () => {
              if (nearestOn) {
                onPatch({ sort: "newest", userLat: undefined, userLng: undefined });
              } else {
                await onEnableNearest();
              }
            }}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all ${
              nearestOn
                ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                : "border-border/15 bg-white hover:bg-orange-50 dark:bg-white/5"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-black text-ink">Nearest listings first</p>
              <p className="mt-0.5 text-[11px] font-medium text-ink-secondary truncate">
                {nearestOn
                  ? location
                    ? `Sorted around ${location.label}${source === "gps" ? " · live GPS" : ""}`
                    : isLocating
                      ? "Reading your location…"
                      : "Tap again to enable"
                  : "Use saved address or live GPS"}
              </p>
            </div>
            <span
              className={`flex h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${
                nearestOn ? "bg-orange-500" : "bg-border/30"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  nearestOn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        </section>

        {/* Condition */}
        <section>
          <SectionHeader icon={Sparkles} label="Condition" />
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((c) => {
              const active = (filters.condition || "") === c.value;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => onPatch({ condition: c.value })}
                  className={`rounded-full border px-3 py-1.5 text-xs font-black transition-all ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-border/15 bg-white text-ink-secondary hover:bg-orange-50 hover:text-orange-500 dark:bg-white/5"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Availability — full row so it doesn't crunch on desktop */}
        <section className="lg:col-span-2">
          <SectionHeader icon={Tag} label="Availability" />
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { label: "All", value: "" as const },
                { label: "Available", value: "active" as const },
                { label: "Sold", value: "sold" as const },
              ]
            ).map((o) => {
              const active = (filters.status || "") === o.value;
              return (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => onPatch({ status: o.value })}
                  className={`rounded-xl border px-2 py-2 text-xs font-black transition-all ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-border/15 bg-white text-ink-secondary hover:bg-orange-50 hover:text-orange-500 dark:bg-white/5"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Panel footer — quick actions */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/10 pt-3">
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-xl px-3 py-2 text-xs font-black text-ink-secondary hover:text-ink"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-white hover:bg-orange-600"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Small sub-components
   ──────────────────────────────────────────────────────────────────── */

function SectionHeader({ icon: Icon, label, noMargin = false }: { icon: typeof BookOpen; label: string; noMargin?: boolean }) {
  return (
    <div className={`${noMargin ? "" : "mb-2.5"} flex items-center gap-2`}>
      <Icon size={13} className="text-orange-500" />
      <h3 className="text-[11px] font-black uppercase tracking-wider text-ink-tertiary">{label}</h3>
    </div>
  );
}

function PriceInput({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onBlur: () => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-wider text-ink-tertiary">{label}</span>
      <div className="flex items-center gap-1.5 rounded-xl border border-border/10 bg-surface-secondary px-3 py-2 focus-within:border-orange-300 dark:bg-white/5">
        <IndianRupee size={13} className="text-orange-500" />
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          onBlur={onBlur}
          className="w-full border-0 bg-transparent p-0 text-sm font-bold text-ink focus:ring-0 outline-none"
        />
      </div>
    </label>
  );
}

/**
 * Custom dual-handle range slider.
 *
 * Built from the ground up rather than stacking native <input type="range">
 * because the latter can't show value tooltips, ticks, or a smooth gradient
 * fill. Drives entirely off pointer events so it works on mouse + touch +
 * keyboard.
 */
function DualRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  onCommit,
}: {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (lo: number, hi: number) => void;
  onCommit: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"min" | "max" | null>(null);
  const [activeHandle, setActiveHandle] = useState<"min" | "max" | null>(null);

  const span = max - min || 1;
  const minPct = ((Math.max(min, Math.min(valueMin, valueMax)) - min) / span) * 100;
  const maxPct = ((Math.min(max, Math.max(valueMax, valueMin)) - min) / span) * 100;

  const fmt = (v: number) =>
    v >= max
      ? `₹${max.toLocaleString("en-IN")}+`
      : v >= 1000
        ? `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
        : `₹${v}`;

  const valueFromClientX = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return 0;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + ratio * span;
      const snapped = Math.round(raw / step) * step;
      return Math.max(min, Math.min(max, snapped));
    },
    [min, max, span, step],
  );

  // Pointer-driven dragging.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragRef.current) return;
      const v = valueFromClientX(e.clientX);
      if (dragRef.current === "min") {
        onChange(Math.min(v, valueMax), valueMax);
      } else {
        onChange(valueMin, Math.max(v, valueMin));
      }
    }
    function onUp() {
      if (!dragRef.current) return;
      dragRef.current = null;
      setActiveHandle(null);
      onCommit();
    }
    if (activeHandle) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    }
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [activeHandle, valueFromClientX, onChange, onCommit, valueMin, valueMax]);

  // Tap-on-track jumps the nearest handle to that spot.
  function handleTrackPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const v = valueFromClientX(e.clientX);
    const distToMin = Math.abs(v - valueMin);
    const distToMax = Math.abs(v - valueMax);
    const nearest: "min" | "max" = distToMin <= distToMax ? "min" : "max";
    if (nearest === "min") onChange(Math.min(v, valueMax), valueMax);
    else onChange(valueMin, Math.max(v, valueMin));
    dragRef.current = nearest;
    setActiveHandle(nearest);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function handleHandlePointerDown(handle: "min" | "max") {
    return (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      dragRef.current = handle;
      setActiveHandle(handle);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
  }

  function handleKey(handle: "min" | "max") {
    return (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const big = e.shiftKey ? step * 10 : step;
      let next = handle === "min" ? valueMin : valueMax;
      let changed = false;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        next -= big;
        changed = true;
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        next += big;
        changed = true;
      } else if (e.key === "Home") {
        next = min;
        changed = true;
      } else if (e.key === "End") {
        next = max;
        changed = true;
      }
      if (!changed) return;
      e.preventDefault();
      next = Math.max(min, Math.min(max, next));
      if (handle === "min") onChange(Math.min(next, valueMax), valueMax);
      else onChange(valueMin, Math.max(next, valueMin));
    };
  }

  // 11 evenly spaced ticks (0, 10, 20 ... 100 percent of range).
  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="relative px-2 pb-1 pt-7 select-none">
      {/* Track + tick layer */}
      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        className="relative h-7 cursor-pointer touch-none"
      >
        {/* Base track */}
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-orange-100 dark:bg-orange-500/15" />

        {/* Ticks */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
          {ticks.map((t) => {
            const inRange = t >= minPct && t <= maxPct;
            return (
              <span
                key={t}
                className={`absolute h-1 w-px -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${
                  inRange ? "bg-white" : "bg-orange-300/60 dark:bg-orange-500/30"
                }`}
                style={{ left: `${t}%` }}
              />
            );
          })}
        </div>

        {/* Active range with gradient */}
        <div
          className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-[0_0_0_1px_rgba(249,115,22,0.25)]"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />

        {/* Min handle */}
        <button
          type="button"
          onPointerDown={handleHandlePointerDown("min")}
          onKeyDown={handleKey("min")}
          aria-label="Minimum price"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMin}
          aria-valuetext={fmt(valueMin)}
          role="slider"
          className={`absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
            activeHandle === "min" ? "scale-110" : "hover:scale-105"
          }`}
          style={{ left: `${minPct}%`, width: 22, height: 22, borderColor: "#f97316", borderWidth: 3, borderStyle: "solid" }}
        />

        {/* Max handle */}
        <button
          type="button"
          onPointerDown={handleHandlePointerDown("max")}
          onKeyDown={handleKey("max")}
          aria-label="Maximum price"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={fmt(valueMax)}
          role="slider"
          className={`absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
            activeHandle === "max" ? "scale-110" : "hover:scale-105"
          }`}
          style={{ left: `${maxPct}%`, width: 22, height: 22, borderColor: "#f97316", borderWidth: 3, borderStyle: "solid" }}
        />

        {/* Min tooltip — always visible, pulses while dragging */}
        <div
          className={`pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white shadow-md transition-opacity ${
            activeHandle === "min" ? "opacity-100 scale-105" : "opacity-90"
          }`}
          style={{ left: `${minPct}%` }}
        >
          {fmt(valueMin)}
          <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900" />
        </div>

        {/* Max tooltip */}
        <div
          className={`pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] font-black text-white shadow-md transition-opacity ${
            activeHandle === "max" ? "opacity-100 scale-105" : "opacity-90"
          }`}
          style={{ left: `${maxPct}%` }}
        >
          {fmt(valueMax)}
          <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900" />
        </div>
      </div>

      {/* Range labels */}
      <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-ink-tertiary">
        <span>₹0</span>
        <span>₹{max.toLocaleString("en-IN")}+</span>
      </div>
    </div>
  );
}
