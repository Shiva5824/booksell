"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Cpu, PackageOpen, Plus, TrendingUp, UsersRound, Zap, Award, MapPin } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import { getProducts } from "@/services/api";
import type { Product, ProductFilters } from "@/lib/types";

const staggerContainer: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function HomePage() {
  const [filters, setFilters] = useState<ProductFilters>({ sort: "newest" });
  const [products, setProducts] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    getProducts(filters).then(setProducts);
  }, [filters]);

  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);
  const activeProducts = useMemo(() => products.filter((product) => product.status === "active"), [products]);
  const bookCount = useMemo(() => products.filter((product) => product.category === "book").length, [products]);
  const equipmentCount = products.length - bookCount;
  const colleges = useMemo(() => Array.from(new Set(products.map((product) => product.college))).slice(0, 3), [products]);
  const leadProduct = visibleProducts[0] || products[0];

  return (
    <main className="bg-background relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[100px]"
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 border-b border-border pb-16 pt-20 lg:pt-28">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            {/* Left Side - Hero Content */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="flex flex-col justify-between gap-8"
            >
              {/* Badges */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full glass border-primary/20 px-4 py-2 text-sm font-bold text-primary shadow-glow-primary">
                  <Zap size={16} className="animate-pulse" />
                  Trending Now
                </span>
                <span className="inline-flex items-center gap-2 rounded-full glass border-accent/20 px-4 py-2 text-sm font-bold text-accent">
                  <Award size={16} />
                  Top Rated
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.div variants={fadeUp} className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                  Find & Sell <br />
                  <span className="text-gradient">Campus Essentials</span>
                </h1>
                <p className="text-lg sm:text-xl text-ink-secondary leading-relaxed max-w-2xl font-medium">
                  Connect with verified sellers on campus. Buy textbooks, equipment, and more with confidence. Post your items in minutes.
                </p>
              </motion.div>

              {/* Stats */}
              <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 sm:gap-6 mt-4">
                {[
                  { label: "Active Listings", value: activeProducts.length, icon: TrendingUp, color: "text-primary" },
                  { label: "Books", value: bookCount, icon: BookOpen, color: "text-secondary" },
                  { label: "Equipment", value: equipmentCount, icon: Cpu, color: "text-accent" },
                ].map((stat, i) => (
                  <div key={i} className="rounded-2xl glass p-4 sm:p-5 hover:shadow-soft-lg transition-all duration-300">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-ink-secondary mb-3">
                      <stat.icon size={16} className={stat.color} />
                      <span className="truncate">{stat.label}</span>
                    </div>
                    <p className="text-3xl sm:text-4xl font-black text-ink">{stat.value}</p>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-4 pt-4">
                <Link href="/post" className="btn-primary text-base px-8 py-4">
                  <Plus size={22} />
                  Start Selling
                </Link>
                <a href="#listings" className="btn-secondary text-base px-8 py-4">
                  Browse Listings
                  <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </motion.div>
            </motion.div>

            {/* Right Side - Featured */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[3rem] blur-2xl -z-10 transform rotate-6 scale-95" />
              <div className="rounded-[2.5rem] glass p-6 shadow-2xl border-white/10">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Zap size={16} /> Spotlight
                    </p>
                    <h3 className="font-bold text-ink text-xl line-clamp-1 mt-1">{leadProduct?.title || "Latest Arrival"}</h3>
                  </div>
                  {leadProduct && (
                    <span className="rounded-xl bg-accent/20 border border-accent/30 px-3 py-1.5 text-sm font-bold text-accent shrink-0">
                      ₹{leadProduct.price.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {leadProduct ? (
                  <div className="scale-[1.02] transform-origin-top">
                    <ProductCard product={leadProduct} />
                  </div>
                ) : (
                  <div className="grid min-h-[400px] place-items-center rounded-2xl bg-surface-secondary text-ink-tertiary">
                    <PackageOpen size={48} className="animate-pulse" />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Listings Section */}
      <section id="listings" className="relative z-10 mx-auto max-w-7xl px-4 py-16 lg:py-24">
        <SearchBar
          filters={filters}
          resultCount={products.length}
          onChange={(nextFilters) => {
            setVisibleCount(6);
            setFilters(nextFilters);
          }}
        />

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-12 mb-8"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">Explore Market</h2>
            <p className="text-base font-medium text-ink-secondary mt-2">
              Sorted by <span className="text-primary font-bold">{filters.sort === "price_asc" ? "lowest price" : filters.sort === "price_desc" ? "highest price" : "newest arrivals"}</span>
            </p>
          </div>
          <div className="rounded-xl glass px-5 py-2.5 text-sm font-bold text-ink shadow-soft inline-flex items-center gap-2">
            <PackageOpen size={18} className="text-primary" />
            {products.length} items available
          </div>
        </motion.div>

        {/* Products Grid */}
        {visibleProducts.length ? (
          <>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8"
            >
              {visibleProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </motion.div>

            {/* Load More Button */}
            {visibleProducts.length < products.length && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex justify-center pt-12"
              >
                <button
                  onClick={() => setVisibleCount((count) => count + 6)}
                  className="btn-secondary px-8 py-4 rounded-full"
                >
                  Load More Listings
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid min-h-[400px] place-items-center rounded-3xl border border-dashed border-border glass p-8 text-center"
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
                <h3 className="text-2xl font-black text-ink">No Listings Found</h3>
                <p className="text-ink-secondary mt-3 text-base">We couldn't find any items matching your filters. Try adjusting them or check back later.</p>
              </div>
              <button
                onClick={() => setFilters({ sort: "newest" })}
                className="btn-primary mt-6 w-full sm:w-auto"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
      </section>

      {/* Campus Coverage Marquee or List */}
      {colleges.length > 0 && (
        <section className="relative z-10 border-y border-border bg-surface-secondary/30 py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-black text-ink flex items-center justify-center md:justify-start gap-2">
                  <UsersRound className="text-primary" /> Active Campuses
                </h2>
                <p className="text-ink-secondary mt-2">Find items specifically from these verified colleges.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {colleges.map((college) => (
                  <button
                    key={college}
                    onClick={() => setFilters({ college, sort: "newest" })}
                    className="glass px-6 py-3 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
                  >
                    <MapPin size={16} className="text-primary" />
                    {college}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative z-10 border-t border-border bg-gradient-to-br from-primary/20 via-surface-elevated to-secondary/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 lg:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-6 text-ink tracking-tight">Ready to turn clutter into cash?</h2>
            <p className="text-lg sm:text-xl text-ink-secondary mb-10 max-w-2xl mx-auto font-medium">
              Join hundreds of verified sellers on campus. List your items in less than 2 minutes and start earning today.
            </p>
            <Link href="/post" className="inline-flex items-center gap-3 bg-ink text-background font-black px-8 py-4 rounded-full hover:scale-105 hover:shadow-soft transition-all duration-300 active:scale-95 text-lg">
              <Plus size={24} />
              Post Your First Item
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
