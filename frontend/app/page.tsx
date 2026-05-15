"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, BookOpen, Cpu, FlaskConical,
  MapPin, PackageOpen, Plus, Search, 
  Stethoscope, TrendingUp, UsersRound,
} from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import { getProducts } from "@/services/api";
import type { Product, ProductFilters } from "@/lib/types";

const staggerContainer: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

const categoryGroups = [
  {
    title: "Engineering",
    items: [
      { label: "JEE", icon: Cpu, category: "jee" as const },
      { label: "EAPCET", icon: FlaskConical, category: "eapcet" as const },
    ]
  },
  {
    title: "Medical",
    items: [
      { label: "NEET", icon: Stethoscope, category: "neet" as const },
      { label: "EAPCET", icon: FlaskConical, category: "eapcet" as const },
    ]
  },
  {
    title: "State Board",
    items: [
      { label: "IPE", icon: BookOpen, category: "ipe" as const }
    ]
  }
];

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-soft dark:bg-white/10">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 rounded-full w-3/4" />
        <div className="skeleton h-4 rounded-full w-1/2" />
        <div className="flex gap-2">
          <div className="skeleton h-6 rounded-full w-20" />
          <div className="skeleton h-6 rounded-full w-28" />
        </div>
        <div className="skeleton h-9 rounded-full w-full mt-2" />
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-[28px] bg-white p-4 shadow-soft dark:bg-white/10 sm:p-5">
      <div className="skeleton h-4 rounded-full w-2/3 mb-3" />
      <div className="skeleton h-9 rounded-full w-1/2" />
    </div>
  );
}

export default function HomePage() {
  const [filters, setFilters] = useState<ProductFilters>({ sort: "newest" });
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setLoadingProducts(true);
    getProducts(filters).then((data) => {
      setProducts(data);
      setLoadingProducts(false);
    });
  }, [filters]);

  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);
  const ipeCount = useMemo(() => products.filter((p) => p.category === "ipe").length, [products]);
  const eapcetCount = useMemo(() => products.filter((p) => p.category === "eapcet").length, [products]);
  const jeeCount = useMemo(() => products.filter((p) => p.category === "jee").length, [products]);
  const neetCount = useMemo(() => products.filter((p) => p.category === "neet").length, [products]);
  const colleges = useMemo(() => Array.from(new Set(products.map((p) => p.college))).slice(0, 4), [products]);

  function applyCategory(category: ProductFilters["category"]) {
    setVisibleCount(6);
    setFilters({ ...filters, category, sort: filters.sort || "newest" });
    document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const stats = [
    { label: "IPE Books", value: ipeCount, icon: BookOpen },
    { label: "EAPCET Books", value: eapcetCount, icon: FlaskConical },
    { label: "JEE Books", value: jeeCount, icon: Cpu },
    { label: "NEET Books", value: neetCount, icon: Stethoscope },
  ];

  return (
    <main className="min-h-screen bg-[#f8f6f3] text-ink dark:bg-slate-950 pb-nav">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-7">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-orange-500 sm:text-sm">
              <TrendingUp size={16} />
              Student Marketplace
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-5">
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
                Buy &amp; Sell
                <br />
                Used College
                <br />
                Essentials
              </h1>
              <p className="max-w-xl text-base font-medium leading-relaxed text-ink-secondary sm:text-lg">
                Find affordable IPE, EAPCET, JEE, and NEET preparation books from students around your college.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <a href="#listings" className="btn-primary px-6 py-3.5 text-sm sm:px-8 sm:py-4 sm:text-base">
                <Search size={19} />
                Explore Listings
              </a>
              <Link href="/post" className="btn-secondary px-6 py-3.5 text-sm sm:px-8 sm:py-4 sm:text-base">
                <Plus size={19} />
                Sell Your Item
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid max-w-2xl grid-cols-2 gap-3 pt-1 sm:grid-cols-4 sm:gap-4">
              {loadingProducts
                ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
                : stats.map((stat) => (
                  <div key={stat.label} className="rounded-[24px] bg-white p-4 shadow-soft dark:bg-white/10">
                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink-secondary">
                      <stat.icon size={15} className="text-orange-500" />
                      <span className="truncate">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-black sm:text-3xl">{stat.value}</p>
                  </div>
                ))}
            </motion.div>
          </motion.div>

          {/* Hero image — hidden on mobile to keep layout clean */}
          <motion.div
            initial={{ opacity: 0, x: 42 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.28 }}
            className="relative hidden lg:block min-h-[610px]"
          >
            <div className="absolute -left-5 -top-5 h-32 w-32 rounded-full bg-orange-200 blur-3xl" />
            <img
              src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1400&auto=format&fit=crop"
              alt="Students browsing books in a library"
              className="relative h-[610px] w-full rounded-[34px] object-cover shadow-2xl"
            />
            <div className="absolute bottom-5 left-5 right-5 rounded-[26px] bg-white/92 p-5 shadow-soft backdrop-blur dark:bg-slate-950/88">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-500">Campus-ready</p>
              <p className="mt-2 text-lg font-black">Engineering & Medical prep books from real student listings.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500 sm:text-sm">Shop by need</p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl">Popular Categories</h2>
          </div>
          <button onClick={() => applyCategory("")} className="text-sm font-black text-orange-500 hover:underline">
            View All
          </button>
        </div>

        {/* Category Groups */}
        <div className="grid gap-6 sm:grid-cols-3">
          {categoryGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-border/10 bg-white p-5 shadow-soft dark:bg-white/5">
              <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-ink-secondary">{group.title}</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {group.items.map(({ label, icon: Icon, category }) => (
                  <button
                    key={label}
                    onClick={() => applyCategory(category)}
                    className="group flex-none w-32 rounded-[20px] border border-transparent bg-[#f8f6f3] p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-orange-100 hover:bg-orange-50 hover:shadow-soft-lg dark:bg-white/10 dark:hover:bg-orange-500/10"
                  >
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:bg-white/10">
                      <Icon size={20} />
                    </span>
                    <span className="block text-xs font-black sm:text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Listings ── */}
      <section id="listings" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <SearchBar
          filters={filters}
          resultCount={products.length}
          onChange={(nextFilters) => {
            setVisibleCount(6);
            setFilters(nextFilters);
          }}
        />

        <div className="mb-7 mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500 sm:text-sm">Live marketplace</p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl sm:text-4xl">Trending Listings</h2>
            <p className="mt-1.5 text-sm font-medium text-ink-secondary sm:text-base">
              Sorted by{" "}
              {filters.sort === "price_asc" ? "lowest price" : filters.sort === "price_desc" ? "highest price" : "newest arrivals"}.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black shadow-soft dark:bg-white/10">
            <PackageOpen size={16} className="text-orange-500" />
            {products.length} items available
          </div>
        </div>

        {loadingProducts ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:gap-7">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : visibleProducts.length ? (
          <>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:gap-7"
            >
              {visibleProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </motion.div>

            {visibleProducts.length < products.length && (
              <div className="flex justify-center pt-10">
                <button onClick={() => setVisibleCount((c) => c + 6)} className="btn-secondary px-8 py-4">
                  Load More Listings
                </button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid min-h-[320px] place-items-center rounded-[34px] border border-dashed border-border/20 bg-white p-8 text-center shadow-soft dark:bg-white/10"
          >
            <div className="mx-auto max-w-md space-y-5">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-500 dark:bg-orange-500/15">
                <PackageOpen size={38} />
              </div>
              <div>
                <h3 className="text-2xl font-black">No Listings Found</h3>
                <p className="mt-3 text-sm text-ink-secondary sm:text-base">
                  Try adjusting your filters or check back later when students post new items.
                </p>
              </div>
              <button onClick={() => setFilters({ sort: "newest" })} className="btn-primary mt-4">
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
      </section>

      {/* ── Active Campuses ── */}
      {colleges.length > 0 && (
        <section className="border-y border-border/10 bg-white/55 py-10 dark:bg-white/5">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
            <div className="text-center md:text-left">
              <h2 className="flex items-center justify-center gap-2 text-xl font-black md:justify-start sm:text-2xl">
                <UsersRound className="text-orange-500" /> Active Campuses
              </h2>
              <p className="mt-2 text-sm text-ink-secondary sm:text-base">Filter listings from colleges already active on SellChey.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {colleges.map((college) => (
                <button
                  key={college}
                  onClick={() => { setVisibleCount(6); setFilters({ college, sort: "newest" }); }}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black shadow-soft transition-colors hover:bg-orange-50 dark:bg-white/10"
                >
                  <MapPin size={14} className="text-orange-500" />
                  {college}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="relative overflow-hidden rounded-[30px] bg-slate-900 p-7 text-white shadow-soft-lg sm:p-10 lg:p-14">
          <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1fr_340px]">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-orange-400 sm:text-sm">Student Deals</p>
              <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Save More on<br />College Essentials
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-slate-300 sm:text-lg">
                Buy affordable second-hand prep books from students near you and save on your preparation.
              </p>
              <a
                href="#listings"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 font-black text-white transition-colors hover:bg-orange-600 sm:px-8 sm:py-4"
              >
                Start Browsing
                <ArrowRight size={18} />
              </a>
            </div>
            <img
              src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1400&auto=format&fit=crop"
              alt="Stack of books"
              className="hidden h-[280px] w-full rounded-[24px] object-cover shadow-2xl md:block lg:h-[360px]"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/10 bg-white dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-xl font-black">
              Sell<span className="text-orange-500">Chey</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
              India's student marketplace for Engineering and Medical prep books.
            </p>
          </div>
          <div>
            <button
              onClick={() => document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="mb-3 block font-black hover:text-orange-500 transition-colors"
            >
              Marketplace
            </button>
            <ul className="space-y-2 text-sm text-ink-secondary">
              {(["ipe", "eapcet", "jee", "neet"] as const).map((cat) => (
                <li key={cat}>
                  <button onClick={() => applyCategory(cat)} className="hover:text-orange-500 transition-colors uppercase font-semibold text-xs tracking-wider">
                    {cat} Books
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-black">Company</h4>
            <ul className="space-y-2 text-sm text-ink-secondary">
              <li><span className="hover:text-orange-500 transition-colors cursor-pointer">About</span></li>
              <li><span className="hover:text-orange-500 transition-colors cursor-pointer">Support</span></li>
              <li><span className="hover:text-orange-500 transition-colors cursor-pointer">Contact</span></li>
              <li><span className="hover:text-orange-500 transition-colors cursor-pointer">Privacy Policy</span></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-black">Get Started</h4>
            <Link href="/post" className="btn-primary text-sm">
              <Plus size={16} />
              Post Listing
            </Link>
          </div>
        </div>
        <div className="border-t border-border/10 py-5 text-center text-xs text-ink-tertiary sm:text-sm">
          © 2026 SellChey. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
